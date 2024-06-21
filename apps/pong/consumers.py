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
		await self.send_game_state()

	async def handleChallenge(self, data):
		challengee = data['challengee']
		challenger = data['challenger']
		self.challengee = challengee
		self.challenger = challenger
		if (self.username == challengee and challenger in self.challenge_queue):
			other_user = self.challenge_queue.pop(challenger)
			await self.startGameNow(other_user)
		elif (self.username == challenger and challengee in self.challenge_queue):
			other_user = self.challenge_queue.pop(challengee)
			await self.startGameNow(other_user)
		elif (self.username == challenger):
			self.challenge_queue[challenger] = self
		else:
			self.challenge_queue[challengee] = self

	async def handleDefaultGame(self, data):
		if len(self.waiting_queue) > 0:
			# Match the user with the first user in the queue
			other_user = self.waiting_queue.pop(0)
			await self.startGameNow(other_user)
		else:
			self.waiting_queue.append(self)

	async def receive(self, text_data):
		data = json.loads(text_data)
		gametype = data['type']
		logger.debug(f"\n\nReceived data: {data}")
		if (gametype == 'challenge'):
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
							'message': f'{winner} won the game.'
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


class ChallengeConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		logger.debug(" \n\n WebSocket connection established to challenge consumer \n\n")
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
