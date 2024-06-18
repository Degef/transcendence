
# chat/consumers.py

from channels.generic.websocket import AsyncWebsocketConsumer
import json
from asgiref.sync import sync_to_async



class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user_id = await sync_to_async(self.get_user_id)()
        self.group_name = "{}".format(user_id)

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

    async def receive(self, text_data=None,bytes_data = None):

        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        await self.channel_layer.group_send(
            self.chat_group_name,
            {
                'type': 'recieve_group_message_chat',
                'message': message
            }
        )

    async def recieve_group_message_chat(self, event):
        message = event['message']

        await self.send(
             text_data=json.dumps({
            'message': message
        }))