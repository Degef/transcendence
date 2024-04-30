from django.db import models
from django.contrib.auth.models import User

# Create your models here.


class Tournament(models.Model):
    id = models.AutoField(primary_key=True)
    start_date = models.DateField()
    end_date = models.DateField()
    players = models.ManyToManyField(User, through='TournamentPlayer')
    games = models.ManyToManyField('Game', related_name='tournament_games')

class TournamentPlayer(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'tournament')



class Game(models.Model):
    player1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='player1')
    player2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='player2')
    player1_score = models.IntegerField(default=0)
    player2_score = models.IntegerField(default=0)
    winner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='winner', null=True)
    date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f'{self.player1} vs {self.player2}'
    
    def determine_winner(self):
        if self.player1_score > self.player2_score:
            self.winner = self.player1
        elif self.player1_score < self.player2_score:
            self.winner = self.player2
        else:
            # Handle a tie or any other criteria for a draw
            self.winner = None

    def save(self, *args, **kwargs):
        self.determine_winner()
        super().save(*args, **kwargs)

