from channels.generic.websocket import AsyncWebsocketConsumer
import json
import uuid
import logging
import asyncio
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from pong.models import Game
from asgiref.sync import sync_to_async
from users.models import user_things

logger = logging.getLogger(__name__)
class MyConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        # Called when a new websocket connection is established
        await self.accept()
        user = self.scope['user']
        if user.is_authenticated:
            await self.update_user_status(user, 'online')
        else:
            await self.update_user_status(user, 'offline')

    async def disconnect(self, code):
        # Called when a websocket is disconnected
        user = self.scope['user']
        if user.is_authenticated:
            await self.update_user_status(user, 'offline')

    async def receive(self, text_data):
        # Called when a message is received from the websocket
        data = json.loads(text_data)
        if data['type'] == 'update_status':
            user = self.scope['user']
            if user.is_authenticated:
                logger.debug(f"\n\nUpdating status of {user.username} to online {data}")
                await self.update_user_status(user, "online")
            else:
                logger.debug(f"\n\nUser {user.username} is not authenticated \n\n {data}")
                await self.update_user_status(user, "offline")
    @database_sync_to_async
    def update_user_status(self, user, status):
        user_things.objects.filter(pk=user.pk).update(status=status)



class PongConsumer(AsyncWebsocketConsumer):
    waiting_queue = []
    game_states = {}
    paddleWidth = 5
    paddleHeight = 60

    async def connect(self):
        logger.debug(" \n\n WebSocket connection established")
        self.room_name = 'game_room'
        self.player_id = str(uuid.uuid4())

        await self.accept()
        await self.send(text_data=json.dumps({"type": "playerId", "playerId": self.player_id}))
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
            self.game_states[self.room_group_name] = {'player1': other_user.player_id, 'player2': self.player_id, 'p1_name': other_user.scope['user'].username, 'p2_name': self.scope['user'].username}
            self.game_states[self.room_group_name]['ball'] = {'x': 400, 'y': 200, 'speedx': 5, 'speedy': 5, 'radius': 7}
            self.game_states[self.room_group_name]['score1'] = 0
            self.game_states[self.room_group_name]['score2'] = 0
            self.game_states[self.room_group_name]['end'] = False
            await self.send_game_state()
        else:
            self.waiting_queue.append(self)

    async def disconnect(self, close_code):
        # Remove the user from the waiting queue or ongoing game
        logger.debug(" \n\n Disconnected  WebSocket connection closed")
        if self in self.waiting_queue:
            self.waiting_queue.remove(self)
        else:
            # Get the game state for the current room
            game_state = self.game_states[self.room_group_name]

            del self.game_states[self.room_group_name]
            name = self.scope['user'].username

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_end_message',
                    'message': f'{name} has left the game.'
                }
            )
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)

        if (data['type'] == 'updateState'):
            # logger.debug(f"\n\n Type of player {type(data['player'])}")
            try:
                if data['player'] == 1:
                    self.game_states[self.room_group_name]['paddle1'] = data['paddle']
                elif data['player'] == 2:
                    self.game_states[self.room_group_name]['paddle2'] = data['paddle']
            except KeyError as e:
                print(f"\n\nError accessing paddle data: {e}")
        elif (data['type'] == 'startGame'):
            try:
                if data['player'] == 1:
                    self.game_states[self.room_group_name]['paddle1'] = data['paddle']
                elif data['player'] == 2:
                    self.game_states[self.room_group_name]['paddle2'] = data['paddle']
                
                paddle1 = self.game_states[self.room_group_name]['paddle1']
                paddle2 = self.game_states[self.room_group_name]['paddle2']
                if paddle1 is not None and paddle2 is not None:
                    asyncio.create_task(self.move_ball())
            except KeyError as e:
                print(f"\n\nError accessing paddle data: {e}")
        elif (data['type'] == 'endGame'):
            try:
                del self.game_states[self.room_group_name]
                await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            except KeyError as e:
                print(f"\n\nError accessing paddle data: {e}")
            self.close()
    async def save_game(self, player1_username, player2_username, player1_score, player2_score):
        try:
            player1 = await sync_to_async(User.objects.get)(username=player1_username)
            player2 = await sync_to_async(User.objects.get)(username=player2_username)
            game = await sync_to_async(Game.objects.create)(
                player1=player1,
                player2=player2,
                player1_score=player1_score,
                player2_score=player2_score
            )
            return game
        except User.DoesNotExist:
            # Handle the case where a user with the provided username does not exist
            return None

    async def move_ball(self):
        while True:
            # logger.debug(f"\n\nMoving ball")
            game_state = self.game_states[self.room_group_name]
            ball = game_state['ball']

            # Update the ball position
            ball['x'] += ball['speedx']
            ball['y'] += ball['speedy']

            # Check if the ball has hit the top or bottom wall
            if ball['y'] <= 0 or ball['y'] >= 400:
                ball['speedy'] *= -1

            # Check if the ball has hit the left or right wall
            if ball['x'] <= 0 or ball['x'] >= 800:
                if ball['x'] <= 0:
                    game_state['score2'] += 1
                else:
                    game_state['score1'] += 1
                    
                if game_state['score1'] == 5 or game_state['score2'] == 5:
                    await self.save_game(game_state['p1_name'], game_state['p2_name'], game_state['score1'], game_state['score2'])
                    await self.send_game_state()
                    winner = game_state['p1_name'] if game_state['score1'] == 5 else game_state['p2_name']
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'game_end_message',
                            'message': f'{winner} won the game.'
                        }
                    )
                    game_state['end'] = True
                    return
                ball['x'] = 400
                ball['y'] = 200
                ball['speedx'] *= -1
            
            # Check if the ball has hit the paddle
            if (ball['x'] - ball['radius'] < self.paddleWidth and 
                game_state['paddle1']['y'] < ball['y'] < game_state['paddle1']['y'] + self.paddleHeight) and ball['speedx'] < 0:
                ball['speedx'] *= -1
            elif (ball['x'] + ball['radius'] > 800 - self.paddleWidth and 
                    game_state['paddle2']['y'] < ball['y'] < game_state['paddle2']['y'] + self.paddleHeight) and ball['speedx'] > 0:
                ball['speedx'] *= -1
            await self.send_game_state()
            await asyncio.sleep(0.01)

    async def send_game_state(self):
        game_state = self.game_states[self.room_group_name]

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_state_message',
                'game_state': game_state,
            }
        )

    async def game_state_message(self, event):
        # Receive the game state from the message payload
        game_state = event['game_state']
        # logger.info(f"\n\nSending game state: {game_state}")

        # Get the list of players from the game state dictionary
        players = [game_state['player1'], game_state['player2']]

        # Check if the current connection is one of the players in the game
        if self.player_id in players:
            await self.send(text_data=json.dumps({
                'type': 'gameState',
                'gameState': game_state,
            }))

    async def game_end_message(self, event):
        # Handle the game end message received by other players
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'gameEnd',
            'message': message
        }))