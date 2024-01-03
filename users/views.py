from django.http import JsonResponse
from django.contrib.auth.models import User
from .form import RegistrationForm, UserUpdateForm, ProfileUpdateForm
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from rest_framework.authtoken.models import Token
from .models import Profile

def profile(request):
    # Assuming the user is authenticated
    if request.user.is_authenticated:
        try:
            # Fetch the user profile including the profile picture
            user_data = User.objects.filter(pk=request.user.pk).values(
                'id', 'username', 'first_name', 'last_name', 'email', 'profile')[0]

            # Fetch the related Profile
            user_profile = Profile.objects.get(pk=user_data['profile'])
            user_data['image_url'] = user_profile.image.url

            # Convert the serialized JSON to a Python list/dictionary
            # data = {'users': [user_data]}

            # Return JSON response with user data
            return JsonResponse(user_data, safe=False)
        except Profile.DoesNotExist:
            # Handle the case where the related UserProfile does not exist
            return JsonResponse({'error': 'UserProfile does not exist for the user'}, status=404)
    else:
        # Handle the case where the user is not authenticated
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