from django.shortcuts import render
from .models import Game

def home(request):
    context = {
        'games': Game.objects.all()
    }
    if request.user.is_authenticated:
        return render(request, 'pong/home.html', context)
    else:
        return render(request, 'pong/home.html', context)

def start_game(request):
    return render(request, 'pong/start_game.html')

def about(request):
    return render(request, 'pong/about.html')

def tournament(request):
    return render(request, 'pong/tour.html')

