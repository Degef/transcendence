from django.db.models import (Model, TextField, DateTimeField, ForeignKey,
							CASCADE, IntegerField, CharField, Q, AutoField,
							DateField, ManyToManyField, BooleanField)
from django.contrib.auth.models import User

from asgiref.sync import sync_to_async, async_to_sync
from django.core.exceptions import ObjectDoesNotExist
import json
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)


#tournament Model
class Tournament(Model):
	creation_date = DateTimeField(default=timezone.now, blank=True)

	class Meta:
		app_label = 'pong'
		verbose_name = 'Tournament'
		verbose_name_plural = 'Tournaments'

# Leaderboard Model
class Leaderboard(Model):
	user = ForeignKey(User, on_delete=CASCADE, related_name='leaderboard_user', db_index=True)
	wins = IntegerField(default=0)
	losses = IntegerField(default=0)
	win_rate = IntegerField(default=0)
	last_updated = DateTimeField(auto_now=True)

	def __str__(self):
		return f'{self.user}'


	def save(self, *args, **kwargs):
		self.win_rate = get_win_rates(self.wins, self.losses)
		super().save(*args, **kwargs)

	class Meta:
		app_label = 'pong'
		verbose_name = 'Leaderboard'
		verbose_name_plural = 'Leaderboards'

# Create your models here.
class Game(Model):
	ROUND_CHOICES = [
		('one', 'Round One'),
		('two', 'Round Two'),
		('final', 'Final'),
	]

	SIDE_CHOICES = [
		('1', 'Split One'),
		('2', 'Split Two'),
		('champion', 'Champion'),
	]
	player1 = ForeignKey(User, on_delete=CASCADE, related_name='player1')
	player2 = ForeignKey(User, on_delete=CASCADE, related_name='player2')
	player1_score = IntegerField(default=0)
	player2_score = IntegerField(default=0)
	winner = ForeignKey(User, on_delete=CASCADE, related_name='winner', null=True)
	date = DateTimeField(auto_now_add=True)

	is_tournament_game = BooleanField(default=False)
	tournament_id = ForeignKey(Tournament, on_delete=CASCADE, null=True, blank=True)
	round = CharField(max_length=10, choices=ROUND_CHOICES, null=True, blank=True)
	game_number = IntegerField(null=True, blank=True)
	side = CharField(max_length=10, choices=SIDE_CHOICES, null=True, blank=True)



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

	def update_leaderboard(self):
		leaderboard_player1, created = Leaderboard.objects.get_or_create(user=self.player1)
		leaderboard_player2, created = Leaderboard.objects.get_or_create(user=self.player2)

		if self.winner == self.player1:
			leaderboard_player1.wins += 1
			leaderboard_player2.losses += 1
		elif self.winner == self.player2:
			leaderboard_player1.losses += 1
			leaderboard_player2.wins += 1

		leaderboard_player1.save()
		leaderboard_player2.save()

	def save(self, *args, **kwargs):
		self.determine_winner()
		super().save(*args, **kwargs)
		self.update_leaderboard()

	class Meta:
		app_label = 'pong'
		verbose_name = 'Game'
		verbose_name_plural = 'Games'

def get_win_rates(total_wins, total_losses):
	total_games = total_wins + total_losses
	if total_games == 0:
		return 0
	win_rate = (total_wins / total_games) * 100
	return win_rate


# Challenge Model
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
	return Challenge.objects.create(challenger=challenger, challengee=challengee)

def delete_challenge(challengerUsername, challengeeUsername):

	challengee = User.objects.get(username=challengeeUsername)
	challenger = User.objects.get(username=challengerUsername)

	challenge = Challenge.objects.filter(challenger=challenger, challengee=challengee).first()
	if challenge:
		challenge.delete()
		return challenge
	return None

def accept_challenge(challengee, challenger):
	challenge = Challenge.objects.filter(challenger=challenger, challengee=challengee).first()
	if challenge:
		challenge.status = Challenge.ACCEPTED
		challenge.save()
		return challenge
	return None

def decline_challenge(challengee, challenger):
	challenge = Challenge.objects.filter(challenger=challenger, challengee=challengee).first()
	if challenge:
		challenge.delete()
		return challenge
	return None



