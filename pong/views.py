from django.shortcuts import render
from .models import Game
from django.contrib.auth.models import User

def home(request):
    context = {
        'games': Game.objects.all()
    }
    if request.user.is_authenticated:
        users = User.objects.exclude(username=request.user.username)

        context = {
            'games': Game.objects.all(),
            'users':users,
        }
        return render(request, 'users/users.html', context)
    else:
        context = { 'games': Game.objects.all()}
        return render(request, 'pong/home.html', context)

def start_game(request):
    return render(request, 'pong/start_game.html')

def about(request):
    return render(request, 'pong/about.html')
