from . import views
from django.urls import path, include
from django.contrib.auth.decorators import login_required
from rest_framework.routers import DefaultRouter
from .api import MessageModelViewSet, UserModelViewSet

router = DefaultRouter()

router.register(r'message', MessageModelViewSet, basename='message-api')
router.register(r'user/(?P<username>\w+)', UserModelViewSet, basename='user-api')


urlpatterns = [
	path(r'api/', include(router.urls)),
	path('', login_required(views.chat), name='chat-page'),
	path('get_current_user/', views.get_current_user, name='get_current_user'),
	path('block_unblock/', views.block_unblock, name='blocking_unblocking'),
]
