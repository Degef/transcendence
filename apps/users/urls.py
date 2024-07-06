from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
	path('register/', views.register, name='register'),
	path('get_ipaddress/', views.get_ipaddress, name='get_ipaddress'),
	path('profile/<str:user>', views.profile, name='profile'),
    path('send_friend_request/<str:username>/', views.send_friend_request, name='send_friend_request'),
    path('accept_friend_request/<str:username>/', views.accept_friend_request, name='accept_friend_request'),
    path('decline_friend_request/<str:username>/', views.decline_friend_request, name='decline_friend_request'),
    path('cancel_friend_request/<str:username>/', views.cancel_friend_request, name='cancel_friend_request'),
    path('remove_friend/<str:username>/', views.remove_friend, name='remove_friend'),
	path('edit_profile/', views.edit_profile, name='edit_profile'),
	path('delete_profile/', views.delete_profile, name='delete_profile'),
	path('login/', views.login, name='login'),
	path('logout/', views.logout, name='logout'),
	path('exchange_code/', views.exchange_code, name='exchange_code'),
	path('limit/', views.limit, name='limit'),
	path('list_of_all_username_json/', views.list_of_all_username_json, name='list_of_all_username_json'),
	path('anonymize_user/', views.anonymize_user, name='anonymize_user'),
]
