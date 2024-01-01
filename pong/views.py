from django.shortcuts import render
from django.http import HttpResponse, Http404, JsonResponse
from django.contrib.auth.models import User
from django.core.serializers import serialize
import json
from .forms import RegistrationForm
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from rest_framework.authtoken.models import Token

# Create your views here.
def index(request):
    return render(request, "pong/index.html")

def profile(request):
    # Serialize the User queryset to a JSON string
    user_data = serialize('json', User.objects.all())

    # Convert the serialized JSON to a Python list/dictionary
    data = {'users': json.loads(user_data)}

    # Return JSON response with user data
    return JsonResponse(data, safe=False)

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
