import os
from channels.auth import AuthMiddlewareStack
import django
django.setup()

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
