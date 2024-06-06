from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path("ws/game/$", consumers.PongConsumer.as_asgi()),
    re_path('ws/tournament/$', consumers.TournamentConsumer.as_asgi()),
]
