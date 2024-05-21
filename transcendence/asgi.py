"""
ASGI config for transcendence project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

# import os
# from channels.auth import AuthMiddlewareStack

# from django.core.asgi import get_asgi_application
# from channels.routing import ProtocolTypeRouter, URLRouter

# from pong.routing import websocket_urlpatterns

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transcendence.settings')

# application = ProtocolTypeRouter({
#     "http": get_asgi_application(),
#     # "websocket": URLRouter(websocket_urlpatterns),
#     "websocket": AuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
# })


import os
from channels.auth import AuthMiddlewareStack

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from channels.sessions import SessionMiddlewareStack


from apps.chat.routing import websocket_urlpatterns as chat_websocket_urlpatterns
from apps.pong.routing import websocket_urlpatterns as pong_websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transcendence.settings')

websocket_urlpatterns = pong_websocket_urlpatterns + chat_websocket_urlpatterns

application = ProtocolTypeRouter({
	"http": get_asgi_application(),
	"websocket": AllowedHostsOriginValidator(
		AuthMiddlewareStack(
			SessionMiddlewareStack(
				URLRouter(websocket_urlpatterns),
		))
	),
})
