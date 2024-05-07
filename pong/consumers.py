from channels.generic.websocket import AsyncWebsocketConsumer
import json
import uuid
import logging
import asyncio
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from pong.models import Game
from asgiref.sync import sync_to_async
import math

logger = logging.getLogger(__name__)
# class MyConsumer(AsyncWebsocketConsumer):

#     async def connect(self):
#         # Called when a new websocket connection is established
#         await self.accept()
#         user = self.scope['user']
#         if user.is_authenticated:
#             await self.update_user_status(user, 'online')
#         else:
#             await self.update_user_status(user, 'offline')

#     async def disconnect(self, code):
#         # Called when a websocket is disconnected
#         user = self.scope['user']
#         if user.is_authenticated:
#             await self.update_user_status(user, 'offline')

#     async def receive(self, text_data):
#         # Called when a message is received from the websocket
#         data = json.loads(text_data)
#         if data['type'] == 'update_status':
#             user = self.scope['user']
#             if user.is_authenticated:
#                 logger.debug(f"\n\nUpdating status of {user.username} to online {data}")
#                 await self.update_user_status(user, "online")
#             else:
#                 logger.debug(f"\n\nUser {user.username} is not authenticated \n\n {data}")
#                 await self.update_user_status(user, "offline")
#     @database_sync_to_async
#     def update_user_status(self, user, status):
#         user_things.objects.filter(pk=user.pk).update(status=status)



class PongConsumer(AsyncWebsocketConsumer):
    waiting_queue = []
    game_states = {}
    paddleWidth = 10
    paddleHeight = 60

    async def connect(self):
        logger.debug(" \n\n WebSocket connection established\n\n")
        logger.debug(self.waiting_queue)
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
            self.game_states[self.room_group_name]['ball'] = {'x': 300, 'y': 200, 'velocityX': 5, 'velocityY': 5, 'radius': 10, 'speed': 6}
            self.game_states[self.room_group_name]['collision'] = {'paddle': False, 'goal': False, 'wall': False }
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
            try:
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
            except KeyError as e:
                print(f"\n\nError accessing paddle data: {e}")
        await self.close()

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
    async def collision(self, b, p):
        ptop = p['y']
        pbottom = p['y'] + self.paddleHeight
        pleft = p['x']
        pright = p['x'] + self.paddleWidth

        btop = b['y'] - b['radius']
        bbottom = b['y'] + b['radius']
        bleft = b['x'] - b['radius']
        bright = b['x'] + b['radius']

        return pleft < bright and ptop < bbottom and pright > bleft and pbottom > btop
        
    async def move_ball(self):
        while True:
            # logger.debug(f"\n\nMoving ball")
            game_state = self.game_states[self.room_group_name]
            ball = game_state['ball']

            # Update the ball position
            ball['x'] += ball['velocityX']
            ball['y'] += ball['velocityY']

            # Check if the ball has hit the top or bottom wall
            if ball['y'] - ball['radius'] < 0 or ball['y'] + ball['radius'] >= 400:
                game_state['collision']['wall'] = True
                ball['velocityY'] *= -1

            paddle = game_state['paddle1'] if ball['x'] < 300 else game_state['paddle2']
            if await self.collision(ball, paddle):
                game_state['collision']['paddle'] = True
                collidePoint = (ball['y'] - (paddle['y'] + self.paddleHeight / 2))
                normalizedCollidePoint = collidePoint / (self.paddleHeight / 2)
                angleRad = normalizedCollidePoint * (3.14 / 4)
                dir = 1 if ball['x'] < 300 else -1
                ball['velocityX'] = dir * ball['speed'] * math.cos(angleRad)
                ball['velocityY'] = ball['speed'] * math.sin(angleRad)
                ball['speed'] += 0.1
            # Check if the ball has hit the left or right wall
            if ball['x'] + ball['radius'] <= 0 or ball['x'] - ball['radius'] >= 600:
                game_state['collision']['goal'] = True
                if ball['x'] <= 0:
                    game_state['score2'] += 1
                else:
                    game_state['score1'] += 1
                    
                if game_state['score1'] == 10 or game_state['score2'] == 10:
                    await self.save_game(game_state['p1_name'], game_state['p2_name'], game_state['score1'], game_state['score2'])
                    await self.send_game_state()
                    winner = game_state['p1_name'] if game_state['score1'] == 10 else game_state['p2_name']
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'game_end_message',
                            'message': f'{winner} won the game.'
                        }
                    )
                    game_state['end'] = True
                    return
                ball['x'] = 300
                ball['y'] = 200
                ball['velocityX'] *= -1
                ball['speed'] = 6
            
            await self.send_game_state()
            game_state['collision']['paddle'] = False
            game_state['collision']['goal'] = False
            game_state['collision']['wall'] = False
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


class TournamentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        pass  # Clean up if needed

    async def receive(self, text_data):
        message = json.loads(text_data)
        action = message.get('action')
        user_id = await sync_to_async(self.get_user_id)()
        
        if action == 'join_tournament':
            user_id = message.get('user_id')
            if user_id:
                await self.add_player_to_tournament(user_id)

    @sync_to_async
    def add_player_to_tournament(self, user_id):
        # Check if the tournament already has 4 players
        tournament = Tournament.objects.filter(players__isnull=False).distinct().annotate(player_count=models.Count('players')).get(player_count__lt=4)
        if tournament:
            # Check if the user is already participating in any tournament
            if not TournamentPlayer.objects.filter(user_id=user_id).exists():
                user = User.objects.get(pk=user_id)
                TournamentPlayer.objects.create(user=user, tournament=tournament)
                # Check if the tournament now has 4 players
                if tournament.players.count() == 4:
                    self.start_tournament(tournament)
        else:
            print("No available tournament with less than 4 players.")

    @sync_to_async
    def start_tournament(self, tournament):
        # Update tournament start_date and end_date
        # Start the tournament
        pass