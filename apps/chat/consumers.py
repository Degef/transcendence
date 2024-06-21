from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
import json
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import MessageModel, is_blocked

import logging
import uuid
logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		user_id = await sync_to_async(self.get_user_id)()
		self.group_name = str(user_id)

		await self.channel_layer.group_add(
			self.group_name,
			self.channel_name
		)


		await self.accept()

	def get_user_id(self):
		return self.scope["session"]["_auth_user_id"]

	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			self.group_name,
			self.channel_name
		)

	async def receive(self, text_data=None, bytes_data=None):
		logger.debug(" \n\n Received message from chat consumer \n\n")
		text_data_json = json.loads(text_data)
		message_body = text_data_json['body']
		recipient_username = text_data_json['recipient']

		recipient = await sync_to_async(User.objects.get)(username=recipient_username)
		if await sync_to_async(is_blocked)(self.scope['user'], recipient):
			await self.send_error('You are blocked by the recipient')
			return

		message = await self.create_message(self.scope['user'], recipient, message_body)

		await self.notify_users(message)

	@database_sync_to_async
	def create_message(self, user, recipient, body):
		return MessageModel.objects.create(user=user, recipient=recipient, body=body.strip())

	async def notify_users(self, message):
		notification = {
			'type': 'receive.group_message',
			'message': {
				'id': message.id,
				'user': message.user.username,
				'recipient': message.recipient.username,
				'body': message.body,
				'timestamp': message.timestamp.isoformat()
			}
		}
		await self.channel_layer.group_send(str(message.user.id), notification)
		await self.channel_layer.group_send(str(message.recipient.id), notification)

	async def send_error(self, error_message):
		await self.send(text_data=json.dumps({'error': error_message}))

	async def receive_group_message(self, event):
		message = event['message']
		await self.send(text_data=json.dumps({'message': message}))
