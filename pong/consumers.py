# import json
# import uuid

# from channels.generic.websocket import WebsocketConsumer
# from channels.layers import get_channel_layer
# from asgiref.sync import async_to_sync

# class MultiplayerConsumer(WebsocketConsumer):
#     game_group_name = "game_group"
#     players = {}

#     def connect(self):
#         self.player_id = str(uuid.uuid4())
#         self.accept()

#         async_to_sync(self.channel_layer.group_add)(
#             self.game_group_name, self.channel_name
#         )

#         self.send(
#             text_data=json.dumps({"type": "playerId", "playerId": self.player_id})
#         )

#     def disconnect(self, close_code):
#         async_to_sync(self.channel_layer.group_discard)(
#             self.game_group_name, self.channel_name
#         )

#     def receive(self, text_data):
#         text_data_json = json.loads(text_data)
#         print(text_data_json)

from channels.generic.websocket import AsyncWebsocketConsumer
import json
import uuid
import logging

logger = logging.getLogger(__name__)

class PongConsumer(AsyncWebsocketConsumer):
    waiting_queue = []
    game_states = {}  # Dictionary to store game states
    players = {}  # Dictionary to store player information

    async def connect(self):
        logger.debug("*************** WebSocket connection established")
        self.room_name = 'game_room'
        self.player_id = str(uuid.uuid4())

        # Check if there are any waiting users
        if len(self.waiting_queue) > 0:
            # Match the user with the first user in the queue
            other_user = self.waiting_queue.pop(0)

            # Generate a unique room group name for the new game
            self.room_group_name = 'game_%s' % uuid.uuid4().hex

            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.channel_layer.group_add(self.room_group_name, other_user.channel_name)

            # Create a new game state and start the game
            self.game_states[self.room_group_name] = {'player1': self.channel_name, 'player2': other_user.channel_name}
            self.players[self.player_id] = {'id': self.player_id, 'room': self.room_group_name, 'player': 'player1'}
            self.players[other_user.player_id] = {'id': other_user.player_id, 'room': self.room_group_name, 'player': 'player2'}
            await self.send_game_state()
        else:
            # Add the user to the waiting queue
            self.waiting_queue.append(self)
        await self.accept()
        await self.send(
            text_data=json.dumps({"type": "playerId", "playerId": self.player_id})
        )
        
        logger.debug(f"\n\nWaiting queue: {self.waiting_queue}")
        
        # logger.info("New connection established")

    async def disconnect(self, close_code):
        # Remove the user from the waiting queue or ongoing game
        logger.debug(" *************** WebSocket connection closed")
        if self in self.waiting_queue:
            self.waiting_queue.remove(self)
        else:
            # Get the game state for the current room
            game_state = self.game_states[self.room_group_name]

            # Remove the game state
            del self.game_states[self.room_group_name]

            # Notify the other player that the game has ended
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_end_message',
                    'game_state': game_state,
                    'player': self.channel_name
                }
            )

            # Leave the room group
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        # Handle incoming messages (e.g., player's movements)
        data = json.loads(text_data)
        # Update the game state
        game_state = self.game_states[self.room_group_name]
        # Update game_state based on received data
        logger.debug(f"Received message: {data}")
        # Broadcast the updated game state
        await self.send_game_state()

    async def send_game_state(self):
        # Get the game state for the current room
        game_state = self.game_states[self.room_group_name]

        # Get the list of players in the current game
        playerss = [game_state['player1'], game_state['player2']]
        players = self.players

        # Send the game state only to the players in the current game
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_state_message',
                'game_state': game_state,
                'playerss': playerss,
                'players': players
            }
        )

    async def game_state_message(self, event):
        # Receive the game state and send it to the WebSocket
        game_state = event['game_state']
        players = event['players']
        playerss = event['playerss']

        # Check if the current connection is one of the players in the game
        if self.channel_name in playerss:
            await self.send(text_data=json.dumps({
                'type': 'gameState',
                'gameState': game_state,
                'players':players,
                'playerss': playerss
            }))