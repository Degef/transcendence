from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("", views.index, name="index"),
	# path('profile/', views.profile, name='profile'),
	# path('register_user/', views.register_user, name='register'),
	# path('login_user/', views.login_user, name='login'),
    # path('check_auth/', views.check_auth, name='check_auth'),
    # path('logout/', views.logout_user, name='logout'),
]

# Serve static files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)