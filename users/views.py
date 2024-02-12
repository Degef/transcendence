from django.shortcuts import render
from django.contrib import messages
from .forms import UserRegisterForm, UserUpdateForm, ProfileUpdateForm
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.core.files.storage import default_storage
import requests
from urllib.parse import unquote
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.core.files.temp import NamedTemporaryFile
from django.core.files import File
from .models import Profile
from pong.models import Game


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

        if u_form.is_valid() and p_form.is_valid():
            u_form.save()
            p_form.save()

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
        'p_form': p_form
    }
    return render(request, 'users/profile.html', context)

# def fix_profile_image_link(link):
#     decoded_link = unquote(link) # Decode the URL to replace %3A with :    
#     fixed_link = decoded_link.replace('/media/', '')  # Remove the unwanted part '/media/'
#     return fixed_link

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