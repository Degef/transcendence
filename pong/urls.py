from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('about/', views.about, name='about'),
    path('start_game/', views.start_game, name='start_game'),
    path('tour/', views.tournament, name='tournament'),
]