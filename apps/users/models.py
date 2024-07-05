from django.db import models
from django.contrib.auth.models import User
from PIL import Image

# Create your models here.
class Profile(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE)
	image = models.ImageField(default='default.png', upload_to='profile_pics')

	def __str__(self):
		return f'{self.user.username} Profile'

	def save(self, *args, **kwargs):
		super().save(*args, **kwargs)
		img = Image.open(self.image.path)

		img = Image.open(self.image.path)
		if (img.height > 300 or img.width > 300):
			output_size = (300, 300)
			img.thumbnail(output_size)
			img.save(self.image.path)

class Friendship(models.Model):
	REQUESTED = 'requested'
	ACCEPTED = 'accepted'

	STATUS_CHOICES = [
		(REQUESTED, 'Requested'),
		(ACCEPTED, 'Accepted'),
	]

	from_user = models.ForeignKey(User, related_name='friendship_requests_sent', on_delete=models.CASCADE)
	to_user = models.ForeignKey(User, related_name='friendship_requests_received', on_delete=models.CASCADE)
	status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=REQUESTED)
	created = models.DateTimeField(auto_now_add=True)
	updated = models.DateTimeField(auto_now=True)

	class Meta:
		unique_together = ('from_user', 'to_user')

	def __str__(self):
		return f'{self.from_user.username} -> {self.to_user.username} ({self.status})'


class user_things(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE)
	status = models.CharField(max_length=10, default='offline')
	nick = models.CharField(max_length=100, null=True)
	logged_in_with_42 = models.BooleanField(default=False)
	last_activity = models.DateTimeField(null=True, blank=True)

	def __str__(self):
		return f'{self.user.username} things'
