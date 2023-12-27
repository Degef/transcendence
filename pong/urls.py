from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
	path('profile/', views.profile, name='profile'),
	path('register_user/', views.register_user, name='register'),
]