from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
	help = "Delete all users from the database"

	def handle(self, *args, **kwargs):
		User.objects.all().delete()
		self.stdout.write(self.style.SUCCESS('All users deleted successfully'))