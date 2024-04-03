from . import views
from django.urls import path, include
from django.contrib.auth.decorators import login_required
from rest_framework.routers import DefaultRouter
from .api import MessageModelViewSet, UserModelViewSet

router = DefaultRouter()

router.register(r'message', MessageModelViewSet, basename='message-api')
router.register(r'user', UserModelViewSet, basename='user-api')

urlpatterns = [
	path(r'api/', include(router.urls)),
	path('', login_required(views.chat), name='chat-page')
]
