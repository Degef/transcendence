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
	// console.log(form)

	const imageInput = form.querySelector('input[type="file"]');
	const file = imageInput.files[0];
	const formData = new FormData(form);
	const newUsername = formData.get('username');
	
	// console.log(file)
	if (file && file.size > 1024 * 1024) { // 1 MB in bytes
		showAlert('The image file size must be less than 1 MB.', 'danger');
		return; // Prevent form submission
	}

	// console.log("after file check")

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'X-CSRFToken': csrfToken,
			},
			body: formData,
		});
		if (!response.ok && response.status === 403) {
			handleRoute('/limit/', false);
			return ;
		}
		if (response.headers.get('Content-Type')?.includes('application/json')) {
			const jsonResponse = await response.json();
			if (!jsonResponse.success) {
				const errors = JSON.parse(jsonResponse.errors);
				let firstError = Object.entries(errors)[0][1][0].message || 'An error occurred while processing your request. Please try again.';
				if (firstError === 'This field is required.') firstError = 'All fields are required.';
				showAlert(firstError, 'danger');
			} else {
				if (!(url.includes('/login/')))
					showAlert(jsonResponse.message, 'success');
				isLoggin = true;
				if (url === '/edit_profile/') {
					updateUserName(newUsername)
					isLoggin = false;
					handleRoute(successRoute + formData.get('username'), true);
				} else {
					if (successRoute === '/login/') {
						isLoggin = false;
					}
					handleRoute(successRoute, true); 
				}
			}
		} else {
			const htmlContent = await response.text();
			updateContent(htmlContent);
			if (back_or_forward !== 0) updateURL(url);
		}
	} catch (error) {
		showAlert('An error occurred while processing your request.', 'danger');
	}
}

async function register(back_or_forward = 1) {
	await handleFormSubmission('registration-form', '/register/', '/login/', back_or_forward);
}

async function login(nextUrl = '/', back_or_forward = 1) {
	await handleFormSubmission('login-form', '/login/', decodeURIComponent(nextUrl) || '/', back_or_forward);
	initializeChallengeSocket();
	initializeChatSocket();
}
