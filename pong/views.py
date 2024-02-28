from django.shortcuts import render
from .models import Game
from django.contrib.auth.models import User

def home(request):
    context = {
        'games': Game.objects.all()
    }
    if request.user.is_authenticated:
        return render(request, 'pong/home.html', context)
    else:
        return render(request, 'pong/home.html', context)


def about(request):
    return render(request, 'pong/about.html')
