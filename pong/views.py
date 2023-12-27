from django.shortcuts import render
from django.http import HttpResponse, Http404, JsonResponse
from django.contrib.auth.models import User
from django.core.serializers import serialize
import json
from .forms import RegistrationForm
from django.views.decorators.csrf import csrf_exempt

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
            return JsonResponse({'success': True, 'message': f'Account created for {username}!'})
        else:
            return JsonResponse({'success': False, 'errors': form.errors})
    else:
        return JsonResponse({'success': False, 'message': 'Invalid request method'})