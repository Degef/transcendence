let statusSocket = null;

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
		console.log(response.status);		
		if (response.headers.get('Content-Type')?.includes('application/json')) {
			const jsonResponse = await response.json();
			console.log(jsonResponse);
			if (!jsonResponse.success) {
				const errors = JSON.parse(jsonResponse.errors);
				let firstError = Object.entries(errors)[0][1][0].message;
				if (firstError === 'This field is required.') firstError = 'All fields are required.';
				showAlert(firstError, 'danger');
				form.reset();
			} else {
				form.reset();
				showAlert(jsonResponse.message, 'success');
				setTimeout(() => { handleRoute(successRoute, true); }, 2000);
			}
		} else {
			const htmlContent = await response.text();
			console.log(htmlContent);
			updateBody(htmlContent);
			if (back_or_forward !== 0) updateURL(url);
		}
	} catch (error) {
		console.error('Error:', error);
		showAlert('An error occurred while processing your request.', 'danger');
		form.reset();
	}
}

async function register(back_or_forward = 1) {
	await handleFormSubmission('registration-form', '/register/', '/login/', back_or_forward);
}

async function login(back_or_forward = 1) {
	await handleFormSubmission('login-form', '/login/', '/', back_or_forward);
	initializeChallengeSocket();
}

function setUpStatusWebSocket() {
	statusSocket = new WebSocket('wss://' + window.location.host + '/ws/status/');

	statusSocket.onopen = function(e) {
		console.log('WebSocket connection established');
		statusSocket.send(JSON.stringify({ 'status': 'online' }));
	};

	statusSocket.onclose = function(e) {
		console.log('WebSocket connection closed');
	};

	statusSocket.onmessage = function(e) {
		const data = JSON.parse(e.data);
		console.log(data.message);
	};
}
