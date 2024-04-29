from django.shortcuts import render
from users.models import user_things, Profile

def chat(request):
	profile_image = request.user.profile.image.url
	username = request.user.username

	user_things_instance = user_things.objects.get(user=request.user)
	
	friend_usernames = user_things_instance.friends.all()
	friend_profiles = Profile.objects.filter(user__in=friend_usernames)

	context = {
		'profile_image': profile_image,
		'username': username,
		'title': 'chat',
		'friends': friend_profiles
	}

	return render(request, 'index.html', context)
