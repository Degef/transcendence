async function handleFormSubmission(formId, url, successRoute, back_or_forward = 1) {
	const form = document.getElementById(formId);
	const formData = new FormData(form);
	const responseMessageDiv = document.querySelector('.response__message');
	const responseAlert = document.getElementById('responseAlert');

	try {
		const response = await fetch(url, {
			method: 'POST',
			body: formData,
		});

		const contentType = response.headers.get('Content-Type');
		
		if (contentType && contentType.indexOf('application/json') !== -1) {
			const jsonResponse = await response.json();
			if (jsonResponse.success === false) {
				let jsonErrors = JSON.parse(jsonResponse.errors);
				let firstError = Object.entries(jsonErrors)[0][1][0].message;
				if (firstError === 'This field is required.') firstError = 'All fields are required.';
				responseMessageDiv.innerHTML = `${firstError}`;
				responseAlert.classList.remove('d-none', 'alert-success');
				responseAlert.classList.add('alert-danger', 'show');
				form.reset();
			} else {
				responseMessageDiv.innerHTML = `${formId.split('-')[0]} successful!`;
				responseAlert.classList.remove('d-none', 'alert-danger');
				responseAlert.classList.add('alert-success', 'show');
				form.reset();
				handleRoute(successRoute, true);
			}
		} else {
			const htmlContent = await response.text();
			updateBody(htmlContent);
			if (back_or_forward !== 0) updateURL(url);
		}
	} catch (error) {
		console.error('Error:', error);
		responseMessageDiv.innerHTML = 'An error occurred while processing your request.';
		responseAlert.classList.remove('d-none', 'alert-success');
		responseAlert.classList.add('alert-danger', 'show');
		form.reset();
	}
}

async function register(back_or_forward = 1) {
	await handleFormSubmission('registration-form', '/register/', '/login/', back_or_forward);
}

async function login(back_or_forward = 1) {
	await handleFormSubmission('login-form', '/login/', '/', back_or_forward);
}
