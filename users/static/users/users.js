
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

config = {
    'ipaddress': '',
    'client_id': '',
    'redirectUri': '',
    'secret': '',
};

if (config.ipaddress == '') {
    get_ipaddress();
}

function get_ipaddress() {
    fetch('/get_ipaddress/')
        .then(response => response.json())
        .then(data => {
            config.ipaddress = data.ip;
            config.client_id = data.client_id;
            config.secret = data.secret;
            config.redirect_uri = data.redirect_uri;
            if (code != null) {
                loginWith42();
            }
        });
}

function loginWith42() {
    fetch(`http://${config.ipaddress}:8000/exchange_code?code=${code}`, 
        {
            method: 'GET',
            headers: {
                'Content-Type': 'text/html',
            },
        })
        .then(response => response.text())
        .then(htmlContent => {
            updateBody(htmlContent);
            if (back_or_forward == 0)
                return  
            updateURL(`http://${config.ipaddress}:8000/exchange_code?code=${code}`);
        })
        .catch(error => {
            console.error('Error exchanging code for access token:', error);
        });
}

function authorize42Intra() {
    const clientId = config.client_id;
    const redirectUri = config.redirect_uri;
    const authorizationEndpoint = 'https://api.intra.42.fr/oauth/authorize';

    const state = Math.random().toString(36).substring(7); // Generate a random state to include in the authorization request
    const authUrl = `${authorizationEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&response_type=code`; // Construct the authorization URL
    window.location.href = authUrl;// Redirect the user to the 42 authorization page
}

function updateURL(url) {
    window.history.pushState({ path: url }, '', url);
}

function updateContent(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const newContent = doc.getElementById('content');
    document.getElementById('content').innerHTML = newContent.innerHTML;
}

function updateBody(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const newBodyContent = doc.body.innerHTML;
    document.body.innerHTML = newBodyContent;
}

function getUsers(back_or_forward = 1) {
    fetch('/get_users/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        updateURL('/get_users/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function aboutPage(back_or_forward = 1) {
    fetch('/about/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        updateURL('/about/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function homePage(back_or_forward = 1) {
    console.log('homePage');
    fetch('/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        updateURL('/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function req_registration_page(back_or_forward = 1) {
    fetch('/register/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        updateURL('/register/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function register(back_or_forward = 1) {
    const form = document.getElementById('registration-form');
    const formData = new FormData(form);

    fetch('/register/', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        // updateURL('/register/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function login(back_or_forward = 1) {
    const form = document.getElementById('login-form');
    const formData = new FormData(form);

    fetch('/login/', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        // updateURL('/login/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function req_login_page(back_or_forward = 1) {
    fetch('/login/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        updateURL('/login/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function logout(back_or_forward = 1) {
    fetch('/logout/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        updateURL('/logout/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function profile(back_or_forward = 1) {
    fetch('/profile/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        updateURL('/profile/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function update(back_or_forward = 1) {
    const form = document.getElementById('profile-form');
    const formData = new FormData(form);

    fetch('/profile/', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        // updateURL('/profile/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function pre_register(back_or_forward = 1) {
    fetch('/pre_register/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        updateURL('/pre_register/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function addFriend(name, back_or_forward) {
    fetch(`/add_friend/${name}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return  
        // updateURL(`/add_friend/${name}`);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function removeFriend(name, back_or_forward) {
    fetch(`/remove_friend/${name}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return
        // updateURL(`/remove_friend/${name}`);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}