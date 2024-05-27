from django.shortcuts import render, redirect
from django.contrib import messages
from .forms import UserRegisterForm, UserUpdateForm, ProfileUpdateForm, UserUpdateForm2
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.core.files.storage import default_storage
import requests
from django.contrib.auth.models import User
from django.contrib.auth import login
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

def get_context(request, u_form, p_form, u_form2):
    all_games = Game.objects.all()
    total_match, total_win, total_lose, total_draw = 0, 0, 0, 0
    for game in all_games:
        if game.player1 == request.user or game.player2 == request.user:
            total_match += 1
            if game.winner == request.user:
                total_win += 1
            elif game.winner == None:
                total_draw += 1
            else:
                total_lose += 1
    users = User.objects.exclude(username=request.user.username)
    friends = request.user.user_things.friends.values_list('username', flat=True)
    friends2 = request.user.user_things.friends.all()
    context = {
        'u_form': u_form,
        'u_form2': u_form2,
        'p_form': p_form,
        'status': request.user.user_things.status,
        'total_match': total_match,
        'total_win': total_win,
        'total_lose': total_lose,
        'total_draw': total_draw,
        'users': users,
        'friends': friends,
        'friends2': friends2,
    }
    return context

class CustomLoginView(LoginView):
    template_name = 'login.html'

    def get(self, request, *args, **kwargs):
        return render(request, 'login.html', {'form': self.get_form()})

    def post(self, request, *args, **kwargs):
        form = self.get_form()
        if form.is_valid():
            login(request, form.get_user())
            return redirect('home')
        else:
            return render(request, 'login.html', {'form': form})

def pre_register(request):
    return render(request, 'users/pre_register.html')

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
        form = UserRegisterForm()
    return render(request, 'signup.html', {'form': form})


def get_total_wins(userid):
	total_wins = Game.objects.filter(winner=userid).count()
	return total_wins

def get_total_losses(userid):
	total_losses = Game.objects.filter(Q(player1=userid) | Q(player2=userid)).exclude(winner=userid).count()
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
	if userr == None:
		messages.error(request, f'User {user} does not exist')
		return redirect('home')

	userid = userr.id
	games = Game.objects.filter(Q(player1=userid) | Q(player2=userid)).order_by('-date')

	total_wins = get_total_wins(userid)
	total_losses = get_total_losses(userid)
	total_games = total_wins + total_losses
	win_rate = get_win_rate(total_wins, total_losses)
	profile_image = Profile.objects.filter(user=userid).first().image

	context = {
		'username': user,
		'total_wins': total_wins,
		'total_losses': total_losses,
		'total_games': total_games,
		'win_rate': win_rate,
		'is_own_profile': is_own_profile,
		'profile_image': profile_image,
		'games': games,
	}
	return render(request, 'profile.html', context)

@login_required
def edit_profile(request):

	context = {}
	return render(request, 'profile-update.html', context)


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

