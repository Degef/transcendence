from django.db.models import (Model, TextField, DateTimeField, ForeignKey,
							CASCADE, IntegerField, CharField, Q)
from django.contrib.auth.models import User

from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async, async_to_sync
from django.core.exceptions import ObjectDoesNotExist
import json

# Create your models here.
class Game(Model):
	player1 = ForeignKey(User, on_delete=CASCADE, related_name='player1')
	player2 = ForeignKey(User, on_delete=CASCADE, related_name='player2')
	player1_score = IntegerField(default=0)
	player2_score = IntegerField(default=0)
	winner = ForeignKey(User, on_delete=CASCADE, related_name='winner', null=True)
	date = DateTimeField(auto_now_add=True)

	def __str__(self):
		return f'{self.player1} vs {self.player2}'
	
	def determine_winner(self):
		if self.player1_score > self.player2_score:
			self.winner = self.player1
		elif self.player1_score < self.player2_score:
			self.winner = self.player2
		else:
			# Handle a tie or any other criteria for a draw
			self.winner = None

	def save(self, *args, **kwargs):
		self.determine_winner()
		super().save(*args, **kwargs)

	class Meta:
		app_label = 'pong'
		verbose_name = 'Game'
		verbose_name_plural = 'Games'

class Challenge(Model):
	PENDING = 'pending'
	ACCEPTED = 'accepted'

	STATUS = (
		(PENDING, 'Pending'),
		(ACCEPTED, 'Accepted'),
	)
	challenger = ForeignKey(User, on_delete=CASCADE, related_name='challenger', db_index=True)
	challengee = ForeignKey(User, on_delete=CASCADE, related_name='challengee', db_index=True)
	status = CharField(max_length=10, choices=STATUS, default=PENDING)
	timestamp = DateTimeField(auto_now_add=True, editable=False, db_index=True)

	def __str__(self):
		return f'{self.challenger} challenged {self.challengee}'

	def notify_clients(self, message):
		notification = {
			'type': 'receive_group_message',
			'message': message,
		}

		channel_layer = get_channel_layer()
		async_to_sync(channel_layer.group_send)("{}".format(self.challenger.id), notification)
		async_to_sync(channel_layer.group_send)("{}".format(self.challengee.id), notification)

	class Meta:
		unique_together = ('challenger', 'challengee')
		app_label = 'pong'
		verbose_name = 'Challenge'
		verbose_name_plural = 'Challenges'


def user_has_pending_challenge(username):
	try:
		user = User.objects.get(username=username)
	except ObjectDoesNotExist:
		return False

	return Challenge.objects.filter(
		(Q(challengee=user) | Q(challenger=user)) & 
		(Q(status=Challenge.PENDING) | Q(status=Challenge.ACCEPTED))
	).exists()


def create_challenge(challenger, challengee):
	challenge = Challenge.objects.create(challenger=challenger, challengee=challengee)
	message = {
		'type': 'challenge_created',
		'challenger': challenger.username,
		'challengee': challengee.username,
	}
	challenge.notify_clients(json.dumps(message))
	return challenge

def accept_challenge(challengee, challenger):
	challenge = Challenge.objects.filter(challenger=challenger, challengee=challengee).first()
	if challenge:
		challenge.status = Challenge.ACCEPTED
		message = {
			'type': 'challenge_accepted',
			'challenger': challenger.username,
			'challengee': challengee.username,
		}
		challenge.notify_clients(json.dumps(message))
		challenge.save()
		return challenge
	return None

def decline_challenge(challengee, challenger):
	challenge = Challenge.objects.filter(challenger=challenger, challengee=challengee).first()
	if challenge:
		message = {
			'type': 'challenge_declined',
			'challenger': challenger.username,
			'challengee': challengee.username,
		}
		challenge.notify_clients(json.dumps(message))
		challenge.delete()
		return challenge
	return None