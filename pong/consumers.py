from channels.generic.websocket import AsyncWebsocketConsumer
import json
import uuid
import logging

logger = logging.getLogger(__name__)

class PongConsumer(AsyncWebsocketConsumer):
    waiting_queue = []
    game_states = {}  # Dictionary to store game states
    # players = {}  # Dictionary to store player information

    async def connect(self):
        logger.debug(" \n\n WebSocket connection established")
        self.room_name = 'game_room'
        self.player_id = str(uuid.uuid4())

        # Check if there are any waiting users
        if len(self.waiting_queue) > 0:
            # Match the user with the first user in the queue
            other_user = self.waiting_queue.pop(0)

            # Generate a unique room group name for the new game
            self.room_group_name = 'game_%s' % uuid.uuid4().hex
            other_user.room_group_name = self.room_group_name

            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.channel_layer.group_add(self.room_group_name, other_user.channel_name)

            # Create a new game state and start the game
            self.game_states[self.room_group_name] = {'player1': self.player_id, 'player2': other_user.player_id}
            # self.players[self.player_id] = {'id': self.player_id, 'room': self.room_group_name, 'player': 'player1'}
            # self.players[other_user.player_id] = {'id': other_user.player_id, 'room': self.room_group_name, 'player': 'player2'}
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
        logger.debug(" \n\n Disconnected  WebSocket connection closed")
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
        data = json.loads(text_data)
            
        # Update the game state
        
        if (data['type'] == 'updatePaddle'):
            logger.debug(f"\n\n Type of player {type(data['player'])}")
            if data['player'] == 1:
                logger.debug(f"\n\n here 1")
                self.game_states[self.room_group_name]['paddle1'] = data['paddle'] # Update the paddle position for player 1
            elif data['player'] == 2:
                logger.debug(f"\n\n here 2")
                self.game_states[self.room_group_name]['paddle2'] = data['paddle']
        
        # Update game_state based on received data
        logger.debug(f"\n\nReceived message: {data}")
        logger.debug(f"\n\nself.game_states[self.room_group_name] {self.game_states[self.room_group_name]}")
        # Broadcast the updated game state
        await self.send_game_state()

    async def send_game_state(self):
        # Get the game state for the current room
        game_state = self.game_states[self.room_group_name]

        # Get the list of players in the current game
        # playerss = [game_state['player1'], game_state['player2']]
        # players = self.players

        # Send the game state only to the players in the current game
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_state_message',
                'game_state': game_state,
                # 'playerss': playerss,
                # 'players': players
            }
        )

    async def game_state_message(self, event):
        # Receive the game state and send it to the WebSocket
        game_state = event['game_state']
        # players = event['players']
        # playerss = event['playerss']

        # Check if the current connection is one of the players in the game
        # if self.channel_name in playerss:
        await self.send(text_data=json.dumps({
            'type': 'gameState',
            'gameState': game_state,
            # 'players':players,
            # 'playerss': playerss
        }))