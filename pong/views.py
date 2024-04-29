from django.shortcuts import render, redirect
from .models import Game
from django.contrib.auth.models import User
from users.models import user_things
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import logging
from django.db import transaction
from django.views.generic import View
from django.contrib.auth.decorators import login_required


logger = logging.getLogger(__name__)

def home(request):
    # logger.debug("\n\nHello World\n\n")
    if request.user.is_authenticated:
        with transaction.atomic():
            user_thing = request.user.user_things
            user_thing.status = "online"
            user_thing.save()
            # logger.debug(f'\n\n{user_thing.status}\n\n')

    context = {
        'games': Game.objects.all()
    }
    if request.user.is_authenticated:
        users = User.objects.exclude(username=request.user.username)

        context = {
            'games': Game.objects.all(),
            'users':users,
        }
        return render(request, 'pong/home.html', context)
    else:
        context = { 'games': Game.objects.all()}
        return render(request, 'pong/index.html', context)

class FaviconView(View):
    def get(self, request, *args, **kwargs):
        return redirect('/static/pong/favicon.ico')

def play_online(request):
    return render(request, 'pong/start_game.html')

def game_computer(request):
    return render(request, 'pong/game_computer.html')

def local_game(request):
    return render(request, 'pong/local_game.html')

def about(request):
    return render(request, 'pong/about.html')

@csrf_exempt
def unload(request):
    # logger.debug("\n\nBye World\n\n")
    if request.user.is_authenticated:
        with transaction.atomic():
            user_thing = request.user.user_things
            user_thing.status = "offline"
            user_thing.save()
            # logger.debug(f'\n\n{user_thing.status}\n\n')
    return JsonResponse({'success': False})


def challengeUser(request, username):
    logger.debug(f'\n\n{username}\n\n')
    challenged = User.objects.get(username=username)
    challenged_thing = challenged.user_things
    challenged_thing.is_challenged = True
    challenged_thing.challenger = request.user.username
    challenged_thing.save()

    challenging = request.user.user_things
    challenging.challenged_user = username
    challenging.save()
    
    return JsonResponse({'success': True})

def is_challenged(request):
    if (request.user.is_authenticated == False):
        return JsonResponse({'success': False})
    user_thing = request.user.user_things
    if user_thing.is_challenged:
        user_thing.is_challenged = False
        chall = user_thing.challenger
        user_thing.challenger = "None"
        user_thing.save()
        return JsonResponse({'success': True, 'challenged': True, 'challenger': chall })
    else:
        return JsonResponse({'success': True, 'challenged': False})

def check_challenge_response(request):
    challenged_user = User.objects.get(username=request.user.user_things.challenged_user)
    things = challenged_user.user_things
    response = things.challenge_response
    if (response == 'accept' or response == 'decline'):
        logger.debug(f'\n\n{response}\n\n')
        things.challenge_response = 'None'
        things.save()
        things2 = request.user.user_things
        things2.challenged_user = 'None'
        things2.save()
        logger.debug(f'\n\n{things.challenge_response}\n\n')
    return JsonResponse({'response': response})    

def give_challenged_response(request, response):
    user_thing = request.user.user_things
    user_thing.challenge_response = response
    user_thing.save()
    return JsonResponse({'success': True})