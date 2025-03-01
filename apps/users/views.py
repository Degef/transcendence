from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from .forms import UserRegisterForm, UserUpdateForm, ProfileUpdateForm, CustomAuthenticationForm
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET
import requests
from django.contrib.auth.models import User
from django.contrib.auth import login as auth_login, update_session_auth_hash, authenticate, logout as auth_logout
from django.core.files.temp import NamedTemporaryFile
from django.core.files import File
from .models import Profile, Friendship, user_things
from apps.pong.models import Game, Leaderboard, Tournament
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
from django.core.paginator import Paginator
from faker import Faker
import requests
from asgiref.sync import sync_to_async


load_dotenv()

async def get_all_games_of_tournaments(username):
	# Step 1: Get all tournaments that the user has participated in
	tournaments = await sync_to_async(Tournament.objects.filter)(
		Q(game__player1__username=username) | Q(game__player2__username=username)
	).distinct()

	# Step 2: Get all games that are tournament games where the user is involved
	tournament_games = await sync_to_async(Game.objects.filter)(
		Q(is_tournament_game=True),
		Q(tournament__in=tournaments)
	).select_related('tournament')

	# Step 3: Extract the tournament IDs
	tournament_ids = tournament_games.values_list('tournament_id', flat=True).distinct()

	# Step 4: Get all games for those tournaments
	all_games = await sync_to_async(Game.objects.filter)(
		Q(tournament__id__in=tournament_ids)
	).select_related('tournament').order_by('tournament_id')

	return all_games

def getTemplateName(request, defaultpage):
	request_type = "normal" if request.headers.get('X-Requested-With') == 'XMLHttpRequest' else "reload"
	template_name = 'loader.html' if request_type == "reload" else defaultpage
	# logger.error(f"I am here please look at the request_type: {request_type}  the htmlpage is: {template_name}\n\n\n")
	return template_name


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
			password = form.cleaned_data.get('password')
			user = authenticate(username=username, password=password)
			if user is not None:
				auth_login(request, user)
				return JsonResponse({'success': True, 'message': 'You are now logged in'})
			else:
				return JsonResponse({'success': False, 'message': 'Invalid Invalid credentials'})
		else:
			errors = form.errors.as_json()
			return JsonResponse({'success': False, 'errors': errors})
	else:
		form = CustomAuthenticationForm()
	context = {
		'form': form,
		'template_name': 'login.html'
	}
	template_name = getTemplateName(request, 'login.html')
	return render(request, template_name, context)

def limit(request):
	context = {
		'template_name': '403.html'
	}
	template_name = getTemplateName(request, '403.html')
	return render(request, template_name, context)

@login_required
def logout(request):
	try:
		with transaction.atomic():
			user_thing = request.user.user_things
			user_thing.status = 'offline'
			user_thing.save()
		auth_logout(request)
	except:
		pass
	context = {
		'template_name': 'landing.html'
	}
	template_name = getTemplateName(request, 'landing.html')
	return render(request, template_name, context)

@ratelimit(key='ip', rate='5/m', method='POST', block=True)
def register(request):
	if request.method == 'POST':
		form = UserRegisterForm(request.POST)
		if form.is_valid():
			form.save()
			return JsonResponse({'success': True, 'message': 'Your account has been created.'})
		else:
			errors = form.errors.as_json()
			return JsonResponse({'success': False, 'errors': errors})
	else:
		form = UserRegisterForm()
	context = {
		'form': form,
		'template_name': 'signup.html'
	}
	template_name = getTemplateName(request, 'signup.html')
	return render(request, template_name, context)


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
	user_to_view = request.user if user == '' else get_object_or_404(User, username=user)
	is_own_profile = user_to_view == request.user
	games = Game.objects.filter(Q(player1=user_to_view) | Q(player2=user_to_view)).order_by('-date')
	
	paginator = Paginator(games, 8)
	page_number = request.GET.get('page')
	page_obj = paginator.get_page(page_number)
	
	games_data = serialize('json', games)
	
	total_wins = Leaderboard.objects.get_or_create(user=user_to_view)[0].wins
	total_losses = Leaderboard.objects.get_or_create(user=user_to_view)[0].losses
	win_rate = Leaderboard.objects.get_or_create(user=user_to_view)[0].win_rate
	total_games = total_wins + total_losses
	profile_image = Profile.objects.filter(user=user_to_view).first().image
	
	all_users = User.objects.all().exclude(username=user_to_view.username)
	friends = User.objects.filter(
		Q(friendship_requests_sent__to_user=user_to_view, friendship_requests_sent__status=Friendship.ACCEPTED) |
		Q(friendship_requests_received__from_user=user_to_view, friendship_requests_received__status=Friendship.ACCEPTED)
	).distinct()
	pending_requests = User.objects.filter(
		friendship_requests_sent__to_user=user_to_view, 
		friendship_requests_sent__status=Friendship.REQUESTED
	)
	
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

	is_anonymous = user_to_view.user_things.is_anonymous
	is_logged_in_with_42 = user_to_view.user_things.logged_in_with_42
	
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
		'games': page_obj,
		'games2': games_data,
		'is_online': is_online,
		'sent_request': sent_request,
		'received_request': received_request,
		'are_friends': are_friends,
		'received_requests': received_requests,
		'is_anonymous': is_anonymous,
		'is_logged_in_with_42': is_logged_in_with_42,
		'template_name': 'profile.html'
	}
	template_name = getTemplateName(request, 'profile.html')
	return render(request, template_name, context)

@login_required
def anonymize_user(request):
	user = request.user
	faker = Faker()
	user.username = faker.user_name()
	exists = User.objects.filter(username=user.username).exists()
	while exists:
		user.username = faker.user_name()
		exists = User.objects.filter(username=user.username).exists()
	user.email = faker.email()
	auth_login(request, user)
	user.save()

	try:
		profile = Profile.objects.get(user=user)
		profile_picture_url = 'https://picsum.photos/200'
		response = requests.get(profile_picture_url)
		img_temp = NamedTemporaryFile(delete=True)
		img_temp.write(response.content)
		img_temp.flush()

		profile.image.save(f"{user.username}_profile_image.jpg", File(img_temp), save=True)
	except Profile.DoesNotExist:
		pass
	
	update_attribute = user_things.objects.get(user=user)
	with transaction.atomic():
		update_attribute.is_anonymous = True
		update_attribute.save()
	
	return redirect('home')


@login_required
def list_of_all_username_json(request):
    users = User.objects.all().exclude(username=request.user.username).values('username')
    return JsonResponse(list(users), safe=False)

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

	return redirect('profile', user=username)

@login_required
def accept_friend_request(request, username):
	from_user = get_object_or_404(User, username=username)
	friendship = get_object_or_404(Friendship, from_user=from_user, to_user=request.user)
	with transaction.atomic():
		friendship.status = Friendship.ACCEPTED
		friendship.save()
	return redirect('profile', user=username)

@login_required
def remove_friend(request, username):
	to_user = get_object_or_404(User, username=username)
	Friendship.objects.filter(
		Q(from_user=request.user, to_user=to_user) | Q(from_user=to_user, to_user=request.user),
		status=Friendship.ACCEPTED
	).delete()
	return redirect('profile', user=request.user.username)

@login_required
def cancel_friend_request(request, username):
	to_user = get_object_or_404(User, username=username)
	Friendship.objects.filter(from_user=request.user, to_user=to_user, status=Friendship.REQUESTED).delete()
	return redirect('profile', user=username)

@login_required
def decline_friend_request(request, username):
	from_user = get_object_or_404(User, username=username)
	Friendship.objects.filter(from_user=from_user, to_user=request.user, status=Friendship.REQUESTED).delete()
	return redirect('profile', user=request.user)


@login_required
def edit_profile(request):
	user = request.user

	if request.method == 'POST':
		user_form = UserUpdateForm(request.user, request.POST, instance=user)
		profile_form = ProfileUpdateForm(request.POST, request.FILES, instance=user.profile)

		if user_form.is_valid() and profile_form.is_valid():
			try:
				user_form.save()
				profile_form.save()
				return JsonResponse({'success': True, 'message': 'Profile updated successfully.'})
			except Exception as e:
				return JsonResponse({'success': False, 'message': 'An error occurred while updating the profile. Please try again.'})
		else:
			user_form_errors = json.dumps(user_form.errors)
			return JsonResponse({'success': False, 'errors': user_form_errors})
	else:
		user_form = UserUpdateForm(request.user, instance=request.user)
		profile_form = ProfileUpdateForm(instance=user.profile)

	context = {
		'user_form': user_form,
		'profile_form': profile_form,
		'template_name': 'users/profile-update.html',
	}
	template_name = getTemplateName(request, 'users/profile-update.html')
	return render(request, template_name, context)

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
	if 'access_token' in token_response:
		access_token = token_response['access_token']
		user_url = 'https://api.intra.42.fr/v2/me'
		user_response = requests.get(user_url, headers={'Authorization': f'Bearer {access_token}'}).json()

		user_name = user_response['login']
		user_email = user_response['email']

		# Check if a user with the same username already exists
		existing_user = User.objects.filter(username=user_name).first()

		if existing_user:
			user_thing = user_things.objects.get(user=existing_user)
			if user_thing.logged_in_with_42:
				with transaction.atomic():
					user_thing.status = 'online'
					user_thing.save()
				auth_login(request, existing_user)
				return JsonResponse({'success': True, 'redirect': '/'})
			else:
				return JsonResponse({'success': False, 'message': 'User name is already taken by another user. Please sign up with another username.'})

		img_url = user_response['image']['versions']['small']
		# Create a new user
		user = User.objects.create(username=user_name, email=user_email)
		img_temp = NamedTemporaryFile(delete=True)
		img_temp.write(requests.get(img_url).content)
		img_temp.flush()
		auth_login(request, user)
		with transaction.atomic():
			user_thing = user_things.objects.get(user=user)
			user_thing.status = 'online'
			user_thing.logged_in_with_42 = True
			user_thing.save()
		existing_profile = Profile.objects.filter(user=user).first()
		existing_profile.image.save(f"{user_name}_profile_image.jpg",File(img_temp))
		return JsonResponse({'success': True, 'redirect': '/'})
	return JsonResponse({'success': False, 'message': 'Failed to authenticate with 42.'})