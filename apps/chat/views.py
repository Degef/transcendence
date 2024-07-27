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
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie

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


def block_unblock(request):
	self_username = request.user.username
	self_username_obj = User.objects.get(username=self_username)

	if request.method not in ['POST', 'DELETE']:
		return JsonResponse({'success': False, 'message': 'Invalid request method'})

	try:
		data = json.loads(request.body)
		blocked_username = data['username']
		blocked_username_obj = User.objects.get(username=blocked_username)
	except (KeyError, json.JSONDecodeError, User.DoesNotExist):
		return JsonResponse({'success': False, 'message': 'Invalid request data'})

	if self_username == blocked_username:
		return JsonResponse({'success': False, 'message': 'Cannot block yourself'})

	if request.method == 'POST':
		block, created = BlockModel.objects.get_or_create(
			user_blocker=self_username_obj,
			user_blocked=blocked_username_obj
		)
		if created:
			return JsonResponse({'success': True, 'message': 'User successfully blocked'})
		else:
			return JsonResponse({'success': False, 'message': 'User is already blocked'})

	elif request.method == 'DELETE':
		deleted, _ = BlockModel.objects.filter(
			user_blocker=self_username_obj,
			user_blocked=blocked_username_obj
		).delete()
		if deleted:
			return JsonResponse({'success': True, 'message': 'User is successfully unblocked'})
		else:
			return JsonResponse({'success': False, 'message': 'User is not blocked'})


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
