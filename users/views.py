from django.shortcuts import render
from django.contrib import messages
from .forms import UserRegisterForm, UserUpdateForm, ProfileUpdateForm
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.core.files.storage import default_storage

def pre_register(request):
    return render(request, 'users/pre_register.html')

def register(request):
    if request.method == 'POST':
        form = UserRegisterForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, f'Your account has been created! You are now able to log in.')
            form = AuthenticationForm()
            context = {'messages': messages.get_messages(request), 'form': form}
            return render(request, 'users/login.html', context)
    else:
        form = UserRegisterForm()
    return render(request, 'users/register.html', {'form': form})

@login_required

def profile(request):
    if request.method == 'POST':
        u_form = UserUpdateForm(request.POST, instance=request.user)
        p_form = ProfileUpdateForm(request.POST, request.FILES, instance=request.user.profile)

        new_image = request.FILES.get('image')
        old_image_path = request.user.profile.image.path if request.user.profile.image else None

        if u_form.is_valid() and p_form.is_valid():
            u_form.save()
            p_form.save()

            if new_image and old_image_path:
                if 'default.png' not in old_image_path:
                    default_storage.delete(old_image_path)

            messages.success(request, f'Your account has been updated!')
            context = {
                'u_form': u_form,
                'p_form': p_form,
                'messages': messages.get_messages(request)
            }
            return render(request, 'users/profile.html', context)
    else:
        u_form = UserUpdateForm(instance=request.user)
        p_form = ProfileUpdateForm(instance=request.user.profile)  

    context = {
        'u_form': u_form,
        'p_form': p_form
    }
    return render(request, 'users/profile.html', context)