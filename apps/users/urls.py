from django.urls import path
from . import views
from django.contrib.auth import views as auth_views
from apps.users.views import CustomLoginView

urlpatterns = [
	path('register/', views.register, name='register'),
	path('get_ipaddress/', views.get_ipaddress, name='get_ipaddress'),
	path('profile/', views.profile, name='profile'),
	path('profile/<str:user>', views.profile, name='profile'),
	path('edit_profile/', views.edit_profile, name='edit_profile'),
	# path('get_users/', views.get_users, name='get_users'),
	# path('login/', CustomLoginView.as_view(template_name='users/login.html'), name='login'),
	path('login/', views.login, name='login'),
	path('logout/', auth_views.LogoutView.as_view(template_name='users/logout.html'), name='logout'),
	path('exchange_code/', views.exchange_code, name='exchange_code'),
	path('add_friend/<str:username>/', views.add_friend, name='add_friend'),
	path('remove_friend/<str:username>/', views.remove_friend, name='remove_friend'),
]
