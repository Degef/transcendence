from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import Profile, user_things

class UserUpdateForm(forms.ModelForm):
	username = forms.CharField(
		max_length=14,
		label="Username",
		widget=forms.TextInput(
			attrs={
				"class": "input-field",
				"size": "40",
				"placeholder": "New Username...",
			}
		),
	)
	email = forms.EmailField(
		max_length=254,
		label="Email",
		widget=forms.TextInput(
			attrs={
				"class": "input-field",
				"size": "40",
				"placeholder": "New Email...",
			}
		),
	)
	password = forms.CharField(
		max_length=24,
		label="Password",
		widget=forms.PasswordInput(
			attrs={
				"class": "input-field password",
				"size": "40",
				"placeholder": "New Password...",
			}
		),
	)
	class Meta:
		model = User
		fields = ['username', 'email', 'password']


class CustomAuthenticationForm(AuthenticationForm):
	username = forms.CharField(widget=forms.TextInput(attrs={'class': 'form-group__input', 'placeholder': 'User name', 'aria-label': 'User name'}))
	password = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'form-group__input', 'placeholder': 'Password', 'aria-label': 'Password'}))

	class Meta:
		model = User
		fields = ['username', 'password']

class UserRegisterForm(UserCreationForm):
	email = forms.EmailField()

	class Meta:
		model = User
		fields = ['username', 'email', 'password1', 'password2']

class ProfileUpdateForm(forms.ModelForm):
	class Meta:
		model = Profile
		fields = ['image']