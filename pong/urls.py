from django.urls import path
from . import views

urlpatterns = [
    path('', views.homepage, name='homepage'),
    path('home/', views.home, name='home'),
    path('about/', views.about, name='about'),
    path('unload/', views.unload, name='unload'),
    path('start_game/', views.start_game, name='start_game'),
    path('game_computer/', views.game_computer, name='game_computer'),
    path('history/', views.matchhistory, name='history'),
    path('pretour/', views.pretour, name='pretour'),
    path('pre_tourn/', views.pre_tourn, name='pre_tourn'),
    path('pre_offline/', views.pre_offline, name='pre_offline'),
    path('join-tournament/', views.join_tournament_view, name='join_tournament'),
]