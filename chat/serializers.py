from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from .models import MessageModel
from rest_framework.serializers import ModelSerializer, CharField

from users.models import Profile


class MessageModelSerializer(ModelSerializer):
    user = CharField(source='user.username', read_only=True)
    recipient = CharField(source='recipient.username')

    def create(self, validated_data):
        user = self.context['request'].user
        recipient = get_object_or_404(
            User, username=validated_data['recipient']['username'])
        msg = MessageModel(recipient=recipient,
                           body=validated_data['body'],
                           user=user)
        msg.save()
        return msg

    class Meta:
        model = MessageModel
        fields = ('id', 'user', 'recipient', 'timestamp', 'body')


class ProfileSerializer(ModelSerializer):
    class Meta:
        model = Profile
        fields = ('image',)


class UserModelSerializer(ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('username', 'profile')
