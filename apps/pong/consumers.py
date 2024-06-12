from channels.generic.websocket import AsyncWebsocketConsumer
import json
import uuid
import logging
import asyncio
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from apps.pong.models import Game
from apps.pong.models import Tournament ,TournamentPlayer
from asgiref.sync import sync_to_async
from asgiref.sync import async_to_sync
import math
from django.template.loader import render_to_string
import datetime

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
        # logger.debug(self.waiting_queue)
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

            self.game_states[self.room_group_name] = {
                'player1': other_user.player_id,
                'player2': self.player_id,
                'p1_name': other_user.scope['user'].username,
                'p2_name': self.scope['user'].username,
                'ball': {'x': 300, 'y': 200, 'velocityX': 4, 'velocityY': 0, 'radius': 10, 'speed': 4},
                'collision': {'paddle': False, 'goal': False, 'wall': False},
                'score1': 0,
                'score2': 0,
                'end': False,
                'paddle1': None,
                'paddle2': None
            }
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
        # logger.debug(f"\n\nReceived data: {data}")
        room_group_name = getattr(self, 'room_group_name', None)
        if not room_group_name:
            logger.error("\n\nRoom group name not set")
            return
        
        try:
            if data['type'] == 'updateState':
                if data['player'] == 1:
                    self.game_states[room_group_name]['paddle1'] = data['paddle']
                elif data['player'] == 2:
                    self.game_states[room_group_name]['paddle2'] = data['paddle']
            elif data['type'] == 'startGame':
                logger.debug("\n\nStarting game")
                if data['player'] == 1:
                    self.game_states[room_group_name]['paddle1'] = data['paddle']
                elif data['player'] == 2:
                    self.game_states[room_group_name]['paddle2'] = data['paddle']

                paddle1 = self.game_states[room_group_name]['paddle1']
                paddle2 = self.game_states[room_group_name]['paddle2']
                if paddle1 is not None and paddle2 is not None:
                    asyncio.create_task(self.move_ball())
            elif data['type'] == 'endGame':
                del self.game_states[room_group_name]
                await self.channel_layer.group_discard(room_group_name, self.channel_name)
                await self.close()
        except KeyError as e:
            logger.error(f"Error accessing paddle data: {e}")
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
                    await self.notify_tournament_consumer(winner, game_state['p1_name'], game_state['p2_name'])
                    game_state['end'] = True
                    return
                ball['velocityY'] = 0
                ball['velocityX'] = 4 if ball['x'] < 300 else -4
                ball['x'] = 300
                ball['y'] = 200
                # ball['velocityX'] *= -1
                ball['speed'] = 4
            
            await self.send_game_state()
            game_state['collision']['paddle'] = False
            game_state['collision']['goal'] = False
            game_state['collision']['wall'] = False
            await asyncio.sleep(0.01)

    async def notify_tournament_consumer(self, winner, player1, player2):
        tournament_room_group_name = 'tournament'
        await self.channel_layer.group_send(
            tournament_room_group_name,
            {
                'type': 'update_tournament_bracket',
                'winner': winner,
                'player1': player1,
                'player2': player2,
            }
        )

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


# class TournamentConsumer(AsyncWebsocketConsumer):
#     players_waiting = []
#     list_players = []

#     async def connect(self):
#         self.user_id = await sync_to_async(self.get_user_id)()
#         self.username = self.scope["user"].username
#         print(f"Player id is : {self.user_id}")
#         self.room_group_name = 'test'

#         await self.channel_layer.group_add(
#             self.room_group_name,
#             self.channel_name
#         )
#         await self.accept()

#     def get_user_id(self):
#         return self.scope["session"]["_auth_user_id"]


#     async def chat_message(self, event):
#         message = event['message']

#         await self.send(text_data=json.dumps({
#             'type': 'chat',
#             'message': message
#         }))

#     async def disconnect(self, close_code):
#         await self.channel_layer.group_discard(
#             self.room_group_name,
#             self.channel_name
#         )


#     async def receive(self, text_data):
#         # text_data_json = json.loads(text_data)
#         # message = text_data_json['action']
#         # await self.channel_layer.group_send(
#         #     self.room_group_name,
#         #     {
#         #         'type': 'chat_message',
#         #         'message': message
#         #     }
#         # )
#         await self.fetch_and_add_player_to_tournament()
    

#     async def fetch_and_add_player_to_tournament(self):
#         if len(self.players_waiting) >= 3 and (self.user_id not in self.list_players):
#             self.players_waiting.append(self.user_id)
#             self.list_players.append(self.user_id)
#             tournament = await sync_to_async(Tournament.objects.create)(start_date=datetime.datetime.now())

#             await self.send_join_message(f"the last player is joining {self.username}")

#             tourn_players = []
#             for user_id in self.players_waiting[:4]:
#                 user = await sync_to_async(User.objects.get)(id=user_id)
#                 profile_img = await sync_to_async(lambda: user.profile.image.url)()
#                 tourn_players.append({
#                     'username':user.username,
#                     'profile_img':profile_img
#                     })
#                 user.tournament = tournament
#                 await sync_to_async(user.save)()
#             player1 = tourn_players[0];
#             player2 = tourn_players[1];
#             player3 = tourn_players[2];
#             player4 = tourn_players[3];
#             tourplayer =  {'p1' : player1, 'p2' : player2, 'p3':player3, 'p4':player4}

#             html_content = await sync_to_async(render_to_string)('pong/online_tourn.html', {'players_list': tourn_players})
#             await self.broadcast_html_content(html_content)

#             # await self.create_match_rooms(tourn_players)

#             del self.players_waiting[:4]
#             del self.list_players[:4]
#         elif self.user_id not in self.list_players:
#             print(self.list_players)
#             await self.send_join_message(f"adding the player {self.username}")
#             self.list_players.append(self.user_id)
#             self.players_waiting.append(self.user_id)
#             print(self.list_players)


#     async def get_players_waiting_count(self):
#         return await sync_to_async(TournamentPlayer.objects.filter(tournament__isnull=True).count)()

#     async def start_tournament(self, tournament):
#         # Implement tournament start logic here start tournament here
#         pass

#     async def send_waiting_message(self):
#         newm = 'Waiting for more players to join the tournament.- ' + str(len(self.players_waiting))
#         await self.send(text_data=json.dumps({
#             'message': newm
#         }))
        
#     async def send_join_message(self, playername):
#         newm = 'joinmsg - ' + playername
#         await self.send(text_data=json.dumps({
#             'type': 'join_msg',
#             'message': newm
#         }))

#     async def broadcast_player_names(self, player_names):
#         await self.channel_layer.group_send(
#             self.room_group_name,
#             {
#                 'type': 'player_names',
#                 'player_names': player_names
#             }
#         )

#     async def player_names(self, event):
#         player_names = event['player_names']
#         await self.send(text_data=json.dumps({
#             'type': 'player_names',
#             'player_names': player_names
#         }))
#     async def broadcast_html_content(self, html_content):
#         await self.channel_layer.group_send(
#             self.room_group_name,
#             {
#                 "type": "html.message",
#                 "html": html_content
#             }
#         )


#     async def html_message(self, event):
#         html_content = event["html"]
#         await self.send(text_data=json.dumps({
#             "type": "html_content",
#             "html": html_content
#         }))
        
#     async def create_match_rooms(self, tourn_players):
#         match1 = f"match_{tourn_players[0]['username']}_vs_{tourn_players[1]['username']}"
#         match2 = f"match_{tourn_players[2]['username']}_vs_{tourn_players[3]['username']}"
        
#         # Notify players to join their match rooms
#         await self.send_match_room_invitation(match1, [tourn_players[0], tourn_players[1]])
#         await self.send_match_room_invitation(match2, [tourn_players[2], tourn_players[3]])
#         await self.match_room_ready(match1)
#         await self.match_room_ready(match2)

#     async def send_match_room_invitation(self, match_room_name, players):
#         for player in players:
#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     'type': 'match_invitation',
#                     'match_room': match_room_name,
#                     'player': player['username']
#                 }
#             )

#     async def match_invitation(self, event):
#         match_room = event['match_room']
#         player = event['player']
#         if self.username == player:
#             await self.send(text_data=json.dumps({
#                 'type': 'match_invitation',
#                 'match_room': match_room
#             }))

#     async def match_message(self, event):
#         message = event['message']
#         await self.send(text_data=json.dumps({
#             'type': 'match',
#             'message': message
#         }))

#     async def send_online_html_to_match_players(self, match_room_name):
#         print("List players:", self.list_players)
#         players_in_room = []
#         for player in self.list_players:
#             if player['match_room'] and player['match_room'] == match_room_name:  # Ensure 'match_room' exists and compare
#                 players_in_room.append(player['username'])
#         print("Players in room:", players_in_room)
#         await asyncio.sleep(10)
#         html_content = await sync_to_async(render_to_string)('pong/play_online.html', {'players_list': players_in_room})
#         await self.broadcast_html_content(html_content)


#     async def match_room_ready(self, match_room_name):
#         await self.send_online_html_to_match_players(match_room_name)





import json
import datetime
from channels.generic.websocket import AsyncWebsocketConsumer
from django.template.loader import render_to_string
from django.contrib.auth.models import User
from asgiref.sync import sync_to_async
from collections import deque
from .models import Tournament, TournamentPlayer
from collections import defaultdict


class TournamentConsumer(AsyncWebsocketConsumer):
    players_waiting = deque()
    list_players = []
    # confirmed_players = defaultdict(set)
    confirmed_players = {}
    player_names_dict = {}
    player_channels = {}
    confirmed_channels = {}
    game_states = {}
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # self.confirmed_players = defaultdict(set)

    async def connect(self):
        self.user_id = await sync_to_async(self.get_user_id)()
        self.username = self.scope["user"].username
        self.room_group_name = 'test'
        self.player_id = str(uuid.uuid4())

        self.player_channels[self.username] = self.channel_name  # Store channel name

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        await self.send(text_data=json.dumps({"type": "playerId", "playerId": self.player_id}))


    def get_user_id(self):
        return self.scope["session"]["_auth_user_id"]

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        if self.user_id in self.list_players:
            self.list_players.remove(self.user_id)
            self.players_waiting.remove(self.user_id)

    async def receive(self, text_data):
        data = json.loads(text_data)
        room_group_name = getattr(self, 'room_group_name', None)
        if data['type'] == 'join_tournament':
            await self.fetch_and_add_player_to_tournament()
        elif data['type'] == 'confirm_match_join':
            await self.handle_confirm_match_join(data)
        else :
            try:
                if data['type'] == 'updateState':
                    if data['player'] == 1:
                        self.game_states[room_group_name]['paddle1'] = data['paddle']
                    elif data['player'] == 2:
                        self.game_states[room_group_name]['paddle2'] = data['paddle']
                elif data['type'] == 'startGame':
                    logger.debug("\n\nStarting game")
                    if data['player'] == 1:
                        self.game_states[room_group_name]['paddle1'] = data['paddle']
                    elif data['player'] == 2:
                        self.game_states[room_group_name]['paddle2'] = data['paddle']

                    paddle1 = self.game_states[room_group_name]['paddle1']
                    paddle2 = self.game_states[room_group_name]['paddle2']
                    logger.debug(f"\n\nPaddles-1- {paddle1}")
                    logger.debug(f"\n\nPaddles-2- {paddle}")
                    if paddle1 is not None and paddle2 is not None:
                        asyncio.create_task(self.move_ball())
                elif data['type'] == 'endGame':
                    del self.game_states[room_group_name]
                    await self.channel_layer.group_discard(room_group_name, self.channel_name)
                    await self.close()
            except KeyError as e:
                logger.error(f"Error accessing paddle data: {e}")
        # await self.fetch_and_add_player_to_tournament()

    async def fetch_and_add_player_to_tournament(self):
        if len(self.players_waiting) >= 3 and (self.user_id not in self.list_players):
            self.players_waiting.append(self.user_id)
            self.list_players.append(self.user_id)
            tournament = await sync_to_async(Tournament.objects.create)(start_date=datetime.datetime.now())

            await self.send_join_message(f"The last player is joining {self.username}")

            tourn_players = []
            for user_id in list(self.players_waiting)[:4]:
                user = await sync_to_async(User.objects.get)(id=user_id)
                profile_img = await sync_to_async(lambda: user.profile.image.url)()
                tourn_players.append({
                    'username': user.username,
                    'profile_img': profile_img
                })
                user.tournament = tournament
                await sync_to_async(user.save)()

            html_content = await sync_to_async(render_to_string)('pong/online_tour_bracket.html', {'players_list': tourn_players})
            await self.broadcast_html_content(html_content)

            # del self.players_waiting[:4]
            # del self.list_players[:4]
            for _ in range(4):
                self.players_waiting.popleft()
                self.list_players.pop(0)

            await self.create_match_rooms(tourn_players)

        elif self.user_id not in self.list_players:
            await self.send_join_message(f"Adding the player {self.username}")
            self.list_players.append(self.user_id)
            self.players_waiting.append(self.user_id)

    async def send_join_message(self, playername):
        newm = 'joinmsg - ' + playername
        await self.send(text_data=json.dumps({
            'type': 'join_msg',
            'message': newm
        }))

    async def broadcast_html_content(self, html_content):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "html_message",
                "html": html_content
            }
        )

    async def html_message(self, event):
        html_content = event["html"]
        await self.send(text_data=json.dumps({
            "type": "html_content",
            "html": html_content
        }))

    async def create_match_rooms(self, tourn_players):
        match1 = f"match_{tourn_players[0]['username']}_vs_{tourn_players[1]['username']}"
        match2 = f"match_{tourn_players[2]['username']}_vs_{tourn_players[3]['username']}"

        await self.send_match_room_invitation(match1, [tourn_players[0], tourn_players[1]])
        await self.send_match_room_invitation(match2, [tourn_players[2], tourn_players[3]])

    async def send_match_room_invitation(self, match_room_name, players):
        for player in players:
            player_channel_name = self.player_channels.get(player['username'])
            if player_channel_name:
                logging.info(f"Adding player {player['username']} to match room {match_room_name}")
                await self.channel_layer.group_add(
                    match_room_name,
                    player_channel_name  # Use the correct channel name for each player
                )

        logging.info(f"Sending match invitation to room {match_room_name} for players: {[p['username'] for p in players]}")
        await self.channel_layer.group_send(
            match_room_name,
            {
                'type': 'match_invitation',
                'match_room': match_room_name,
                'players': [p['username'] for p in players]
            }
        )


    async def match_invitation(self, event):
        match_room = event['match_room']
        players = event['players']
        
        logging.info(f"Match invitation received in room {match_room} for players: {players}")

        for player in players:
            if self.username == player:
                opponent = [p for p in players if p != self.username][0]
                logging.info(f"Sending match invitation to {self.username} with opponent {opponent}")
                await self.send(text_data=json.dumps({
                    'type': 'match_invitation',
                    'match_room': match_room,
                    'player': self.username,
                    'opponent': opponent,
                    'players': players
                }))



    async def send_online_html_to_match_players(self, match_room_name, players):
        html_content = await sync_to_async(render_to_string)('pong/online_game.html', {'players_list': players})
        await self.channel_layer.group_send(
            match_room_name,
            {
                "type": "html_message",
                "html": html_content
            }
        )

    async def handle_confirm_match_join(self, data):
        match_room = data.get('match_room')
        player = self.username

        if not match_room or not player:
            logging.error(f"Invalid data received: match_room={match_room}, player={player}")
            return
        logging.error(f"Invalid data received: match_room={match_room}, player={player}")

        # Initialize the set if it doesn't exist
        if match_room not in self.confirmed_players:
            self.confirmed_players[match_room] = set()

        # Add the player to the set of confirmed players for the match room
        self.confirmed_players[match_room].add(player)
        self.confirmed_channels[match_room] = self.channel_name  # Track the confirmed player's channel

        # Get the players in the match room
        players = self.confirmed_players.get(match_room, set())

        # Check if both players have confirmed for the match room
        if len(players) == 2:
            await self.send_load_game_message(match_room, players)
            # await self.start_game_logic(match_room, players)
        else:
            # One player has confirmed, wait for the other player
            await self.send_waiting_message(match_room, self.channel_name)

    async def send_load_game_message(self, match_room, players):
        # Send message to both players to load game.html
        html_content = await sync_to_async(render_to_string)('pong/online_game.html', {'players': players})
        await self.channel_layer.group_send(
            match_room,
            {
                'type': 'load_game',
                'match_room': match_room,
                'players': players,
                'message': f"{', '.join(players)} are ready to play. Load the game.html page to start the game.",
                'html': html_content
            }
        )
        
        logging.info(f"Starting game in match room: {match_room} with players: {players}")
        # await self.start_game(match_room, players)

    async def load_game(self, event):
        message = event['message']
        html_content = event['html']
        match_room = event['match_room']
        players = event['players']
        
        logging.info("Sending load_game message")
        await self.send(text_data=json.dumps({
            'type': 'load_game',
            'message': message,
            'html': html_content
        }))
        
        # await asyncio.sleep(15)
        
        # logging.info(f"Starting game in match room: {match_room} with players: {players}")
        # await self.start_game(match_room, players)
        # logging.info(f"Loading game: {message}")


    async def send_waiting_message(self, match_room, confirmed_channel):
        await self.channel_layer.send(
            confirmed_channel,
            {
                'type': 'waiting_for_opponent',
                'message': "Waiting for your opponent to confirm."
            }
        )

    async def waiting_for_opponent(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'waiting_for_opponent',
            'message': message
        }))

    async def match_room_ready(self, match_room_name, players):
        await self.send_online_html_to_match_players(match_room_name, players)

    async def match_completed(self, winner, loser):
        # Logic to handle match completion and updating the bracket
        pass

    async def broadcast_tournament_update(self):
        # Logic to broadcast updated tournament bracket to all players
        pass

    async def start_game_logic(self, match_room, players):
        # Initialize game state
        players_list = list(players)
        game_state = {
            'player1': players_list[0],
            'player2': players_list[1],
            'score1': 0,
            'score2': 0,
            'end': False,
            'ball': {'x': 300, 'y': 200, 'velocityX': 4, 'velocityY': 0, 'radius': 10, 'speed': 4},
            'collision': {'paddle': False, 'goal': False, 'wall': False},
            'paddle1': None,
            'paddle2': None
            # Add other necessary game state variables
        }

        self.game_states[match_room] = game_state  # Store the game state

        logging.info(f"Starting game in match room: {match_room} with players: {players_list}")

        # Send initial game state to players
        await self.send_game_state(match_room, game_state)

        # Start the game loop
        while not game_state['end']:
            logging.debug("Game loop iteration")
            # Your game logic here
            # For example:
            # - Update ball position
            # - Check for collisions
            # - Update scores
            # - Check for game end conditions

            # Send updated game state to players
            await self.send_game_state(match_room, game_state)

            # Introduce a small delay between game updates
            await asyncio.sleep(0.1)

        logging.info("Game has ended")
    # Game has ended, perform any necessary cleanup or post-game actions

    async def send_game_state(self, match_room, game_state):
        logging.debug(f"Sending game state to match room: {match_room}")
        await self.channel_layer.group_send(
            match_room,
            {
                'type': 'game_state_message',
                'game_state': game_state,
            }
        )
        logging.debug(f"Game state sent to group {match_room}")

    async def game_state_message(self, event):
        # Receive the game state from the message payload
        game_state = event['game_state']
        logging.debug(f"Received game state message: {game_state}")

        # Get the list of players from the game state dictionary
        players = [game_state['player1'], game_state['player2']]

        # Check if the current connection is one of the players in the game
        if self.username in players:
            await self.send(text_data=json.dumps({
                'type': 'gameState',
                'gameState': game_state,
            }))



    async def game_end_message(self, event):
        # Handle the game end message received by other players
        message = event['message']
        logging.info(f"Game end message: {message}")
        await self.send(text_data=json.dumps({
            'type': 'gameEnd',
            'message': message
        }))

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
                    await self.send_game_state(self.match_room, game_state)
                    winner = game_state['p1_name'] if game_state['score1'] == 10 else game_state['p2_name']
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'game_end_message',
                            'message': f'{winner} won the game.'
                        }
                    )
                    await self.notify_tournament_consumer(winner, game_state['p1_name'], game_state['p2_name'])
                    game_state['end'] = True
                    return
                ball['velocityY'] = 0
                ball['velocityX'] = 4 if ball['x'] < 300 else -4
                ball['x'] = 300
                ball['y'] = 200
                # ball['velocityX'] *= -1
                ball['speed'] = 4
            
            await self.send_game_state(self.match_room, game_state)
            game_state['collision']['paddle'] = False
            game_state['collision']['goal'] = False
            game_state['collision']['wall'] = False
            await asyncio.sleep(0.01)
            
