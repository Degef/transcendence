
//  This function communicates with django (backend)
function showProfile() {
	fetch('/profile')
		.then(response => response.json())  // Assuming the response is JSON
		.then(data => {
			console.log(data);
			// console.log(data.users[0].fields);
			var display = '';
			for (var i = 0; i < data.users.length; i++) {
				display += `
                <div class="card mb-3 mt-3">
                    <div class="card-body">
                        <h5 class="card-title"> ${data.users[i].fields.username}, ${data.users[i].fields.first_name} ${data.users[i].fields.last_name}</h5>
                        <p class="card-text">Email: ${data.users[i].fields.email}</p>
                        <!-- Add more user information as needed -->
                    </div>
                </div>
            `;
			}
			document.querySelector('#content').innerHTML =  display;
		})
		.catch(error => console.error('Error fetching profile data:', error));
}

function create_registration_Form() {
	document.querySelector('#content').innerHTML = `
	<form class="form-signin">
    <h1 class="h3 mb-3 pb-2 font-weight-normal border-bottom">Join Today</h1>

	<!-- top alert -->
	<div class="alert " role="alert" id="topAlert"> </div>

    <!-- Username input -->
    <label for="inputUsername" class="">Username*</label>
    <input type="text" id="inputUsername" name="username" class="form-control" required autofocus>
    <div id="usernameFeedback" class="myAlert"></div>

    <!-- Email input -->
    <label for="inputEmail" class="">Email*</label>
    <input type="email" id="inputEmail" name="email" class="form-control" required>
    <div id="emailFeedback" class="myAlert"></div>

    <!-- Password1 input -->
    <label for="inputPassword1" class="">Password*</label>
    <input type="password" id="inputPassword1" name="password1" class="form-control" required>
    <div id="password1Feedback" class="myAlert"></div>

    <!-- Password2 input -->
    <label for="inputPassword2" class="">Confirm Password*</label>
    <input type="password" id="inputPassword2" name="password2" class="form-control" required>
    <div id="password2Feedback" class="myAlert"></div>

    <button id="register" class="btn btn-outline-info mt-3" type="button">Sign Up</button>
	</form>

	<!-- Login link -->
	<div class="border-top pt-3">
		<small class="text-muted">
			Already have an account? <a id="login_request" href="#">Login</a>
		</small>
	</div>

	`;
}

function about_page() {
	document.querySelector('#content').innerHTML = `
	<div class="jumbotron">
	<p> <strong> Welcome to the Ping Pong Tournament App!</strong> This app is crafted for Ping Pong enthusiasts to experience the excitement of tournaments online.</p>
		<h2>Features:</h2>
		<ul class="list-container">
			<li>Participate in online multiplayer Ping Pong tournaments</li>
			<li>Intuitive and user-friendly interface</li>
			<li>Real-time scoring and detailed game statistics</li>
		</ul>
		
		<p>Our mission is to create a vibrant and competitive platform for Ping Pong enthusiasts worldwide. Dive into the app, compete in tournaments, and enjoy the thrill of the game!</p>
	</div>
	`;
}

function home_page() {
	document.querySelector('#content').innerHTML = `
	<div class="jumbotron">
		<h1 class="display-4">Welcome to Ping Pong Tournament App!</h1>
		<p class="lead">This is a simple web application that allows you to create and participate in Ping Pong tournaments online.</p>
		<hr class="my-4">
		<p>You need to <a href="#" id = "login_request"> login </a> to get started!</p>
		
		<!-- Registration link -->
		<div class="border-top pt-3">
			<small class="text-muted">
				Don't have an account? <a id="request_registration" href="#">Sign Up</a>
			</small>
		</div>
	</div>
	`;
}

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

function loginPage() {
	//page after loging in
	document.querySelector('#content').innerHTML = `
	<div class="jumbotron">
		<h1 class="display-4">Welcome to Ping Pong Tournament App!</h1>
		<p class="lead">This is a simple web application that allows you to create and participate in Ping Pong tournaments online.</p>
		<hr class="my-4">
		<p>You are logged in!</p>
	</div>
	`;
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

function create_login_Form() {
	document.querySelector('#content').innerHTML = `
	<form class="form-signin">
		<h1 class="h3 mb-3 pb-2 font-weight-normal border-bottom">Login</h1>

		<!-- top alert -->
		<div class="alert " role="alert" id="topAlert"> </div>
		<!-- Username input -->
		<label for="inputUsername" class="">Username*</label>
		<input type="text" id="inputUsername" name="username" class="form-control"  required autofocus>
		<div id="usernameFeedback" class=""></div>
		
		<!-- Password input -->
		<label for="inputPassword" class="">Password*</label>
		<input type="password" id="inputPassword" name="password" class="form-control"  required>
		<div id="passwordFeedback" class=""></div>

		<button id="login" class="btn btn-outline-info mt-3" type="button">Login</button>
	</form>
	<!-- Registration link -->
	<div class="border-top pt-3">
		<small class="text-muted">
			Don't have an account? <a id="request_registration" href="#">Register</a>
		</small>
	</div>

	`;
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

	// Fetch to login_user endpoint
	fetch('/login_user/', {
		method: 'POST',
		body: formData,
	})
	.then(response => response.json())
	.then(data => {
		console.log(data);
		// Handle the response accordingly in your single-page app
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
            // User is authenticated
            // Update UI accordingly
            update_nav(1);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function update_nav(i) {
	if (i === 1) {
		document.querySelector('#logout').innerText = 'Logout';
		document.querySelector('#profile').innerText = 'Profile';
		document.querySelector('#login_request').innerText = '';
		document.querySelector('#request_registration').innerText = '';
	} else {
		document.querySelector('#logout').innerText = '';
		document.querySelector('#profile').innerText = '';
		document.querySelector('#login_request').innerText = 'Login';
		document.querySelector('#request_registration').innerText = 'Register';
	}
}

function logoutUser() {
// Example using fetch API
	fetch('/logout/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			// Include other headers if needed
		},
	})
	.then(response => {
		if (response.ok) {
			// Logout successful
			console.log('Logout successful');
			// Remove the token from localStorage
			localStorage.removeItem('authToken');
			// Update UI accordingly
			update_nav(0);
		} else {
			// Handle error
			console.error('Logout failed');
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
		create_login_Form();
	else if (event.target.id === 'login')
		loginUser();
	else if (event.target.id === 'about')
		about_page();
	else if (event.target.id === 'home')
		home_page();
	else if (event.target.id === 'logout')
		logoutUser();
}

document.addEventListener("DOMContentLoaded", function() {
	const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
        // Perform a silent login using the stored token
        silentLogin(storedToken);
    }
    document.body.addEventListener('click', handleButtonClick);
});
