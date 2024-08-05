from django.contrib.auth.models import User
from django.db.models import (Model, TextField, DateTimeField, ForeignKey,
							CASCADE)

from asgiref.sync import async_to_sync

import logging

logger = logging.getLogger(__name__)

class BlockModel(Model):
	user_blocker = ForeignKey(User, on_delete=CASCADE, verbose_name='blocking user',
							related_name='blocker_user', db_index=True)

	user_blocked = ForeignKey(User, on_delete=CASCADE,
							db_index=True)

	timestamp = DateTimeField('timestamp', auto_now_add=True, editable=False,
							db_index=True)

	# Meta
	class Meta:
		app_label = 'chat'
		verbose_name = 'block'
		verbose_name_plural = 'blocks'
		unique_together = ('user_blocker', 'user_blocked')


def is_blocked(user, recipient):
	return BlockModel.objects.filter(user_blocker=user, user_blocked=recipient).exists()\
		or BlockModel.objects.filter(user_blocked=user, user_blocker=recipient).exists()

class MessageModel(Model):
	user = ForeignKey(User, on_delete=CASCADE, verbose_name='user',
					related_name='from_user', db_index=True)
	recipient = ForeignKey(User, on_delete=CASCADE, verbose_name='recipient',
						related_name='to_user', db_index=True)
	timestamp = DateTimeField('timestamp', auto_now_add=True, editable=False, db_index=True)
	body = TextField('body')

	def __str__(self):
		return str(self.id)

	def characters(self):
		return len(self.body)

	def save(self, *args, **kwargs):
		self.body = self.body.strip()
		if is_blocked(self.user, self.recipient):
			return
		super().save(*args, **kwargs)

	class Meta:
		app_label = 'chat'
		verbose_name = 'message'
		verbose_name_plural = 'messages'
		ordering = ('-timestamp',)
