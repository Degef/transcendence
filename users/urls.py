from django.urls import path
from . import views

urlpatterns = [
	path('register_user/', views.register_user, name='register'),
	path('login_user/', views.login_user, name='login'),
    path('check_auth/', views.check_auth, name='check_auth'),
    path('logout/', views.logout_user, name='logout'),
    path('profile/', views.profile, name='profile'),
    path('update_profile/', views.update_profile, name='update_profile'),
    path('exchange-code/', views.exchange_code, name='exchange_code'),
]