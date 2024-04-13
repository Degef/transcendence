from django.shortcuts import render
from users.models import user_things

# Create your views here.
def chat(request):
    profile_image = request.user.profile.image.url
    username = request.user.username

    user_things_instance = user_things.objects.get(user=request.user)
    friends = user_things_instance.friends.all()

    context = {
        'profile_image': profile_image,
        'username': username,
        'title': 'chat',
        'friends': friends
    }

    return render(request, 'index.html', context)
