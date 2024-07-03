from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.shortcuts import render
from apps.users.models import Profile, Friendship
from django.http import JsonResponse
from .models import is_blocked, BlockModel
from django.db.models import Q
import json

from django.views.decorators.csrf import csrf_exempt
from apps.users.views import getTemplateName

def get_current_user(request):
	if not request.user.is_authenticated:
		return JsonResponse({'Error': 'User is not authenticated'})
	sessionKey = request.session.session_key
	currentUser = request.user.username
	currentUserImage = request.user.profile.image.url

	data = {
		'sessionKey': sessionKey,
		'currentUser': currentUser,
		'currentUserImage': currentUserImage,
	}

	return JsonResponse(data)

@csrf_exempt
def block_unblock(request):
	self_username = request.user.username
	self_username_obj = User.objects.get(username=self_username)

	if request.method not in ['POST', 'DELETE']:
		return JsonResponse({'Error': 'Invalid request method'}, status=405)

	try:
		data = json.loads(request.body)
		blocked_username = data['username']
		blocked_username_obj = User.objects.get(username=blocked_username)
	except (KeyError, json.JSONDecodeError):
		return JsonResponse({'Error': 'Invalid request data'}, status=400)

	if self_username == blocked_username:
		return JsonResponse({'Error': 'Cannot block yourself'}, status=400)

	if request.method == 'POST':
		if is_blocked(self_username_obj, blocked_username_obj):
			return JsonResponse({'Error': 'User is already blocked'}, status=400)
		else:
			BlockModel.objects.create(user_blocker=self_username_obj, user_blocked=blocked_username_obj)
			return JsonResponse({'Success': 'User successfully blocked'}, status=200)

	elif request.method == 'DELETE':
		if not is_blocked(self_username_obj, blocked_username_obj):
			return JsonResponse({'Error': 'User is not blocked'}, status=400)
		else:
			block_instance = BlockModel.objects.get(user_blocker=self_username_obj, user_blocked=blocked_username_obj)
			block_instance.delete()
			return JsonResponse({'Success': 'User is successfully unblocked'}, status=200)


@login_required
def chat(request):
	profile_image = request.user.profile.image.url
	username = request.user.username

	accepted_friendships = Friendship.objects.filter(
		Q(from_user=request.user, status=Friendship.ACCEPTED) |
		Q(to_user=request.user, status=Friendship.ACCEPTED)
	)

	# Get the profiles of the friends
	friend_profiles = Profile.objects.filter(
		Q(user__in=accepted_friendships.values('from_user')) |
		Q(user__in=accepted_friendships.values('to_user'))
	).exclude(user=request.user)

	context = {
		'profile_image': profile_image,
		'username': username,
		'title': 'chat',
		'friends': friend_profiles,
		'template_name': 'chat/chat.html'
	}
	template_name = getTemplateName(request, 'chat/chat.html')
	return render(request, template_name, context)
