let statusSocket = null;


function updateUserName(newUserName) {
	const profileLink = document.querySelector('#profile');
	profileLink.setAttribute('onclick', `loadProfile('${newUserName}'); return false;`);
}


async function handleFormSubmission(formId, url, successRoute, back_or_forward = 1) {
	const csrfToken = getCookie('csrftoken');
	const form = document.getElementById(formId);
	if (!form) {
		handleRoute(url, true);
		return ;
	}
	const formData = new FormData(form);
	const responseMessageDiv = document.querySelector('.response__message');
	const responseAlert = document.getElementById('responseAlert');
	const newUsername = formData.get('username');

	const showAlert = (message, type) => {
		responseMessageDiv.innerHTML = message;
		responseAlert.classList.remove('d-none', 'alert-success', 'alert-danger', 'show');
		responseAlert.classList.add(`alert-${type}`, 'show');
		setTimeout(() => {
			responseAlert.classList.remove('show');
			setTimeout(() => responseAlert.classList.add('d-none'), 500);
		}, 5000);
	};

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'X-CSRFToken': csrfToken,
			},
			body: formData,
		});
			if (response.status === 403) {
				handleRoute('/limit/', false);
			return ;
		}
		if (response.headers.get('Content-Type')?.includes('application/json')) {
			const jsonResponse = await response.json();
			if (!jsonResponse.success) {
				const errors = JSON.parse(jsonResponse.errors);
				let firstError = Object.entries(errors)[0][1][0].message;
				if (firstError === 'This field is required.') firstError = 'All fields are required.';
				showAlert(firstError, 'danger');
			} else {
				showAlert(jsonResponse.message, 'success');
				isLoggin = true;
				if (url === '/edit_profile/') {
					updateUserName(newUsername)
					isLoggin = false;
					handleRoute(successRoute + formData.get('username'), true);
				} else {
					handleRoute(successRoute, true); 
				}
			}
		} else {
			const htmlContent = await response.text();
			updateContent(htmlContent);
			if (back_or_forward !== 0) updateURL(url);
		}
	} catch (error) {
		console.error('Error:', error);
		showAlert('An error occurred while processing your request.', 'danger');
	}
}

async function register(back_or_forward = 1) {
	await handleFormSubmission('registration-form', '/register/', '/', back_or_forward);
	initializeChallengeSocket();
}

async function login(back_or_forward = 1) {
	await handleFormSubmission('login-form', '/login/', '/', back_or_forward);
	initializeChallengeSocket();
}
