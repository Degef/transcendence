from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path("ws/game/$", consumers.PongConsumer.as_asgi()),
    re_path("ws/my_consumer/$", consumers.MyConsumer.as_asgi()),
]
