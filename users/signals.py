from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver
from .models import Profile
from .models import user_things
from django.contrib.auth.signals import user_logged_in, user_logged_out

@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
        temp  = user_things.objects.create(user=instance)
        temp.nick = instance.username

@receiver(post_save, sender=User)
def save_profile(sender, instance, **kwargs):
    instance.profile.save()
    instance.user_things.save()

@receiver(user_logged_in)
def user_logged_in_handler(sender, request, user, **kwargs):
    user.user_things.status = 'online'
    user.save()

@receiver(user_logged_out)
def user_logged_out_handler(sender, request, user, **kwargs):
    user.user_things.status = 'offline'
    user.save()