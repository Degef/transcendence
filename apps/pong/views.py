from django.shortcuts import render, redirect
from .models import Game, Challenge, Leaderboard
from django.contrib.auth.models import User
from apps.users.models import user_things
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.db import transaction
from django.views.generic import View
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from datetime import timedelta
from django.template.loader import render_to_string
from django.http import HttpResponse
import json, re, logging


from apps.users.views import get_total_wins, get_total_losses, get_win_rate


logger = logging.getLogger(__name__)


def home(request):
	if request.user.is_authenticated:
		return render(request, 'pong/home.html')
	else:
		return render(request, 'pong/landing.html')

class FaviconView(View):
	def get(self, request, *args, **kwargs):
		return redirect('media/favicon.ico')

@login_required
def play_online(request):
	if_mobile = request.device['is_mobile'] or request.device['is_tablet']
	context = {"if_mobile": "true" if if_mobile else "false"}
	if (if_mobile):
		return render(request, 'pong/mobile.html', context)
	return render(request, 'pong/play_online.html')

def game_computer(request):
	if_mobile = request.device['is_mobile'] or request.device['is_tablet']
	context = {"if_mobile": "true" if if_mobile else "false"}
	if (if_mobile):
		return render(request, 'pong/mobile.html', context)
	return render(request, 'pong/game_computer.html')

def local_game(request):
	if_mobile = request.device['is_mobile'] or request.device['is_tablet']
	context = {"if_mobile": "true" if if_mobile else "false"}
	if (if_mobile):
		return render(request, 'pong/mobile.html', context)
	player1 = 'Player1'
	player2 = 'Player2'
	if request.method == 'POST':
		data = json.loads(request.body)
		player1 = data.get('player1')
		player2 = data.get('player2')
	print(player1)
	print(player2)
	context = {
		'player1': player1,
		'player2': player2,
	}
	return render(request, 'pong/local_game.html', context)

def about(request):
	return render(request, 'pong/about.html')

def privacy(request):
	return render(request, 'pong/privacy.html')

@login_required
def leaderboard(request):
	one_week_ago = timezone.now() - timedelta(days=7)
	one_month_ago = timezone.now() - timedelta(days=30)

	leaderboard_data = (Leaderboard.objects.all().order_by('-wins'))[:10]
	leaderboard_weekly = (Leaderboard.objects.filter(last_updated__gte=one_week_ago).order_by('-wins'))[:10]
	leaderboard_monthly = (Leaderboard.objects.filter(last_updated__gte=one_month_ago).order_by('-wins'))[:10]

	context = {
		'leaderboard_weekly': leaderboard_weekly,
		'leaderboard_monthly': leaderboard_monthly,
		'leaderboard_data': leaderboard_data
	}
	return render(request, 'pong/leaderboard.html', context)

def offline_tourn(request):
	return render(request, 'pong/offline_tourn.html')

@login_required
def off_tour_bracket(request):
	if request.method == 'POST':
		data = json.loads(request.body)
		player_names = data.get('players', [])
		print(player_names)

		# Here you can process the player names and generate the tournament bracket
		tournament_bracket = generate_tournament_bracket(player_names)
		
		# Return the tournament bracket as JSON response
		return JsonResponse({'tournament_bracket': tournament_bracket})
	else:
		pass
		# Return an error response if the request method is not POST
	return JsonResponse({'error': 'Method not allowed'}, status=405)

# Example function to generate tournament bracket
def generate_tournament_bracket(player_names):
	# Implement your logic here to generate the tournament bracket
	# This is just a placeholder function
	print(player_names)
	html_content = render_to_string('pong/off_tour_bracket.html', {'player_names': player_names})
	return html_content
