# routing.py
# from channels.routing import ProtocolTypeRouter, URLRouter
# from django.urls import re_path
# from . import consumers

# application = ProtocolTypeRouter({
#     "websocket": URLRouter(
#         consumers.websocket_urlpatterns
#     ),
# })

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/socket-server/$', consumers.PongConsumer.as_asgi()),
]
