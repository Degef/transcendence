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

function createForm() {
	document.querySelector('#content').innerHTML = `
	<form class="form-signin">
		<h1 class="h3 mb-3 font-weight-normal">Register</h1>
		
		<!-- Username input -->
		<label for="inputUsername" class="sr-only">Username</label>
		<input type="text" id="inputUsername" name="username" class="form-control" placeholder="Username" required autofocus>
		<!-- Email input -->
		<label for="inputEmail" class="sr-only">Email</label>
		<input type="email" id="inputEmail" name="email" class="form-control" placeholder="Email" required>
		<!-- Password1 input -->
		<label for="inputPassword1" class="sr-only">Password</label>
		<input type="password" id="inputPassword1" name="password1" class="form-control" placeholder="Password" required>
		<!-- Password2 input -->
		<label for="inputPassword2" class="sr-only"> Password</label>
		<input type="password" id="inputPassword2" name="password2" class="form-control" placeholder="Confirm Password" required>

		<button id="register1" class="btn btn-outline-info mt-3" type="button">Sign Up</button>
	</form>
	<!-- Login link -->
	<div class="border-top pt-3">
		<small class="text-muted">
			Already have an account? <a id="Login" href="#">Login</a>
		</small>
	</div>

	`;
}

function showAlert(msg, className, target) {
	const div = document.createElement('div');
	div.className = `alert alert-${className}`;
	div.appendChild(document.createTextNode(msg));

	// Get the parent node of the target element
	const parent = document.querySelector(target).parentNode;

	// Insert the new div before the target element
	parent.insertBefore(div, document.querySelector(target));

	// Vanish in 3 seconds
	setTimeout(() => div.remove(), 3000);
}

function clearFields() {
	document.querySelector('#inputUsername').value = '';
	document.querySelector('#inputEmail').value = '';
	document.querySelector('#inputPassword1').value = '';
	document.querySelector('#inputPassword2').value = '';
}

function registerUser(event) {
	if (event.target.id === 'register1') {
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
                showAlert(data.message, 'success', '#inputUsername');
				clearFields();
            } else {
				if (data.errors.username)
					showAlert(data.errors.username, 'danger', '#inputUsername');
				if (data.errors.email)
					showAlert(data.errors.email, 'danger', '#inputEmail');
				if (data.errors.password1)
					showAlert(data.errors.password1, 'danger', '#inputPassword1');
				if (data.errors.password2)
					showAlert(data.errors.password2, 'danger', '#inputPassword2');
            }
		})
		.catch(error => {
			console.error('Error:', error);
		});
	}
}

document.addEventListener("DOMContentLoaded", function() {
    function handleButtonClick(event) {
        if (event.target.id === 'profile') {
            showProfile();
        } else if (event.target.id === 'register') {
            createForm();
        } else if (event.target.id === 'register1') {
			registerUser(event);
		}
    }
    document.body.addEventListener('click', handleButtonClick);
});
