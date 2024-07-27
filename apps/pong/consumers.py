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
from apps.pong.models import Tournament
from django.template.loader import render_to_string
import datetime
from datetime import timedelta
import random

logger = logging.getLogger(__name__)

def generate_rand_dir():
	angle_ranges = [
		(0, 60),
		(120, 180),
		(180, 240),
		(300, 360)
	]
	
	# Select a random range
	selected_range = random.choice(angle_ranges)
	
	# Generate a random angle within the selected range and convert to radians
	angle = random.uniform(selected_range[0], selected_range[1]) * (math.pi / 180)
	
	# Calculate the x and y components based on the angle
	x = 4 * math.cos(angle)
	y = 4 * math.sin(angle)
	
	return x, y

class PongConsumer(AsyncWebsocketConsumer):
	waiting_queue = []
	challenge_queue = {}
	game_states = {}
	paddleWidth = 10
	paddleHeight = 60

	async def connect(self):
		logger.error(" \n\n  WebSocket connection established \n\n")
		# logger.debug(f"\n\nUser: {self.waiting_queue}")
		self.room_name = 'game_room'
		self.username = self.scope['user'].username
		self.player_id = str(uuid.uuid4())
		self.challengee = ''
		self.challenger = ''
		self.t_id = None
		self.g_round= None 
		self.g_side=None
		self.g_num=None
		self.game_type = 'default'

		await self.accept()
		await self.send(text_data=json.dumps({"type": "playerId", "playerId": self.player_id, "username": self.username}))
		# Check if there are any waiting users
		
	async def disconnect(self, close_code):
		# Remove the user from the waiting queue or ongoing game
		logger.error(f"\n\n {self.player_id} Disconnected  WebSocket connection closed")
		if self.username in self.challenge_queue:
			self.challenge_queue.pop(self.username)
		if self in self.waiting_queue:
			self.waiting_queue.remove(self)
		else:
			# Get the game state for the current room
			try:
				if hasattr(self, 'room_group_name') and self.room_group_name in self.game_states:
					game_state = self.game_states[self.room_group_name]

					if game_state:
						del self.game_states[self.room_group_name]
						name = self.scope['user'].username
						if (game_state['score1'] == 0 and game_state['score2'] == 0):
								game_state['winner'] = game_state['p1_name'] if name != game_state['p1_name'] else game_state['p2_name']
								game_state['score1'], game_state['score2'] = (4, 0) if name != game_state['p1_name'] and name != game_state['p2_name'] else (0, 4)
								if (self.game_type == 'challenge'): 
									await self.save_game(game_state['p1_name'], game_state['p2_name'], game_state['score1'], game_state['score2'])
						await self.channel_layer.group_send(
							self.room_group_name,
							{
								'type': 'game_end_message',
								'message': f'{name} has left the game.',
								'player1': game_state['p1_name'],
								'player2': game_state['p2_name'],
								'score1': game_state['score1'],
								'score2': game_state['score2'],
								'winner': game_state['winner']
							}
						)
				# await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
			except KeyError as e:
				print(f"\n\nError accessing paddle data: {e}")
		if (self.challengee != '' and self.challenger != ''):
			await sync_to_async(delete_challenge)(self.challenger, self.challengee)
		self.game_type = 'default'
		await self.close()
	
	async def getInitGameInfo(self, other_user):
		ball_dir = generate_rand_dir();
		startInfo = {
			'player1': other_user.player_id,
			'player2': self.player_id,
			'p1_name': other_user.scope['user'].username,
			'p2_name': self.scope['user'].username,
			'ball': {'x': 300, 'y': 200, 'velocityX': ball_dir[0], 'velocityY': ball_dir[1], 'radius': 10, 'speed': 4},
			'collision': {'paddle': False, 'goal': False, 'wall': False},
			'score1': 0,
			'score2': 0,
			'end': False,
			'paddle1': None,
			'paddle2': None,
			'winner': None,
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
		self.game_type = gametype
		self.challengee = challengee
		self.challenger = challenger
		logger.error(f"Challenger: {self.challenger}, Challengee: {self.challengee}, Challenge Queue: {self.challenge_queue}")
		if (gametype == 'tournament'):
			self.t_id = data['t_id']
			self.g_round = data['round']
			self.g_side = data['side']
			self.g_num = data['g_num']
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
		# logger.debug(f"\n\nReceived data: {data}")
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
			game_statetmp = self.game_states.get(room_group_name, None)
		
			if not game_statetmp:
				return
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
				if (self.username == self.game_states[room_group_name]['p1_name']):
					await self.save_game(self.game_states[room_group_name]['p1_name'], self.game_states[room_group_name]['p2_name'], 0, 4)
				else:
					await self.save_game(self.game_states[room_group_name]['p1_name'], self.game_states[room_group_name]['p2_name'], 4, 0)
				self.game_states[room_group_name]['end'] = True
				self.game_states[room_group_name]['winner'] = data['winner']
				
			elif data['type'] == 'endGame':
				# self.game_states[room_group_name]['end'] = True
				del self.game_states[room_group_name]
				await self.channel_layer.group_discard(room_group_name, self.channel_name)
				if (self.challengee != '' and self.challenger != ''):
					await sync_to_async(delete_challenge)(self.challenger, self.challengee)
				await self.close()
		except KeyError as e:
			logger.error(f"Error accessing paddle data: {e}")
	# async def save_game(self, player1_username, player2_username, player1_score, player2_score):
	# 	try:
	# 		player1 = await sync_to_async(User.objects.get)(username=player1_username)
	# 		player2 = await sync_to_async(User.objects.get)(username=player2_username)
	# 		game = await sync_to_async(Game.objects.create)(
	# 			player1=player1,
	# 			player2=player2,
	# 			player1_score=player1_score,
	# 			player2_score=player2_score
	# 		)
	# 		return game
	# 	except User.DoesNotExist:
	# 		# Handle the case where a user with the provided username does not exist
	# 		return None
	async def save_game(self, player1_username, player2_username, player1_score, player2_score):
		try:
			player1 = await sync_to_async(User.objects.get)(username=player1_username)
			player2 = await sync_to_async(User.objects.get)(username=player2_username)
			# tour = await sync_to_async(Tournament.objects.get)(pk=self.t_id)
			tour = None
			if self.t_id is not None:
				tour = await sync_to_async(Tournament.objects.get)(pk=self.t_id)

			game = await sync_to_async(Game.objects.create)(
				player1=player1,
				player2=player2,
				player1_score=player1_score,
				player2_score=player2_score,
				is_tournament_game=bool(self.t_id),
				tournament_id=tour if self.t_id else None,  # Assign the Tournament instance
				round=self.g_round if self.g_round in dict(Game.ROUND_CHOICES).keys() else None,
				game_number=self.g_num if self.g_num is not None else None,
				side=self.g_side if self.g_side in dict(Game.SIDE_CHOICES).keys() else None
			)
			
			return game
		
		except Exception as e:
			# Handle exceptions or errors
			print(f"Error saving game: {e}")
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
					# ball_dir = generate_rand_dir();
					# ball['velocityX'] = ball_dir[0]
					# ball['velocityY'] = ball_dir[1]
					# ball['speed'] = 7
					# ball['speed'] += 0.1
				# Check if the ball has hit the left or right wall
				if ball['x'] + ball['radius'] <= 0 or ball['x'] - ball['radius'] >= 600:
					game_state['collision']['goal'] = True
					if ball['x'] <= 0:
						game_state['score2'] += 1
					else:
						game_state['score1'] += 1
						
					if game_state['score1'] == 4 or game_state['score2'] == 4:
						await self.save_game(game_state['p1_name'], game_state['p2_name'], game_state['score1'], game_state['score2'])
						if (self.challengee != '' and self.challenger != ''):
							await sync_to_async(delete_challenge)(self.challenger, self.challengee)
						await self.send_game_state()
						winner = game_state['p1_name'] if game_state['score1'] == 4 else game_state['p2_name']
						game_state['winner'] = winner
						await self.channel_layer.group_send(
							self.room_group_name,
							{
								'type': 'game_end_message',
								'message': f'{winner} won the game.',
								'player1': game_state['p1_name'],
								'player2': game_state['p2_name'],
								'score1': game_state['score1'],
								'score2': game_state['score2'],
								'winner': winner
							}
						)
						game_state['end'] = True
						return
					ball_dir = generate_rand_dir()
					ball['velocityY'] = ball_dir[1]
					ball['velocityX'] = ball_dir[0]
					# ball['velocityY'] = 0
					# ball['velocityX'] = 4 if ball['x'] < 300 else -4
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
		winner = event['winner']
		await self.send(text_data=json.dumps({
			'type': 'gameEnd',
			'message': message,
			'player1': p1,
			'player2': p2,
			'score1': s1,
			'score2': s2,
			'winner': winner
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







def shuffle_array(array):
	"""
	Shuffles an array using the Fisher-Yates (Knuth) shuffle algorithm.

	This function modifies the original array by randomly swapping its elements.

	:param list array: The list to be shuffled.
	:return: The shuffled list.
	:rtype: list
	"""
	# Loop through the array backwards
	for i in range(len(array) - 1, 0, -1):
		j = random.randint(0, i)
		array[i], array[j] = array[j], array[i]
	return array

class TournamentConsumer(AsyncWebsocketConsumer):
	players_waiting = deque()
	players_waitingBig = deque()
	nextRound_players = {}
	allTournaments = {}
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
		self.t_id = None

		self.player_channels[self.username] = self.channel_name  # Store channel name


		await self.accept()
		await self.send(text_data=json.dumps({"type": "playerId", "playerId": self.player_id}))


	def get_user_id(self):
		return self.scope["session"]["_auth_user_id"]

	async def disconnect(self, close_code):
		# await self.channel_layer.group_discard(self.room_group_name,self.channel_name)
		if self in self.players_waiting:
			self.players_waiting.remove(self)
		if self.username in self.nextRound_players:
			self.nextRound_players.pop(self.username)
		tournaments_to_remove = []
	
		# Iterate through all tournament entries
		for tournament_id, players in self.allTournaments.items():
			# Filter out the current player from the players list
			self.allTournaments[tournament_id] = [player for player in players if player['p_instance'] != self]
			
			# Check if the players list is now empty
			if not self.allTournaments[tournament_id]:
				tournaments_to_remove.append(tournament_id)


		# Remove empty tournaments
		for tournament_id in tournaments_to_remove:
			del self.allTournaments[tournament_id]
		self.t_id = None
		logging.info(f"closing SocketConnection to Player {self.username}")
		await self.close()

	async def receive(self, text_data):
		data = json.loads(text_data)
		room_group_name = getattr(self, 'room_group_name', None)
		if data['type'] == 'join_tournament':
			await self.fetch_and_add_player_to_tournament(data)
		elif data['type'] == 'update_tournament':
			await self.update_tournament(data)
		elif data['type'] == 'match_result':
			await self.share_match_result(data)
		elif data['type'] == 'next_round_match':
			await self.handle_nextRound_match(data)
		elif data['type'] == 'waiting_next_match':
			await self.handle_waiting_next_match(data)
		elif data['type'] == 'leaving':
			await self.handle_leaving(data);
		elif data['type'] == 'save_game':
			await self.save_tour_game(data);
	  
		# await self.fetch_and_add_player_to_tournament()

	async def fetch_and_add_player_to_tournament(self, data):
		toursize = data['psize']
		if toursize == 4:
			if len(self.players_waiting) >= 3 and (self not in self.players_waiting):
				self.players_waiting.append(self)
				self.room_group_name = 'game_%s' % uuid.uuid4().hex
				# await self.channel_layer.group_add(self.room_group_name, self.channel_name)
				tournament = await sync_to_async(Tournament.objects.create)(creation_date=datetime.datetime.now())

				await self.send_join_message(f"The last player is joining {self.username}")

				tourn_players = []
				toberemoved = deque()
				for tuser in list(self.players_waiting)[:4]:
					toberemoved.append(tuser);
					tuser.room_group_name = self.room_group_name
					await self.channel_layer.group_add(self.room_group_name, tuser.channel_name)
					user = await sync_to_async(User.objects.get)(id=tuser.user_id)
					profile_img = await sync_to_async(lambda: user.profile.image.url)()
					tourn_players.append({
						'username': user.username,
						'profile_img': profile_img
					})
					tuser.t_id = tournament.pk
					if tournament.pk not in self.allTournaments:
						self.allTournaments[tournament.pk] = []
					self.allTournaments[tournament.pk].append({
						'username': user.username,
						'p_instance': tuser,  # Store the player instance if needed
						't_id': tournament.pk
					})

				
				tourn_players = shuffle_array(tourn_players)

				html_content = await sync_to_async(render_to_string)('pong/online_tour_bracket.html', {'players_list': tourn_players})
				await self.broadcast_html_content(html_content)
				# del self.players_waiting[:4]
				# del self.list_players[:4]
				for tuser in toberemoved:
					# self.players_waiting.pop(tuser)
					self.players_waiting.remove(tuser)
				toberemoved.clear()

				await asyncio.sleep(2)
				await self.create_match_rooms(tourn_players)

			elif self not in self.players_waiting:
				await self.send_join_message(f"Adding the player {self.username}")
				self.players_waiting.append(self)
		else:
			if len(self.players_waitingBig) >= 7 and (self not in self.players_waitingBig):
				self.players_waitingBig.append(self)
				self.room_group_name = 'game_%s' % uuid.uuid4().hex
				tournament = await sync_to_async(Tournament.objects.create)(creation_date=datetime.datetime.now())

				await self.send_join_message(f"The last player is joining {self.username}")

				tourn_players = []
				toberemoved = deque()
				for tuser in list(self.players_waitingBig)[:8]:
					toberemoved.append(tuser)
					tuser.room_group_name = self.room_group_name
					user = await sync_to_async(User.objects.get)(id=tuser.user_id)
					profile_img = await sync_to_async(lambda: user.profile.image.url)()
					tourn_players.append({
						'username': user.username,
						'profile_img': profile_img
					})
					tuser.t_id = tournament.pk

				tourn_players = shuffle_array(tourn_players)

				html_content = await sync_to_async(render_to_string)('pong/online_tour_bracket.html', {'players_list': tourn_players})
				await self.broadcast_html_content(html_content)

				for tuser in toberemoved:
					# self.players_waitingBig.pop(tuser)
					self.players_waitingBig.remove(tuser)
				toberemoved.clear()

				# await asyncio.sleep(5)
				await self.create_match_rooms(tourn_players)
			

			elif self not in self.players_waitingBig:
				await self.send_join_message(f"Adding the player {self.username}")
				self.players_waitingBig.append(self)


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
			if match_room_name not in self.confirmed_players:
				self.confirmed_players[match_room_name] = set()
			self.confirmed_players[match_room_name].add(player['username'])
			player_channel_name = self.player_channels.get(player['username'])
			if player_channel_name:
				logging.info(f"Adding player {player['username']} to match room {match_room_name}")
				await self.channel_layer.group_add(
					match_room_name,
					player_channel_name  # Use the correct channel name for each player
				)
		
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
		tour_id = self.t_id

		for player in players:
			if self.username == player:
				opponent = [p for p in players if p != self.username][0]
				await self.send(text_data=json.dumps({
					'type': 'match_invitation',
					'match_room': match_room,
					'player': self.username,
					'opponent': opponent,
					'players': players,
					'tour_id': tour_id
				}))


	async def share_match_result(self, data):
		await asyncio.sleep(1)
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
			try:
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
			except KeyError:
				await self.opponent_left({
					'message': f"{data['opponent']} has left the match.",
					'player': self.scope['user'].username,
					'opponent': data['opponent']
				})
		else:
			await self.send_join_message(f"Adding the player {self.username}")
			self.nextRound_players[data['player']] = self

	async def handle_waiting_next_match(self, data):
		opponent_username = data['opponent']
		player_username = data['player']

		try:
			# Check if the opponent is still in the tournament
			opponent_instance = None
			for player in self.allTournaments[self.t_id]:
				if player['username'] == opponent_username:
					opponent_instance = player
					break

			if opponent_instance:
				await self.send_text({
					'message': f"{opponent_username} is still in the match.",
					'player': player_username,
					'opponent': opponent_username
				})
			else:
				raise KeyError("Opponent not found in the tournament")
		except KeyError:
			await self.opponent_left({
				'message': f"{opponent_username} has left the match.",
				'player': player_username,
				'opponent': opponent_username
			})


	async def handle_leaving(self, data):
		match_room = data['match_name']
		player = data['player']

		logger.error(f"player to be removed : {player}")
		logger.error(f"Updated confirmed_players: {self.confirmed_players}")
		if match_room in self.confirmed_players:
			self.confirmed_players[match_room].discard(player)
		
		opponent = [p for p in self.confirmed_players[match_room] if p != player]
		
		if opponent:
			opponent_channel_name = self.player_channels.get(opponent[0])
			if opponent_channel_name:
				await self.channel_layer.send(
					opponent_channel_name,
					{
						'type': 'opponent_left',
						'message': f"{player} has left the match.",
						'opponent': player,
						'player': opponent[0]
					}
				)

	async def opponent_left(self, event):
		# await asyncio.sleep(10)
		message = event['message']
		player = event['player']
		opponent = event['opponent']
		await self.send(text_data=json.dumps({
			'type': 'opponent_left',
			'message': message,
			'opponent': player,
			'player': opponent
		}))

	async def save_tour_game(self, data):
		try:
			player1 = await sync_to_async(User.objects.get)(username=data['player1'])
			player2 = await sync_to_async(User.objects.get)(username=data['player2'])
			# tour = await sync_to_async(Tournament.objects.get)(pk=self.t_id)
			tour = None
			if data['t_id'] is not None:
				tour = await sync_to_async(Tournament.objects.get)(pk=data['t_id'])

			game = await sync_to_async(Game.objects.create)(
				player1=player1,
				player2=player2,
				player1_score=data['score1'],
				player2_score=data['score2'],
				is_tournament_game=bool(data['t_id']),
				tournament_id=tour if data['t_id'] else None,  # Assign the Tournament instance
				round=data['round'] if data['round'] in dict(Game.ROUND_CHOICES).keys() else None,
				game_number=data['g_num'] if data['g_num'] is not None else None,
				side=data['side'] if data['side'] in dict(Game.SIDE_CHOICES).keys() else None
			)
			return game
		
		except Exception as e:
			print(f"Error saving game: {e}")
			return None
