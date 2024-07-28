from django.urls import re_path
from .consumers import PongConsumer, ChallengeConsumer, TournamentConsumer

websocket_urlpatterns = [
    re_path("ws/game/$", PongConsumer.as_asgi()),
	re_path("ws/challenge/(?P<tab_id>\w+)/$", ChallengeConsumer.as_asgi()),
    re_path('ws/tournament/$', TournamentConsumer.as_asgi()),
]
