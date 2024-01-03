function showAlert(msg, className, target1, target2) { 
	const targetInput = document.querySelector(target1);
	targetInput.className = `form-control is-${className}`;
	const targetFeedback = document.querySelector(target2);
	targetFeedback.innerText = msg;
	targetFeedback.className = `${className}-feedback`;
}

function clearFields() {
	document.querySelector('#inputUsername').value = '';
	document.querySelector('#inputEmail').value = '';
	document.querySelector('#inputPassword1').value = '';
	document.querySelector('#inputPassword2').value = '';
}

function topAlert(msg, className) {
	const topAlert = document.querySelector('#topAlert');
	topAlert.className = `alert alert-${className}`;
	topAlert.innerText = msg;
}

function registerUser() {
		const formData = new FormData();
		formData.append('username', document.querySelector('#inputUsername').value);
		formData.append('email', document.querySelector('#inputEmail').value);
		formData.append('password1', document.querySelector('#inputPassword1').value);
		formData.append('password2', document.querySelector('#inputPassword2').value);
	
		// Fetch to register_user endpoint
		fetch('/register_user/', {
			method: 'POST',
			body: formData,
		})
		.then(response => response.json())
		.then(data => {
			console.log(data);
			// Handle the response accordingly in your single-page app
			if (data.success) {
                // showAlert(data.message, 'valid', '#inputUsername', '#usernameFeedback');
				topAlert(data.message, 'success');
				clearFields();
				login_Form();
            } else {
				if (data.errors.username)
					showAlert(data.errors.username, 'invalid', '#inputUsername', '#usernameFeedback');
				else
					showAlert("looks good", 'valid', '#inputUsername', '#usernameFeedback');
				if (data.errors.email)
					showAlert(data.errors.email, 'invalid', '#inputEmail', '#emailFeedback');
				else
					showAlert("looks good", 'valid', '#inputEmail', '#emailFeedback');
				if (data.errors.password1)
					showAlert(data.errors.password1, 'invalid', '#inputPassword1', '#password1Feedback');
				else
					showAlert("looks good", 'valid', '#inputPassword1', '#password1Feedback');
				if (data.errors.password2)
					showAlert(data.errors.password2, 'invalid', '#inputPassword2', '#password2Feedback');
				else
					showAlert("looks good", 'valid', '#inputPassword2', '#password2Feedback');
            }
		})
		.catch(error => {
			console.error('Error:', error);
		});
}

function checkEmptyForm() {
	if (document.querySelector('#inputUsername').value === '') {
		showAlert('Please enter your username', 'invalid', '#inputUsername', '#usernameFeedback');
		return 1;
	} else {
		document.querySelector('#inputUsername').className = 'form-control'
		document.querySelector('#usernameFeedback').innerText = '';
	}
	if (document.querySelector('#inputPassword').value === '') {
		showAlert('Please enter your password', 'invalid', '#inputPassword', '#passwordFeedback');
		return 1;
	} else {
		document.querySelector('#passwordFeedback').className = '';
		document.querySelector('#passwordFeedback').innerText = '';
	}
}

function loginUser() {
	if (checkEmptyForm() === 1)
		return;
	const formData = new FormData();
	formData.append('username', document.querySelector('#inputUsername').value);
	formData.append('password', document.querySelector('#inputPassword').value);

	fetch('/login_user/', {
		method: 'POST',
		body: formData,
	})
	.then(response => response.json())
	.then(data => {
		console.log(data);
		if (data.success) {
			localStorage.setItem('authToken', data.token);
			topAlert(data.message, 'success');
			loginPage();
			update_nav(1);
		} else {
			topAlert(data.message, 'danger');
		}
	})
	.catch(error => {
		console.error('Error:', error);
	});
}

// Silent login function
function silentLogin(token) {
    // Make a request to a protected endpoint on your server using the stored token
    fetch('/check_auth/', {
        headers: {
            'Authorization': `Token ${token}`,
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            update_nav(1);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function logoutUser() {
	fetch('/logout/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
	})
	.then(response => {
		if (response.ok) {
			console.log('Logout successful');
			localStorage.removeItem('authToken');
			update_nav(0);
            home_page();
		} else {
			console.error('Logout failed');
		}
	})
	.catch(error => {
		console.error('Error:', error);
	});
}