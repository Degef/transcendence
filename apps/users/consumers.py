import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import user_things

User = get_user_model()

class StatusConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		self.user = self.scope["user"]
		if self.user.is_authenticated:
			await self.update_status("online")
			await self.channel_layer.group_add("online_users", self.channel_name)
			await self.accept()

	async def disconnect(self, close_code):
		if self.user.is_authenticated:
			await self.update_status("offline")
			await self.channel_layer.group_discard("online_users", self.channel_name)

	async def receive(self, text_data):
		data = json.loads(text_data)
		status = data.get('status', None)
		if status:
			await self.update_status(status)
		await self.channel_layer.group_send(
			"online_users",
			{
				"type": "status_message",
				"message": f"{self.user.username} is {status}",
			},
		)

	async def status_message(self, event):
		message = event["message"]
		await self.send(text_data=json.dumps({
			"message": message,
		}))

	@database_sync_to_async
	def update_status(self, status):
		try:
			user_thing = user_things.objects.get(user=self.user)
			user_thing.status = status
			user_thing.save()
		except user_things.DoesNotExist:
			pass
