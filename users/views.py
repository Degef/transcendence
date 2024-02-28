from django.shortcuts import render
from django.contrib import messages
from .forms import UserRegisterForm, UserUpdateForm, ProfileUpdateForm
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.core.files.storage import default_storage
import requests
from django.contrib.auth.models import User
from django.contrib.auth import login
from django.core.files.temp import NamedTemporaryFile
from django.core.files import File
from .models import Profile
from pong.models import Game
from django.contrib.auth.views import LoginView



class CustomLoginView(LoginView):
    template_name = 'users/login.html'

    def get(self, request, *args, **kwargs):
        return render(request, 'users/login.html', {'form': self.get_form()})

    def post(self, request, *args, **kwargs):
        form = self.get_form()
        if form.is_valid():
            context = {
                'games': Game.objects.all()
            }
            login(request, form.get_user())
            return render(request, 'pong/home.html', context)
        else:
            return render(request, 'users/login.html', {'form': form})

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
            return render(request, 'users/login.html', context)
    else:
        form = UserRegisterForm()
    return render(request, 'users/register.html', {'form': form})

@login_required
def profile(request):
    if request.method == 'POST':
        u_form = UserUpdateForm(request.POST, instance=request.user)
        p_form = ProfileUpdateForm(request.POST, request.FILES, instance=request.user.profile)

        new_image = request.FILES.get('image')
        old_image_path = request.user.profile.image.path if request.user.profile.image else None
        print('new_image:', new_image)

        if u_form.is_valid() and p_form.is_valid():
            print('forms are valid')
            p_form.save()
            u_form.save()

            if new_image and old_image_path:
                if 'default.png' not in old_image_path:
                    default_storage.delete(old_image_path)

            messages.success(request, f'Your account has been updated!')
            context = {
                'u_form': u_form,
                'p_form': p_form,
                'messages': messages.get_messages(request)
            }
            return render(request, 'users/profile.html', context)
    else:
        u_form = UserUpdateForm(instance=request.user)
        p_form = ProfileUpdateForm(instance=request.user.profile)  

    context = {
        'u_form': u_form,
        'p_form': p_form,
        'status': request.user.user_things.status
    }
    return render(request, 'users/profile.html', context)

def exchange_code(request):
    code = request.GET.get('code')

    token_url = 'https://api.intra.42.fr/oauth/token'
    client_id = 'u-s4t2ud-3f913f901b795282d0320691ff15f78cc9e125e56f6d77a9c26fc17a15237ac1'
    client_secret = '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'
    redirect_uri = 'http://10.13.7.13:8000'
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
            return render(request, 'pong/home.html', context)

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
    return render(request, 'pong/home.html', context)

def get_users(request):
    users = User.objects.exclude(username=request.user.username)
    friends = request.user.user_things.friends.values_list('username', flat=True)
    friends2 = request.user.user_things.friends.all()

    context = {
        'users': users,
        'friends': friends,
        'friends2': friends2
    }
    return render(request, 'users/users.html', context)

def add_friend(request, username):
    user = User.objects.get(username=username)
    request.user.user_things.add_friend(user)
    users = User.objects.exclude(username=request.user.username)
    friends = request.user.user_things.friends.values_list('username', flat=True)
    friends2 = request.user.user_things.friends.all()

    context = {
        'users': users,
        'friends': friends,
        'friends2': friends2
    }
    return render(request, 'users/users.html', context)

def remove_friend(request, username):
    user = User.objects.get(username=username)
    request.user.user_things.remove_friend(user)
    users = User.objects.exclude(username=request.user.username)
    friends = request.user.user_things.friends.values_list('username', flat=True)
    friends2 = request.user.user_things.friends.all()

    context = {
        'users': users,
        'friends': friends,
        'friends2': friends2
    }
    return render(request, 'users/users.html', context)