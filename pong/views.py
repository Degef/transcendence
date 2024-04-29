from django.shortcuts import render
from .models import Game
from django.contrib.auth.models import User
from users.models import user_things
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import logging
from django.db import transaction
from django.contrib.auth import login
from django.db.models import Q

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

def homepage(request):
    user = request.user
    username = request.user.id
    form = Game.objects.filter(Q(player1 = username) | Q(player2 = username)).order_by('-date')

    context = {'user': user, 'mhistory' : form}
    # return render(request, 'pong/home.html', context)
    return render(request, 'pong/homepage.html', context)


def start_game(request):
    # logger.debug(f'\n\n{request.user.user_things.status}\n\n')
    return render(request, 'pong/start_game.html')

def game_computer(request):
    # logger.debug(f'\n\n{request.user.user_things.status}\n\n')
    return render(request, 'pong/game_computer.html')

def about(request):
    return render(request, 'pong/about.html')

def tournament(request):
    return render(request, 'pong/tour.html')


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

def matchhistory(request):
    username = request.user.id
    form = Game.objects.filter(Q(player1 = username) | Q(player2 = username)).order_by('-date')

    context = {'mhistory' : form}
    return render(request, 'pong/history.html', context)

def pretour(request):
    # username = request.user.id
    # form = Game.objects.filter(Q(player1 = username) | Q(player2 = username)).order_by('-date')

    # context = {'mhistory' : form}
    return render(request, 'pong/tournament.html')