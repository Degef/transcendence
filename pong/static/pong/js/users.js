const buttonFunctions = {
    'about': aboutPage,
    'home': homePage,
    'req_register': req_registration_page,
    'register': register,
    'req_login': req_login_page,
    'login': login,
    'logout': logout,
    'profile': profile,
    'update': update,
    'pre_register': pre_register,
    'loginWith42': authorize42Intra
};

function aboutPage() {
    fetch('/about/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const newContent = doc.getElementById('content');
        document.getElementById('content').innerHTML = newContent.innerHTML;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function homePage() {
    fetch('/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const newBodyContent = doc.body.innerHTML;
        document.body.innerHTML = newBodyContent;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function req_registration_page() {
    fetch('/register/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const newContent = doc.getElementById('content');
        document.getElementById('content').innerHTML = newContent.innerHTML;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function register() {
    const form = document.getElementById('registration-form');
    const formData = new FormData(form);

    fetch('/register/', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.text())
    .then(htmlContent => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const newContent = doc.getElementById('content');
        document.getElementById('content').innerHTML = newContent.innerHTML;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function login() {
    const form = document.getElementById('login-form');
    const formData = new FormData(form);

    fetch('/login/', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.text())
    .then(htmlContent => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const newBodyContent = doc.body.innerHTML;
        document.body.innerHTML = newBodyContent;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function req_login_page() {
    fetch('/login/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const newContent = doc.getElementById('content');
        document.getElementById('content').innerHTML = newContent.innerHTML;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function logout() {
    fetch('/logout/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const newBodyContent = doc.body.innerHTML;
        document.body.innerHTML = newBodyContent;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function profile() {
    fetch('/profile/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const newContent = doc.getElementById('content');
        document.getElementById('content').innerHTML = newContent.innerHTML;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function update() {
    const form = document.getElementById('profile-form');
    const formData = new FormData(form);

    fetch('/profile/', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.text())
    .then(htmlContent => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const newContent = doc.getElementById('content');
        document.getElementById('content').innerHTML = newContent.innerHTML;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function pre_register() {
    fetch('/pre_register/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const newContent = doc.getElementById('content');
        document.getElementById('content').innerHTML = newContent.innerHTML;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function authorize42Intra() {
    const clientId = 'u-s4t2ud-3f913f901b795282d0320691ff15f78cc9e125e56f6d77a9c26fc17a15237ac1';
    const redirectUri = `http://10.13.7.13:8000`
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
    fetch(`http://10.13.7.13:8000/exchange_code?code=${code}`, 
        {
            method: 'GET',
            headers: {
                'Content-Type': 'text/html',
            },
        })
        .then(response => response.text())
        .then(htmlContent => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            const newBodyContent = doc.body.innerHTML;
            document.body.innerHTML = newBodyContent;
        })
        .catch(error => {
            console.error('Error exchanging code for access token:', error);
        });
}
