from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import Profile, user_things
from django.core.exceptions import ObjectDoesNotExist

class UserUpdateForm(forms.ModelForm):
	username = forms.CharField(
		max_length=14,
		label="Username",
		widget=forms.TextInput(
			attrs={
				"class": "input-field",
				"size": "40",
				"placeholder": "New Username...",
				"autocomplete": "on",
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
				"autocomplete": "on",
			}
		),
	)

	class Meta:
		model = User
		fields = ['username', 'email']

	def __init__(self, user, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self.user = user
		try:
			user_profile = user_things.objects.filter(user=user).first()
			if user_profile.logged_in_with_42:
				self.fields['username'].widget.attrs['disabled'] = 'disabled'
		except ObjectDoesNotExist:
			pass

	def clean_username(self):
		try:
			user_profile = user_things.objects.filter(user=self.user).first()
			if user_profile and user_profile.logged_in_with_42:
				return self.user.username
		except ObjectDoesNotExist:
			pass
		return self.cleaned_data.get('username', self.user.username)


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
	image = forms.ImageField(
		label="",
		widget=forms.FileInput(
			attrs={
				"class": "current-profile-picture",
				"placeholder": "Upload Profile Picture...",
			}
		),
	)
	class Meta:
		model = Profile
		fields = ['image']