from django.shortcuts import render
from django.http import HttpResponse, Http404, JsonResponse
from django.contrib.auth.models import User
from django.core.serializers import serialize
# from django.db import models
from .form import RegistrationForm
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from rest_framework.authtoken.models import Token

# Create your views here.
# def profile(request):
#     # Assuming the user is authenticated
#     if request.user.is_authenticated:
#         # Fetch the user profile including the profile picture
#         user_data = User.objects.filter(pk=request.user.pk).values(
#             'id', 'username', 'first_name', 'last_name', 'email', 'profile'
#         )[0]

#         # Convert the serialized JSON to a Python list/dictionary
#         data = {'users': [user_data]}

#         # Return JSON response with user data
#         return JsonResponse(data, safe=False)
#     else:
#         # Handle the case where the user is not authenticated
#         return JsonResponse({'error': 'User not authenticated'}, status=401)

# def profile(request):
#     # Assuming the user is authenticated
#     if request.user.is_authenticated:
#         # Check if the user has the 'profile' attribute
#         if hasattr(request.user, 'profile'):
#             # Fetch the user profile including the profile picture
#             user_data = User.objects.filter(pk=request.user.pk).values(
#                 'id', 'username', 'first_name', 'last_name', 'email', 'profile'
#             )[0]

#             # Convert the serialized JSON to a Python list/dictionary
#             data = {'users': [user_data]}

#             # Return JSON response with user data
#             return JsonResponse(data, safe=False)
#         else:
#             # Handle the case where the user does not have the 'profile' attribute
#             return JsonResponse({'error': 'User does not have a profile attribute'}, status=404)
#     else:
#         # Handle the case where the user is not authenticated
#         return JsonResponse({'error': 'User not authenticated'}, status=401)

# views.py
from django.http import JsonResponse
from .models import Profile

def profile(request):
    # Assuming the user is authenticated
    if request.user.is_authenticated:
        try:
            # Fetch the user profile including the profile picture
            user_data = User.objects.filter(pk=request.user.pk).values(
                'id', 'username', 'first_name', 'last_name', 'email', 'profile'
            )[0]

            # Fetch the related Profile
            user_profile = Profile.objects.get(pk=user_data['profile'])
            user_data['image'] = user_profile.image.url

            # Convert the serialized JSON to a Python list/dictionary
            data = {'users': [user_data]}

            # Return JSON response with user data
            return JsonResponse(data, safe=False)
        except Profile.DoesNotExist:
            # Handle the case where the related UserProfile does not exist
            return JsonResponse({'error': 'UserProfile does not exist for the user'}, status=404)
    else:
        # Handle the case where the user is not authenticated
        return JsonResponse({'error': 'User not authenticated'}, status=401)


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
