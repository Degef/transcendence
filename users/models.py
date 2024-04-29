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

class user_things(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, default='offline')
    friends = models.ManyToManyField(User, blank=True, default=None, related_name='friends')
    nick = models.CharField(max_length=100, null=True)
    last_activity = models.DateTimeField(null=True, blank=True)
    is_challenged = models.BooleanField(null=True, default=False)
    challenge_response = models.CharField(max_length=20, null=True)
    challenger = models.CharField(max_length=20, null=True)
    challenged_user = models.CharField(max_length=20, null=True)

    def add_friend(self, friend):
        self.friends.add(friend)
    
    def remove_friend(self, friend):
        self.friends.remove(friend)
        
    def __str__(self):
        return f'{self.user.username} things'