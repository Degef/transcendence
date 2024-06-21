from django.urls import re_path
from .consumers import PongConsumer, ChallengeConsumer

websocket_urlpatterns = [
    re_path("ws/game/$", PongConsumer.as_asgi()),
	re_path("ws/challenge/$", ChallengeConsumer.as_asgi()),
]
