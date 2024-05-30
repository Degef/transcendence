from django.shortcuts import render, redirect
from django.contrib import messages
from .forms import UserRegisterForm, UserUpdateForm, ProfileUpdateForm, CustomAuthenticationForm
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.core.files.storage import default_storage
import requests
from django.contrib.auth.models import User
from django.contrib.auth import login as auth_login, update_session_auth_hash, authenticate, logout as auth_logout
from django.core.files.temp import NamedTemporaryFile
from django.core.files import File
from .models import Profile
from apps.pong.models import Game
from django.contrib.auth.views import LoginView
from dotenv import load_dotenv
import os
from django.http import JsonResponse
from django.db.models import Q
import logging
logger = logging.getLogger(__name__)
from django.core.serializers import serialize
from django.views.decorators.http import require_POST

load_dotenv()

def get_ipaddress(request):
	ip  = os.environ.get('IP_ADDRESS')
	data = {
		'ip': ip,
		'client_id': os.environ.get('UID_42'),
		'redirect_uri': 'http://' + ip + ':8000',
		'secret': os.environ.get('SECRET_42'),
	}
	return JsonResponse(data)

def login(request):
	if request.method == 'POST':
		form = CustomAuthenticationForm(request, data=request.POST)
		if form.is_valid():
			username = form.cleaned_data.get('username')
			password = form.cleaned_data.get('password')
			user = authenticate(username=username, password=password)
			if user is not None:
				auth_login(request, user)
				messages.success(request, 'You are now logged in.')
				return JsonResponse({'success': True, 'message': 'You are now logged in.'})
			else:
				return JsonResponse({'success': False, 'message': 'Invalid username or password.'})
		else:
			errors = form.errors.as_json()
			return JsonResponse({'success': False, 'errors': errors})
	else:
		form = CustomAuthenticationForm()
	return render(request, 'login.html', {'form': form})

def logout(request):
	auth_logout(request)
	return render(request, 'landing.html')

def register(request):
	if request.method == 'POST':
		form = UserRegisterForm(request.POST)
		if form.is_valid():
			form.save()
			messages.success(request, f'Your account has been created! You are now able to log in.')
			form = AuthenticationForm()
			context = {'messages': messages.get_messages(request), 'form': form}
			return render(request, 'signup.html', context)
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
	is_own_profile = True
	if user == '':
		user = request.user.username

	if user != request.user.username:
		is_own_profile = False

	userr = User.objects.filter(username=user).first()
	if userr is None:
		messages.error(request, f'User {user} does not exist')
		return redirect('home')

	userid = userr.id
	games = Game.objects.filter(Q(player1=userid) | Q(player2=userid)).order_by('-date')
	games_data = serialize('json', games)


	total_wins = get_total_wins(userid)
	total_losses = get_total_losses(userid)
	total_games = total_wins + total_losses
	win_rate = get_win_rate(total_wins, total_losses)
	profile_image = Profile.objects.filter(user=userid).first().image

	all_users = User.objects.all().exclude(username=user)
	friends = userr.user_things.friends.all()
	non_friends = all_users.difference(friends)

	context = {
		'username': user,
		'total_wins': total_wins,
		'total_losses': total_losses,
		'total_games': total_games,
		'win_rate': win_rate,
		'is_own_profile': is_own_profile,
		'profile_image': profile_image,
		'friends': friends,
		'non_friends': non_friends,
		'games': games,
		'games2': games_data,
	}
	return render(request, 'profile.html', context)

@login_required
def edit_profile(request):
	logger.debug(f'\n\n{request}\n\n')
	user = request.user
	
	if request.method == 'POST':
		user_form = UserUpdateForm(request.POST, instance=user)
		profile_form = ProfileUpdateForm(request.POST, request.FILES, instance=user.profile)

		if user_form.is_valid() and profile_form.is_valid():
			user_form.save()
			profile_form.save()
			
			if user_form.cleaned_data.get('password'):
				user.set_password(user_form.cleaned_data['password'])
				update_session_auth_hash(request, user)

			messages.success(request, 'Profile updated successfully')
			return redirect('profile')
		else:
			messages.error(request, 'Please correct the error below.')
	else:
		user_form = UserUpdateForm(instance=user)
		profile_form = ProfileUpdateForm(instance=user.profile)
	
	context = {
		'user_form': user_form,
		'profile_form': profile_form,
	}
	return render(request, 'users/profile-update.html', context)




def exchange_code(request):
	code = request.GET.get('code')
	ip  = os.environ.get('IP_ADDRESS')

	token_url = 'https://api.intra.42.fr/oauth/token'
	client_id = os.environ.get('UID_42')
	client_secret = os.environ.get('SECRET_42')
	redirect_uri = 'http://' + ip + ':8000'
	grant_type = 'authorization_code'

	# Request parameters
	params = {
		'client_id': client_id,
		'client_secret': client_secret,
		'code': code,
		'redirect_uri': redirect_uri,
		'grant_type': grant_type,
	}
	context = { 'games': Game.objects.all()}
	# # Exchange code for access token using POST request
	token_response = requests.post(token_url, data=params).json()
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
			login(request, existing_user)
			return redirect('home')

		img_url = user_response['image']['versions']['small']
		# Create a new user
		user = User.objects.create(username=user_name, email=user_email)
		img_temp = NamedTemporaryFile(delete=True)
		img_temp.write(requests.get(img_url).content)
		img_temp.flush()
		login(request, user)
		text = render(request, 'pong/home.html', context)
		existing_profile = Profile.objects.filter(user=user).first()
		existing_profile.image.save(f"{user_name}_profile_image.jpg",File(img_temp))
		return text
	return redirect('home')
	# return render(request, 'pong/home.html', context)

def add_friend(request, username):
	user = User.objects.get(username=username)
	request.user.user_things.add_friend(user)
	return redirect('profile')

def remove_friend(request, username):
	user = User.objects.get(username=username)
	request.user.user_things.remove_friend(user)
	return redirect('profile')

