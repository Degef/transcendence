import json
from channels.generic.websocket import WebsocketConsumer

class PongConsumer(WebsocketConsumer):
    connected_users = set()

    def connect(self):
        self.accept()

        PongConsumer.connected_users.add(self.channel_name)

        # Send a welcome message to the connected user
        self.send(text_data=json.dumps({
            'message': 'Welcome! You are now connected.',
            'all_users': list(PongConsumer.connected_users)
        }))

        # Broadcast the updated list of connected users to all users
        # self.send_message_to_all_users_list()

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        text_data_json = json.loads(text_data)

        message = text_data_json['message']
        print(message)
        self.send(text_data=json.dumps({
            'message': message
        }))

    def send_message_to_all_users_list(self):
        # Broadcast the updated list of connected users to all users
        for user_channel in PongConsumer.connected_users:
            self.send(text_data=json.dumps({
                'all_users': list(PongConsumer.connected_users)
            }), to=user_channel)