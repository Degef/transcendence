from django.contrib import admin
from .models import Game, Challenge, Leaderboard
# Register your models here.
admin.site.register(Game)
admin.site.register(Challenge)
admin.site.register(Leaderboard)