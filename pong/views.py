from django.shortcuts import render
from .models import Game

def home(request):
    context = {
        'games': Game.objects.all()
    }
    return render(request, 'pong/home.html', context)

def about(request):
    return render(request, 'pong/about.html')