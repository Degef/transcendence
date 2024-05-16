from django.contrib import admin
from .models import Game
from .models import TournamentPlayer
from .models import Tournament
# Register your models here.
admin.site.register(Game)
admin.site.register(Tournament)
admin.site.register(TournamentPlayer)