

function showProfile(i) {
	fetch('/profile')
		.then(response => response.json())
		.then(data => {
			console.log(data);
			profilePage(data);
			if (i === 1) {
				topAlert("update successful!", 'success');
			}

		})
		.catch(error => console.error('Error fetching profile data:', error));
}

function updateProfile() {
	const formData = new FormData();
	formData.append('username', document.querySelector('#updateUsername').value);
	formData.append('email', document.querySelector('#updateEmail').value);
	formData.append('image', document.querySelector('#updateImage').files[0]);

	fetch('/update_profile/', {
		method: 'POST',
		body: formData,
	})
	.then(response => response.json())
	.then(data => {
		console.log(data);
		if (data.success) {
			showProfile(1);
		} else if (data.message == 'No changes detected'){
			topAlert(data.message, 'info');
		} 
		else {
			if (data.errors.username)
				showAlert(data.errors.username, 'invalid', '#updateUsername', '#updateFeedback1');
			else
				showAlert("looks good", 'valid', '#updateUsername', '#updateFeedback1');
			if (data.errors.email)
				showAlert(data.errors.email, 'invalid', '#updateEmail', '#updateFeedback2');
			else
				showAlert("looks good", 'valid', '#updateEmail', '#updateFeedback2');
			if (data.errors.image)
				showAlert(data.errors.image, 'invalid', '#updateImage', '#updateFeedback3');
			else
				showAlert("looks good", 'valid', '#updateImage', '#updateFeedback3');
		}
	})
	.catch(error => {
		console.error('Error:', error);
	});
}

function handleButtonClick(event) {
	if (event.target.id === 'profile')
		showProfile();
	else if (event.target.id === 'request_registration')
		create_registration_Form();
	else if (event.target.id === 'register')
		registerUser();
	else if (event.target.id === 'login_request')
		login_Form();
	else if (event.target.id === 'login')
		loginUser();
	else if (event.target.id === 'about')
		about_page();
	else if (event.target.id === 'home')
		home_page();
	else if (event.target.id === 'logout')
		logoutUser();
	else if (event.target.id === 'update')
		updateProfile();
}

document.addEventListener("DOMContentLoaded", function() {
	const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
        // Perform a silent login using the stored token
        silentLogin(storedToken);
    }
    document.body.addEventListener('click', handleButtonClick);
});
