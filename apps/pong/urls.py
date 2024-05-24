from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('favicon.ico', views.FaviconView.as_view()),
    path('about/', views.about, name='about'),
    path('leaderboard/', views.leaderboard, name='leaderboard'),
    path('unload/', views.unload, name='unload'),
    path('play_online/', views.play_online, name='play_online'),
    path('game_computer/', views.game_computer, name='game_computer'),
    path('local_game/', views.local_game, name='local_game'),
    path('challengeUser/<str:username>/', views.challengeUser, name='challengeUser'),
    path('is_challenged/', views.is_challenged, name='is_challenged'),
    path('give_challenged_response/<str:response>/', views.give_challenged_response, name='give_challenged_response'),
    path('check_challenge_response/', views.check_challenge_response, name='check_challenge_response'),
]