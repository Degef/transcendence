from channels.generic.websocket import AsyncWebsocketConsumer
import json
import uuid
import logging
import asyncio
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from apps.pong.models import Game, Challenge, create_challenge, accept_challenge, decline_challenge, user_has_pending_challenge, delete_challenge
from asgiref.sync import sync_to_async
import math
from apps.users.models import user_things
from django.db import transaction
from collections import deque
from apps.pong.models import Tournament, TournamentPlayer
from django.template.loader import render_to_string
import datetime
from datetime import timedelta

logger = logging.getLogger(__name__)

class PongConsumer(AsyncWebsocketConsumer):
	waiting_queue = []
	challenge_queue = {}
	game_states = {}
	paddleWidth = 10
	paddleHeight = 60

	async def connect(self):
		logger.debug(" \n\n WebSocket connection established\n\n")
		# logger.debug(f"\n\nUser: {self.waiting_queue}")
		self.room_name = 'game_room'
		self.username = self.scope['user'].username
		self.player_id = str(uuid.uuid4())
		self.challengee = ''
		self.challenger = ''

		await self.accept()
		await self.send(text_data=json.dumps({"type": "playerId", "playerId": self.player_id}))
		# Check if there are any waiting users
		
	async def disconnect(self, close_code):
		# Remove the user from the waiting queue or ongoing game
		logger.debug(f"\n\n {self.player_id} Disconnected  WebSocket connection closed")
		if self in self.waiting_queue:
			self.waiting_queue.remove(self)
		else:
			# Get the game state for the current room
			try:
				if hasattr(self, 'room_group_name') and self.room_group_name in self.game_states:
					game_state = self.game_states[self.room_group_name]

					del self.game_states[self.room_group_name]
					name = self.scope['user'].username

					await self.channel_layer.group_send(
						self.room_group_name,
						{
							'type': 'game_end_message',
							'message': f'{name} has left the game.',
							'player1': game_state['p1_name'],
							'player2': game_state['p2_name'],
							'score1': game_state['score1'],
							'score2': game_state['score2']
						}
					)
				# await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
			except KeyError as e:
				print(f"\n\nError accessing paddle data: {e}")
		await self.close()
	
	async def getInitGameInfo(self, other_user):
		startInfo = {
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
		return startInfo
	
	async def startGameNow(self, other_user):
		# Generate a unique room group name for the new game
		self.room_group_name = 'game_%s' % uuid.uuid4().hex
		other_user.room_group_name = self.room_group_name

		await self.channel_layer.group_add(self.room_group_name, self.channel_name)
		await self.channel_layer.group_add(self.room_group_name, other_user.channel_name)

		self.game_states[self.room_group_name] = await self.getInitGameInfo(other_user)
		await self.send_pnames(other_user);
		await asyncio.sleep(1)
		await self.send_game_state()

	
	async def send_pnames(self, other_user):
		await self.channel_layer.group_send(
			self.room_group_name,
			{
				'type': 'pnames',
				'p1_name': other_user.scope['user'].username,
				'p2_name': self.scope['user'].username,
			}
		)
		logger.error("\n\n\nSent player names\n\n\n")

	async def pnames(self, event):
		await self.send(text_data=json.dumps({
			'type': 'pnames',
			'p1_name': event['p1_name'],
			'p2_name': event['p2_name'],
		}))

	async def handleChallenge(self, data):
		challengee = data['challengee']
		challenger = data['challenger']
		gametype = data['type']
		self.challengee = challengee
		self.challenger = challenger
		if (self.username == challengee and challenger in self.challenge_queue):
			other_user = self.challenge_queue.pop(challenger)
			if (gametype == 'tournament'):
				self.challengee = ''
				self.challenger = ''
			await self.startGameNow(other_user)
		elif (self.username == challenger and challengee in self.challenge_queue):
			other_user = self.challenge_queue.pop(challengee)
			if (gametype == 'tournament'):
				self.challengee = ''
				self.challenger = ''
			await self.startGameNow(other_user)
		elif (self.username == challenger):
			self.challenge_queue[challenger] = self
		else:
			self.challenge_queue[challengee] = self

	async def handleDefaultGame(self, data):
		is_self_not_in_waiting_queue = self not in self.waiting_queue
		logger.error(f'\n\n\n\n Self not in waiting_queue: {is_self_not_in_waiting_queue} \n\n\n\n')
		if len(self.waiting_queue) > 0  and (self not in self.waiting_queue):
			other_user = self.waiting_queue.pop(0)
			logger.error(f'\n\n\n\n Found_Other_player: {other_user.username} vs {self.username} \n\n\n\n')
			await self.startGameNow(other_user)

		elif self not in self.waiting_queue:
			# self.waiting_queue.append(self)
			self.waiting_queue.append(self)
			waiting_players = [user.username for user in self.waiting_queue]
			logger.error(f'\n\n\n\n Waiting Players: {", ".join(waiting_players)} \n\n\n\n')
			# await asyncio.sleep(15)
			# if self in self.waiting_queue:
			# 	self.waiting_queue.remove(self)
			# 	await self.send_no_player_found()

	async def send_no_player_found(self):
		message = {
			'type': 'noPlayerFound',
			'message': 'No player found to play with.'
		}
		await self.send(text_data=json.dumps(message))
		await self.close()

	async def receive(self, text_data):
		data = json.loads(text_data)
		gametype = data['type']
		logger.debug(f"\n\nReceived data: {data}")
		if (gametype == 'challenge' or gametype == 'tournament'):
			await self.handleChallenge(data)
			return
		if (gametype == 'defaultGame'):
			await self.handleDefaultGame(data)
			return 
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
			elif data['type'] == 'endGame1':
				self.game_states[room_group_name]['end'] = True
			# elif data['type'] == 'endGame2':
			# 	await self.close()
				
			elif data['type'] == 'endGame':
				# self.game_states[room_group_name]['end'] = True
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
			if hasattr(self, 'room_group_name') and self.room_group_name in self.game_states:
				game_state = self.game_states[self.room_group_name]

				if game_state['end']:
					return

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
						if (self.challengee != '' and self.challenger != ''):
							await sync_to_async(delete_challenge)(self.challenger, self.challengee)
						await self.send_game_state()
						winner = game_state['p1_name'] if game_state['score1'] == 10 else game_state['p2_name']
						await self.channel_layer.group_send(
							self.room_group_name,
							{
								'type': 'game_end_message',
								'message': f'{winner} won the game.',
								'player1': game_state['p1_name'],
								'player2': game_state['p2_name'],
								'score1': game_state['score1'],
								'score2': game_state['score2']
							}
						)
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

	async def send_game_state(self):
		if hasattr(self, 'room_group_name') and self.room_group_name in self.game_states:
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
		p1 = event['player1']
		p2 = event['player2']
		s1 = event['score1']
		s2 = event['score2']
		await self.send(text_data=json.dumps({
			'type': 'gameEnd',
			'message': message,
			'player1': p1,
			'player2': p2,
			'score1': s1,
			'score2': s2
		}))


class ChallengeConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		user_id = await sync_to_async(self.get_user_id)()
		self.user = self.scope['user']
		await self.update_status('online')
		self.group_name = str(user_id)
		
		
		await self.channel_layer.group_add(
			self.group_name,
			self.channel_name
		)
		
		await self.accept()

	def get_user_id(self):
		return self.scope["session"]["_auth_user_id"]

	async def disconnect(self, close_code):
		await self.update_status('offline')
		await self.channel_layer.group_discard(
			self.group_name,
			self.channel_name
		)

	async def receive(self, text_data):
		logger.debug(" \n\n Received message from challenge consumer \n\n")
		data = json.loads(text_data)
		username = data.get('username')
		action = data.get('action')

		if action == 'send_challenge':
			await self.send_challenge(username)
		elif action == 'respond_challenge':
			await self.respond_challenge(username, data.get('response'))

	async def send_challenge(self, username):
		try:
			challengee = await sync_to_async(User.objects.get)(username=username)
			if challengee == self.user:
				await self.send_error('You cannot challenge yourself')
				return
			if_online_checker = await sync_to_async(user_things.objects.get)(user=challengee)
			if if_online_checker.status == 'offline':
				await self.send_error(f'{challengee} is offline')
				return
			if await sync_to_async(user_has_pending_challenge)(challengee.username):
				await self.send_error(f'{challengee} is in another challenge')
				return

			challenge = await sync_to_async(create_challenge)(self.user, challengee)
			await self.notify_users(challenge, 'challenge_created')

		except User.DoesNotExist:
			await self.send_error('User does not exist')

	async def respond_challenge(self, username, response):
		try:
			challenger = await sync_to_async(User.objects.get)(username=username)
			challenge = await sync_to_async(Challenge.objects.get)(challenger=challenger, challengee=self.user)

			if response == 'accept':
				await sync_to_async(accept_challenge)(self.user, challenger)
				await self.notify_users(challenge, 'challenge_accepted')
			elif response == 'decline':
				await sync_to_async(decline_challenge)(self.user, challenger)
				await self.notify_users(challenge, 'challenge_declined')

		except User.DoesNotExist:
			await self.send_error('User does not exist')
		except Challenge.DoesNotExist:
			await self.send_error('Challenge does not exist')

	async def notify_users(self, challenge, event_type):
		message = {
			'type': 'receive_group_message',
			'message': {
				'type': event_type,
				'challenger': await sync_to_async(lambda: challenge.challenger.username)(),
				'challengee': await sync_to_async(lambda: challenge.challengee.username)(),
			}
		}
		await self.channel_layer.group_send(str(challenge.challenger.id), message)
		await self.channel_layer.group_send(str(challenge.challengee.id), message)

	async def send_error(self, error_message):
		await self.send(text_data=json.dumps({'error': error_message}))

	async def receive_group_message(self, event):
		await self.send(text_data=json.dumps(event['message']))

	@database_sync_to_async
	def update_status(self, status):
		try:
			with transaction.atomic():
				user_thing = user_things.objects.get(user=self.user)
				user_thing.status = status
				user_thing.save()
		except user_things.DoesNotExist:
			pass





class TournamentConsumer(AsyncWebsocketConsumer):
	players_waiting = deque()
	players_waitingBig = deque()
	list_playersBig = []
	nextRound_players = {}
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
		self.player_id = str(uuid.uuid4())
		self.room_name = 'game_room'

		self.player_channels[self.username] = self.channel_name  # Store channel name


		await self.accept()
		await self.send(text_data=json.dumps({"type": "playerId", "playerId": self.player_id}))


	def get_user_id(self):
		return self.scope["session"]["_auth_user_id"]

	async def disconnect(self, close_code):
		# await self.channel_layer.group_discard(self.room_group_name,self.channel_name)
		if self in self.players_waiting:
			self.players_waiting.remove(self)
		logging.info(f"closing SocketConnection to Player {self.username}")
		await self.close()

	async def receive(self, text_data):
		data = json.loads(text_data)
		room_group_name = getattr(self, 'room_group_name', None)
		if data['type'] == 'join_tournament':
			await self.fetch_and_add_player_to_tournament(data)
		elif data['type'] == 'confirm_match_join':
			await self.handle_confirm_match_join(data)
		elif data['type'] == 'update_tournament':
			await self.update_tournament(data)
		elif data['type'] == 'match_result':
			await self.share_match_result(data)
		elif data['type'] == 'next_round_match':
			await self.handle_nextRound_match(data)
	  
		# await self.fetch_and_add_player_to_tournament()

	async def fetch_and_add_player_to_tournament(self, data):
		toursize = data['psize']
		if toursize == 4:
			if len(self.players_waiting) >= 3 and (self not in self.players_waiting):
				self.players_waiting.append(self)
				self.room_group_name = 'game_%s' % uuid.uuid4().hex
				# await self.channel_layer.group_add(self.room_group_name, self.channel_name)
				tournament = await sync_to_async(Tournament.objects.create)(start_date=datetime.datetime.now())

				await self.send_join_message(f"The last player is joining {self.username}")

				tourn_players = []
				for tuser in list(self.players_waiting)[:4]:
					tuser.room_group_name = self.room_group_name
					await self.channel_layer.group_add(self.room_group_name, tuser.channel_name)
					user = await sync_to_async(User.objects.get)(id=tuser.user_id)
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

				await asyncio.sleep(2)
				await self.create_match_rooms(tourn_players)

			elif self not in self.players_waiting:
				await self.send_join_message(f"Adding the player {self.username}")
				self.players_waiting.append(self)
		else:
			if len(self.players_waitingBig) >= 7 and (self.user_id not in self.list_playersBig):
				self.players_waitingBig.append(self.user_id)
				self.list_playersBig.append(self.user_id)
				tournament = await sync_to_async(Tournament.objects.create)(start_date=datetime.datetime.now())

				await self.send_join_message(f"The last player is joining {self.username}")

				tourn_players = []
				for user_id in list(self.players_waitingBig)[:4]:
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
				for _ in range(8):
					self.players_waitingBig.popleft()
					self.list_playersBig.pop(0)

				await asyncio.sleep(2)
				await self.create_match_rooms(tourn_players)
			

			elif self.user_id not in self.list_playersBig:
				await self.send_join_message(f"Adding the player {self.username}")
				self.list_playersBig.append(self.user_id)
				self.players_waitingBig.append(self.user_id)


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

	# async def create_match_rooms(self, tourn_players):
	# 	match1 = f"match_{tourn_players[0]['username']}_vs_{tourn_players[1]['username']}"
	# 	match2 = f"match_{tourn_players[2]['username']}_vs_{tourn_players[3]['username']}"

	# 	await self.send_match_room_invitation(match1, [tourn_players[0], tourn_players[1]])
	# 	await self.send_match_room_invitation(match2, [tourn_players[2], tourn_players[3]])
		
	async def create_match_rooms(self, tourn_players):
		# Iterate over tourn_players in steps of 2 to create pairs
		for i in range(0, len(tourn_players), 2):
			player1 = tourn_players[i]
			player2 = tourn_players[i + 1]
			match_name = f"match_{player1['username']}_vs_{player2['username']}"
			
			await self.send_match_room_invitation(match_name, [player1, player2])

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
	
	async def share_match_result(self, data):

		await self.channel_layer.group_send(
			self.room_group_name,
			{
				"type": "update_bracket",
				"player1": data['player1'],
				"player2": data['player2'],
				"score1": data['score1'],
				"score2": data['score2'],
				"melement": data['matchelement'],
				"winner": data['winner']
			}
		)

	async def update_bracket(self, event):
		pl1 = event['player1']
		pl2 = event['player2']
		sc1 = event['score1']
		sc2 = event['score2']
		winner = event['winner']
		melement = event['melement']

		await self.send(text_data=json.dumps({
			"type": "update_bracket",
			"player1": pl1,
			"player2": pl2,
			"score1": sc1,
			"score2": sc2,
			"winner": winner,
			"melement": melement
		}))


	async def create_nextmatch_rooms(self, nextPlayers):
		num_players = len(nextPlayers)
		logging.info(f"Sending match invitation to room newroom for players: {[p['username'] for p in nextPlayers]}")
		for i in range(0, num_players, 2):
			match = f"match_{nextPlayers[i]['username']}_vs_{nextPlayers[i + 1]['username']}"
			await self.send_match_room_invitation(match, [nextPlayers[i], nextPlayers[i + 1]])

	async def handle_nextRound_match(self, data):

		if data['plcount'] == 2:
			other_player = self.nextRound_players.pop(data['opponent'])
			nextPlayers = []
			# nextPlayers.append(self)
			# nextPlayers.append(other_player)

			nextPlayers.append({
				'username': self.username,
			})
			nextPlayers.append({
				'username': other_player.username,
			})


			await asyncio.sleep(2)
			await self.create_nextmatch_rooms(nextPlayers)

		else:
			await self.send_join_message(f"Adding the player {self.username}")
			self.nextRound_players[data['player']] = self
