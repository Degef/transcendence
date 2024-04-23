from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('about/', views.about, name='about'),
    path('unload/', views.unload, name='unload'),
    path('start_game/', views.start_game, name='start_game'),
    path('game_computer/', views.game_computer, name='game_computer'),
    path('local_game/', views.local_game, name='local_game'),
    path('challengeUser/<str:username>/', views.challengeUser, name='challengeUser'),
    path('is_challenged/', views.is_challenged, name='is_challenged'),
    path('give_challenged_response/<str:response>/', views.give_challenged_response, name='give_challenged_response'),
    path('check_challenge_response/', views.check_challenge_response, name='check_challenge_response'),
]