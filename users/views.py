from django.http import JsonResponse
from django.contrib.auth.models import User
from .form import RegistrationForm, UserUpdateForm, ProfileUpdateForm
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from rest_framework.authtoken.models import Token
from .models import Profile
import requests
from urllib.parse import unquote

def fix_profile_image_link(link):
    decoded_link = unquote(link) # Decode the URL to replace %3A with :    
    fixed_link = decoded_link.replace('/media/', '')  # Remove the unwanted part '/media/'
    return fixed_link

def exchange_code(request):
    code = request.GET.get('code')

    token_url = 'https://api.intra.42.fr/oauth/token'
    client_id = 'u-s4t2ud-3f913f901b795282d0320691ff15f78cc9e125e56f6d77a9c26fc17a15237ac1'
    client_secret = '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'
    redirect_uri = 'http://10.11.1.13:8000'
    grant_type = 'authorization_code'

    # Request parameters
    params = {
        'client_id': client_id,
        'client_secret': client_secret,
        'code': code,
        'redirect_uri': redirect_uri,
        'grant_type': grant_type,
    }

    # # Exchange code for access token using POST request
    token_response = requests.post(token_url, data=params).json()
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
            return JsonResponse({'success': True, 'message': 'User already exists'})

        img_url = user_response['image']['versions']['small']
        # Create a new user
        user = User.objects.create(username=user_name, email=user_email)
        profile = user.profile
        profile.image = img_url

        profile.save()
        login(request, user)
        return JsonResponse({'success': True, 'message': 'User created successfully.'})

    return JsonResponse({'success': False, 'error': 'Failed to obtain access token'})


def profile(request):
    if request.user.is_authenticated:
        try:
            user_data = User.objects.filter(pk=request.user.pk).values(
                'id', 'username', 'first_name', 'last_name', 'email', 'profile')[0]
            user_profile = Profile.objects.get(pk=user_data['profile'])
            if ("42.fr" in user_profile.image.url):
                user_data['image_url'] = fix_profile_image_link(user_profile.image.url)
            else:
                user_data['image_url'] = user_profile.image.url
            return JsonResponse(user_data, safe=False)
        except Profile.DoesNotExist:
            return JsonResponse({'error': 'UserProfile does not exist for the user'}, status=404)
    else:
        return JsonResponse({'error': 'User not authenticated'}, status=401)

@csrf_exempt
def update_profile(request):
    if request.method == 'POST':
        u_form = UserUpdateForm(request.POST, instance=request.user)
        p_form = ProfileUpdateForm(request.POST, request.FILES, instance=request.user.profile)
        if u_form.is_valid() and p_form.is_valid():
            # Save the user and profile forms
            if u_form.has_changed() or p_form.has_changed():
                u_form.save()
                p_form.save()
                return JsonResponse({'success': True, 'message': 'Profile updated successfully'})
            else:
                return JsonResponse({'success': False, 'message': 'No changes detected'})
        else:
            return JsonResponse({'success': False, 'errors': u_form.errors})
    else:
        return JsonResponse({'success': False, 'message': 'Invalid request method'})

@csrf_exempt
def register_user(request):
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            # Process the form data and return a JSON response
            form.save()
            username = form.cleaned_data.get('username')
            token, created = Token.objects.get_or_create(user=form.instance)
            return JsonResponse({'success': True, 'message': f'Account created for {username}!', 'token': token.key})
        else:
            return JsonResponse({'success': False, 'errors': form.errors})
    else:
        return JsonResponse({'success': False, 'message': 'Invalid request method'})

@csrf_exempt
def login_user(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return JsonResponse({'success': True, 'message': 'Login successful'})
        else:
            return JsonResponse({'success': False, 'message': 'Invalid credentials'})

def check_auth(request):
    if request.user.is_authenticated:
        return JsonResponse({'success': True, 'message': 'User is authenticated'})
    else:
        return JsonResponse({'success': False, 'message': 'User is not authenticated'})

@csrf_exempt
def logout_user(request):
    if request.method == 'POST':
        # Use the logout function to log the user out
        logout(request)
        return JsonResponse({'success': True, 'message': 'Logout successful'})
    else:
        return JsonResponse({'success': False, 'message': 'Invalid request method'})