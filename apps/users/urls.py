from django.urls import path
from . import views
from django.contrib.auth import views as auth_views
from apps.users.views import CustomLoginView

urlpatterns = [
    path('pre_register/', views.pre_register, name='pre_register'),
    path('register/', views.register, name='register'),
    path('get_ipaddress/', views.get_ipaddress, name='get_ipaddress'),
    path('profile/', views.profile, name='profile'),
    # path('get_users/', views.get_users, name='get_users'),
    path('login/', CustomLoginView.as_view(template_name='pong/home.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(template_name='users/logout.html'), name='logout'),
    path('exchange_code/', views.exchange_code, name='exchange_code'),
    path('add_friend/<str:username>/', views.add_friend, name='add_friend'),
    path('remove_friend/<str:username>/', views.remove_friend, name='remove_friend'),
]
