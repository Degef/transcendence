from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from .forms import UserRegisterForm, UserUpdateForm, ProfileUpdateForm, CustomAuthenticationForm
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.decorators import login_required
import requests
from django.contrib.auth.models import User
from django.contrib.auth import login as auth_login, update_session_auth_hash, authenticate, logout as auth_logout
from django.core.files.temp import NamedTemporaryFile
from django.core.files import File
from .models import Profile, Friendship
from apps.pong.models import Game
from dotenv import load_dotenv
import os
from django.http import JsonResponse
from django.db.models import Q
import logging
logger = logging.getLogger(__name__)
from django.core.serializers import serialize
from django_ratelimit.decorators import ratelimit
import json
from django.contrib.auth.password_validation import validate_password, ValidationError
from django.urls import reverse
from django.db import transaction

load_dotenv()

def get_ipaddress(request):
	IP  = os.getenv('IP_ADDRESS')
	CLIENT_ID = os.getenv('UID_42')
	SECRET = os.getenv('SECRET_42')

	if not IP or not CLIENT_ID or not SECRET:
		return JsonResponse({'error': 'Missing environment configuration'})
	
	data = {
		'ip': IP,
		'client_id': CLIENT_ID,
		'redirectUri': f'https://{IP}/',
		'secret': SECRET,
	}
	return JsonResponse(data)


@ratelimit(key='ip', rate='5/m', method='POST', block=True)
def login(request):
	if request.method == 'POST':
		form = CustomAuthenticationForm(request, data=request.POST)
		if form.is_valid():
			username = form.cleaned_data.get('username')
			if len(username) > 14:
				return JsonResponse({'success': False, 'message': 'Username must be 14 characters or less.'})
			password = form.cleaned_data.get('password')
			user = authenticate(username=username, password=password)
			if user is not None:
				auth_login(request, user)
				return JsonResponse({'success': True, 'message': 'You are now logged in.'})
			else:
				return JsonResponse({'success': False, 'message': 'Invalid username or password.'})
		else:
			errors = form.errors.as_json()
			return JsonResponse({'success': False, 'errors': errors})
	else:
		form = CustomAuthenticationForm()
	return render(request, 'login.html', {'form': form})

def limit(request):
	return render(request, '403.html')

def logout(request):
	with transaction.atomic():
		user_thing = request.user.user_things
		user_thing.status = 'offline'
		user_thing.save()
	auth_logout(request)
	return render(request, 'landing.html')

def register(request):
	if request.method == 'POST':
		form = UserRegisterForm(request.POST)
		if form.is_valid():
			username = form.cleaned_data.get('username')
			if len(username) > 14:
				return JsonResponse({'success': False, 'message': 'Username must be 14 characters or less.'})
			password = form.cleaned_data.get('password1')
			form.save()
			user = authenticate(username=username, password=password)
			auth_login(request, user)
			with transaction.atomic():
				user_thing = request.user.user_things
				user_thing.status = 'online'
				user_thing.save()
			return JsonResponse({'success': True, 'message': 'Your account has been created.'})
		else:
			errors = form.errors.as_json()
			return JsonResponse({'success': False, 'errors': errors})
	else:
		form = UserRegisterForm()
	return render(request, 'signup.html', {'form': form})


def get_total_wins(userid, since=None):
	if since:
		total_wins = Game.objects.filter(winner=userid, date__gte=since).count()
	else:
		total_wins = Game.objects.filter(winner=userid).count()
	return total_wins

def get_total_losses(userid, since=None):
	if since:
		total_losses = Game.objects.filter(
			(Q(player1=userid) | Q(player2=userid)),
			date__gte=since
		).exclude(winner=userid).count()
	else:
		total_losses = Game.objects.filter(
			Q(player1=userid) | Q(player2=userid)
		).exclude(winner=userid).count()
	return total_losses


def get_win_rate(total_wins, total_losses):
	total_games = total_wins + total_losses
	if total_games == 0:
		return 0
	win_rate = (total_wins / total_games) * 100
	return win_rate


@login_required
def profile(request, user=''):
	logger.debug(f"\n\n\n${request.META['HTTP_USER_AGENT']}\n\n\n")
	user_to_view = request.user if user == '' else get_object_or_404(User, username=user)
	is_own_profile = user_to_view == request.user
	games = Game.objects.filter(Q(player1=user_to_view) | Q(player2=user_to_view)).order_by('-date')
	games_data = serialize('json', games)

	total_wins = get_total_wins(user_to_view.id)
	total_losses = get_total_losses(user_to_view.id)
	total_games = total_wins + total_losses
	win_rate = get_win_rate(total_wins, total_losses)
	profile_image = Profile.objects.filter(user=user_to_view).first().image

	all_users = User.objects.all().exclude(username=user_to_view.username)
	friends = User.objects.filter(
		Q(friendship_requests_sent__to_user=user_to_view, friendship_requests_sent__status=Friendship.ACCEPTED) |
		Q(friendship_requests_received__from_user=user_to_view, friendship_requests_received__status=Friendship.ACCEPTED)
	)
	pending_requests = User.objects.filter(
		friendship_requests_sent__to_user=user_to_view, 
		friendship_requests_sent__status=Friendship.REQUESTED
	)
	non_friends = all_users.difference(friends).difference(pending_requests)
	
	received_requests = User.objects.filter(
		friendship_requests_received__to_user=user_to_view, 
		friendship_requests_received__status=Friendship.REQUESTED
	) if is_own_profile else []

	is_online = user_to_view.user_things.status == 'online'

	sent_request = Friendship.objects.filter(from_user=request.user, to_user=user_to_view, status=Friendship.REQUESTED).exists()
	received_request = Friendship.objects.filter(from_user=user_to_view, to_user=request.user, status=Friendship.REQUESTED).exists()
	are_friends = Friendship.objects.filter(
		Q(from_user=request.user, to_user=user_to_view) | Q(from_user=user_to_view, to_user=request.user),
		status=Friendship.ACCEPTED
	).exists()

	context = {
		'username': user_to_view.username,
		'total_wins': total_wins,
		'total_losses': total_losses,
		'total_games': total_games,
		'win_rate': win_rate,
		'is_own_profile': is_own_profile,
		'profile_image': profile_image,
		'friends': friends,
		'pending_requests': pending_requests,
		'non_friends': non_friends,
		'games': games,
		'games2': games_data,
		'is_online': is_online,
		'sent_request': sent_request,
		'received_request': received_request,
		'are_friends': are_friends,
		'received_requests': pending_requests,
	}
	return render(request, 'profile.html', context)

@login_required
def send_friend_request(request, username):
	to_user = get_object_or_404(User, username=username)

	# Check if a friendship already exists
	existing_friendship = Friendship.objects.filter(
		Q(from_user=request.user, to_user=to_user) | Q(from_user=to_user, to_user=request.user)
	).first()

	if existing_friendship:
		if existing_friendship.status == Friendship.REQUESTED:
			if existing_friendship.from_user == request.user:
				messages.info(request, f'Friend request already sent to {username}')
			else:
				messages.info(request, f'{username} has already sent you a friend request')
		elif existing_friendship.status == Friendship.ACCEPTED:
			messages.info(request, f'You are already friends with {username}')
	else:
		Friendship.objects.create(from_user=request.user, to_user=to_user, status=Friendship.REQUESTED)
		messages.success(request, f'Friend request sent to {username}')

	return redirect('profile', user=username)

@login_required
def accept_friend_request(request, username):
	from_user = get_object_or_404(User, username=username)
	friendship = get_object_or_404(Friendship, from_user=from_user, to_user=request.user)
	friendship.status = Friendship.ACCEPTED
	friendship.save()
	messages.success(request, f'Friend request from {username} accepted')
	return redirect('profile', user=username)

@login_required
def remove_friend(request, username):
    to_user = get_object_or_404(User, username=username)
    Friendship.objects.filter(
        Q(from_user=request.user, to_user=to_user) | Q(from_user=to_user, to_user=request.user),
        status=Friendship.ACCEPTED
    ).delete()
    messages.success(request, f'Removed {username} from friends')
    return redirect('profile', user=request.user.username)

@login_required
def cancel_friend_request(request, username):
	to_user = get_object_or_404(User, username=username)
	Friendship.objects.filter(from_user=request.user, to_user=to_user, status=Friendship.REQUESTED).delete()
	messages.success(request, f'Friend request to {username} cancelled')
	return redirect('profile', user=username)

@login_required
def decline_friend_request(request, username):
	from_user = get_object_or_404(User, username=username)
	Friendship.objects.filter(from_user=from_user, to_user=request.user, status=Friendship.REQUESTED).delete()
	messages.success(request, f'Friend request from {username} declined')
	return redirect('profile', user=request.user)


@login_required
def edit_profile(request):
	user = request.user

	if request.method == 'POST':
		user_form = UserUpdateForm(request.POST, instance=user)
		profile_form = ProfileUpdateForm(request.POST, request.FILES, instance=user.profile)

		if user_form.is_valid() and profile_form.is_valid():
			password = user_form.cleaned_data.get('password')

			if password:
				try:
					validate_password(password, user=user)
					user.set_password(password)
				except ValidationError as ve:
					password_errors = json.dumps(ve.messages)
					logger.warning(f"Password validation errors for user {user.username}: {password_errors}")
					return JsonResponse({'success': False, 'errors': password_errors})

			try:
				user_form.save()
				profile_form.save()
				if password:
					user.save()
					update_session_auth_hash(request, user)

				logger.info(f"Profile for user {user.username} updated successfully.")
				return JsonResponse({'success': True, 'message': 'Profile updated successfully.'})
			except Exception as e:
				logger.error(f"Error updating profile for user {user.username}: {e}")
				return JsonResponse({'success': False, 'message': 'An error occurred while updating the profile. Please try again.'})
		else:
			user_form_errors = json.dumps(user_form.errors)
			logger.warning(f"User form errors for user {user.username}: {user_form_errors}")
			return JsonResponse({'success': False, 'errors': user_form_errors})
	else:
		user_form = UserUpdateForm(instance=user)
		profile_form = ProfileUpdateForm(instance=user.profile)

	context = {
		'user_form': user_form,
		'profile_form': profile_form,
	}
	return render(request, 'users/profile-update.html', context)

@login_required
def delete_profile(request):
	if request.method == 'POST':
		try:
			user = request.user
			user.delete()
			return JsonResponse({'success': True, 'message': 'Your account has been deleted successfully.'})
		except Exception as e:
			return JsonResponse({'success': False, 'error': str(e)})
	else:
		return JsonResponse({'success': False, 'error': 'Invalid request method.'})


def exchange_code(request):
	code = request.GET.get('code')
	IP  = os.getenv('IP_ADDRESS')

	token_url = 'https://api.intra.42.fr/oauth/token'
	client_id = os.getenv('UID_42')
	client_secret = os.getenv('SECRET_42')
	redirect_uri = 'https://' + IP
	grant_type = 'authorization_code'

	# Request parameters
	params = {
		'client_id': client_id,
		'client_secret': client_secret,
		'code': code,
		'redirect_uri': f'https://{IP}/',
		'grant_type': grant_type,
	}
	# # Exchange code for access token using POST request
	token_response = requests.post(token_url, data=params).json()
	logger.info(f"\n\n\nToken received: {token_response}\n\n\n")
	# print("Token received")
	# print(token_response)
	if 'access_token' in token_response:
		access_token = token_response['access_token']
		user_url = 'https://api.intra.42.fr/v2/me'
		user_response = requests.get(user_url, headers={'Authorization': f'Bearer {access_token}'}).json()

		# Now you have user data, you can use it as needed
		user_name = user_response['login']
		user_email = user_response['email']

		# Check if a user with the same username already exists
		existing_user = User.objects.filter(username=user_name).first()

		if existing_user:
			auth_login(request, existing_user)
			return redirect('home')

		img_url = user_response['image']['versions']['small']
		# Create a new user
		user = User.objects.create(username=user_name, email=user_email)
		logger.info(f"\n\n\nNew user {user_name} created successfully.\n\n\n")
		img_temp = NamedTemporaryFile(delete=True)
		img_temp.write(requests.get(img_url).content)
		img_temp.flush()
		login(request, user)
		text = render(request, 'pong/home.html')
		existing_profile = Profile.objects.filter(user=user).first()
		existing_profile.image.save(f"{user_name}_profile_image.jpg",File(img_temp))
		return text
	return redirect('home')
	# return render(request, 'pong/home.html', context)
