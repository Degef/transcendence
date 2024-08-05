from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.pong.models import Game
import random

class Command(BaseCommand):
	help = "Create random games between users for testing"

	def add_arguments(self, parser):
		parser.add_argument('user', type=str, help='Indicates the user to create games for')
		parser.add_argument('total', type=int, help='Indicates the number of games to be created')

	def handle(self, *args, **kwargs):
		total = kwargs['total']
		user = kwargs['user']
		user = User.objects.get(username=user)

		for _ in range(total):
			player1 = user
			player2 = User.objects.order_by('?').first()
			Game.objects.create(player1=player1, player2=player2, player1_score=random.randint(0, 10), player2_score=random.randint(0, 10), winner=[player1, player2][random.randint(0, 1)])