from django.urls import path
from . import views

urlpatterns = [
    path('', views.homepage, name='homepage'),
    path('home/', views.home, name='home'),
    path('about/', views.about, name='about'),
    path('unload/', views.unload, name='unload'),
    path('start_game/', views.start_game, name='start_game'),
    path('game_computer/', views.game_computer, name='game_computer'),
]