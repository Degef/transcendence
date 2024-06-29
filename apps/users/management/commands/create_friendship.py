from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.users.models import Friendship


class Command(BaseCommand):
	help = "Create random friendships between users for testing"

	def add_arguments(self, parser):
		parser.add_argument('user', type=str, help='Indicates the user to create friendships for')
		parser.add_argument('total', type=int, help='Indicates the number of friendships to be created')
	
	def handle(self, *args, **kwargs):
		user = kwargs['user']
		user = User.objects.get(username=user)
		total = kwargs['total']
		friendships = []
		for _ in range(total):
			friend = User.objects.order_by('?').first()
			Friendship.objects.create(from_user=user, to_user=friend, status=Friendship.ACCEPTED)
		
		self.stdout.write(self.style.SUCCESS(f'Successfully created {total} friendships for {user}'))