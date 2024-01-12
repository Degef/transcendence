ipAddress = '10.12.2.11';

function authorize42Intra() {
    const clientId = 'u-s4t2ud-3f913f901b795282d0320691ff15f78cc9e125e56f6d77a9c26fc17a15237ac1';
    const redirectUri = `http://${ipAddress}:8000`
    const authorizationEndpoint = 'https://api.intra.42.fr/oauth/authorize';

    // Generate a random state to include in the authorization request
    const state = Math.random().toString(36).substring(7);

    // Construct the authorization URL
    const authUrl = `${authorizationEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&response_type=code`;

    // Redirect the user to the 42 authorization page
    window.location.href = authUrl;
}

const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (code) {
    // Exchange code for access token using the Django backend
    fetch(`http://${ipAddress}:8000/exchange-code?code=${code}`)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            // Handle the response from your Django server
            if (data.success) {
                localStorage.setItem('authToken', data.token);
                // topAlert(data.message, 'success');
                loginPage();
                update_nav(1);
            }
        })
        .catch(error => {
            console.error('Error exchanging code for access token:', error);
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

home_page();