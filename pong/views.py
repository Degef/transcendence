from django.shortcuts import render
from django.http import HttpResponse, Http404, JsonResponse

# Create your views here.
def index(request):
    return render(request, "pong/index.html")

 # Sample user data for demonstration
user_data = {
	'username': 'john_doe',
	'email': 'john@example.com',
}

def profile(request):

    # Return JSON response with user data
	return JsonResponse(user_data)