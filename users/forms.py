from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from .models import Profile, user_things

class UserUpdateForm(forms.ModelForm):
    nick = forms.CharField(max_length=100)
    class Meta:
        model = user_things
        fields = ['nick']

class UserRegisterForm(UserCreationForm):
    email = forms.EmailField()

    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']

# class UserUpdateForm(forms.ModelForm):
#     email = forms.EmailField()

#     class Meta:
#         model = User
#         fields = ['username', 'email']

class UserUpdateForm2(forms.ModelForm):
    email = forms.EmailField()

    class Meta:
        model = User
        fields = ['username', 'email']

    def __init__(self, *args, **kwargs):
        super(UserUpdateForm2, self).__init__(*args, **kwargs)
        # Set the 'disabled' attribute for the form fields
        for field_name, field in self.fields.items():
            field.widget.attrs['disabled'] = True
            field.widget.attrs['class'] = 'disabled-field'

class ProfileUpdateForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = ['image']