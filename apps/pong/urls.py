from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('favicon.ico', views.FaviconView.as_view()),
    path('about/', views.about, name='about'),
    path('leaderboard/', views.leaderboard, name='leaderboard'),
    path('privacy/', views.privacy, name='privacy'),
    path('play_online/', views.play_online, name='play_online'),
    path('game_computer/', views.game_computer, name='game_computer'),
    path('local_game/', views.local_game, name='local_game'),
    path('offline_tourn/', views.offline_tourn, name='pre_offline_tournament'),
    path('off_tour_bracket/', views.off_tour_bracket, name='offline_tournament_bracket'),
]