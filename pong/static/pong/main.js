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

function handleButtonClick(event) {
	if (event.target.id === 'about')
		aboutPage();
    else if (event.target.id === 'home')
        homePage();
    else if (event.target.id === 'req_register')
        req_registration_page();
    else if (event.target.id === 'register') {
        event.preventDefault();
        register();
    }
    else if (event.target.id === 'req_login')
        req_login_page();
    else if (event.target.id === 'login') {
        event.preventDefault();
        login();
    }
    else if (event.target.id === 'logout') {
        logout();
    }
    else if (event.target.id === 'profile') {
        profile();
    }
    else if (event.target.id === 'update') {
        event.preventDefault();
        update();
    }
}
 
document.addEventListener('DOMContentLoaded', function () {
    document.body.addEventListener('click', handleButtonClick);
}
);