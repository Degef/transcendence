# Generated by Django 4.2.8 on 2024-02-19 10:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0008_user_things_friends'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user_things',
            name='friends',
            field=models.ManyToManyField(blank=True, default=None, to='users.user_things'),
        ),
    ]