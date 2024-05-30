async function register(back_or_forward = 1) {
    const form = document.getElementById('registration-form');
    const formData = new FormData(form);
    const responseMessageDiv = document.querySelector('.response__message');
    const responseAlert = document.getElementById('responseAlert');

    try {
        const response = await fetch('/register/', {
            method: 'POST',
            body: formData,
        });

        const contentType = response.headers.get('Content-Type');
        
        if (contentType && contentType.indexOf('application/json') !== -1) {
            const jsonResponse = await response.json();
            if (jsonResponse.success === false) {
                let jsonErrors = JSON.parse(jsonResponse.errors);
                let firstError = Object.entries(jsonErrors)[0][1][0].message;
                responseMessageDiv.innerHTML = `${firstError}`;
                responseAlert.classList.remove('d-none', 'alert-success');
                responseAlert.classList.add('alert-danger', 'show');
                form.reset();
            } else {
                responseMessageDiv.innerHTML = 'Registration successful!';
                responseAlert.classList.remove('d-none', 'alert-danger');
                responseAlert.classList.add('alert-success', 'show');
                form.reset();
            }
        } else {
            const htmlContent = await response.text();
            updateBody(htmlContent);
            if (back_or_forward !== 0) {
                updateURL('/register/');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        responseMessageDiv.innerHTML = 'An error occurred while processing your request.';
        responseAlert.classList.remove('d-none', 'alert-success');
        responseAlert.classList.add('alert-danger', 'show');
        form.reset();
    }
}


async function login(back_or_forward = 1) {
	const form = document.getElementById('login-form');
	const formData = new FormData(form);
	const responseMessageDiv = document.querySelector('.response__message');
    const responseAlert = document.getElementById('responseAlert');

	try {
		const response = await fetch('/login/', {
			method: 'POST',
			body: formData,
		});

		const contentType = response.headers.get('Content-Type');
		if (contentType && contentType.indexOf('application/json') !== -1) {
			const jsonResponse = await response.json();
			if (jsonResponse.success === false) {
				let jsonErrors = JSON.parse(jsonResponse.errors);
				let firstError = Object.entries(jsonErrors)[0][1][0].message;
				responseMessageDiv.innerHTML = `${firstError}`;
				responseAlert.classList.remove('d-none', 'alert-success');
				responseAlert.classList.add('alert-danger', 'show');
				form.reset();
			} else {
				responseMessageDiv.innerHTML = 'Login successful!';
				responseAlert.classList.remove('d-none', 'alert-danger');
				responseAlert.classList.add('alert-success', 'show');
				form.reset();
			}
		} else {
			const htmlContent = await response.text();
			updateBody(htmlContent);
			if (back_or_forward !== 0) {
				updateURL('/login/');
			}
		}
	} catch (error) {
		console.error('Error:', error);
	}
}
