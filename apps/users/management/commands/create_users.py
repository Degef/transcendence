from faker import Faker
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
import random

class Command(BaseCommand):
	help = "Create random fake users for testing"

	def add_arguments(self, parser):
		parser.add_argument('total', type=int, help='Indicates the number of users to be created')
		parser.add_argument('--admin', action='store_true', help='Creates an admin account')

	def handle(self, *args, **kwargs):
		total = kwargs['total']
		is_admin = kwargs['admin']
		fake = Faker()

		for _ in range(total):
			if is_admin:
				User.objects.create_superuser(username=fake.user_name(), email=fake.email(), password="password")
			else:
				User.objects.create_user(username=fake.user_name(), email=fake.email(), password="password")

		self.stdout.write(self.style.SUCCESS(f'Successfully created {total} users'))
