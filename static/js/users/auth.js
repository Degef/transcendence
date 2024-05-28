async function register(back_or_forward = 1) {
	const form = document.getElementById('registration-form');
	const formData = new FormData(form);

	try {
		const response = await fetch('/register/', {
			method: 'POST',
			body: formData,
		});
		const htmlContent = await response.text();
		updateBody(htmlContent);
		if (back_or_forward !== 0) {
			updateURL('/register/');
		}
	} catch (error) {
		console.error('Error:', error);
	}
}

async function login(back_or_forward = 1) {
	const form = document.getElementById('login-form');
	const formData = new FormData(form);

	try {
		const response = await fetch('/login/', {
			method: 'POST',
			body: formData,
		});
		const htmlContent = await response.text();

		const parser = new DOMParser();
		const doc = parser.parseFromString(htmlContent, 'text/html');
		const newBodyContent = doc.body.innerHTML;
		document.body.innerHTML = newBodyContent;

		if (doc.body.innerHTML.includes("To keep connected with us")) {
			updateURL('/login/');
		} else {
			updateURL('/');
		}

		if (back_or_forward !== 0) {
			updateURL('/login/');
		}
	} catch (error) {
		console.error('Error:', error);
	}
}

async function logout(back_or_forward = 1) {
	try {
		const unloadResponse = await fetch('/unload/');
		if (!unloadResponse.ok) throw new Error('Response was not ok');

		const unloadData = await unloadResponse.json();
		console.log(unloadData);

		const response = await fetch('/logout/', {
			method: 'GET',
			headers: {
				'Content-Type': 'text/html',
			},
		});
		const htmlContent = await response.text();
		updateBody(htmlContent);
		if (back_or_forward !== 0) {
			updateURL('/logout/');
		}
	} catch (error) {
		console.error('Error:', error);
	}
}
