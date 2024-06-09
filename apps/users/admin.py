from django.contrib import admin
from .models import Profile, user_things, Friendship

# Register your models here.
admin.site.register(Profile)
admin.site.register(user_things)
admin.site.register(Friendship)