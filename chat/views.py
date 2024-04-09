from django.shortcuts import render

# Create your views here.
def chat(request):
    profile_image = request.user.profile.image.url
    username = request.user.username

    context = {
        'profile_image': profile_image,
        'username': username,
		'title': 'chat',
    }

    return render(request, 'index.html', context)
