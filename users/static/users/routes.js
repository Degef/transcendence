
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

function loginWith42(back_or_forward = 1) {
    handleRoute(`http://${config.ipaddress}:8000/exchange_code?code=${code}`);
}

function authorize42Intra() {
    const clientId = config.client_id;
    const redirectUri = config.redirect_uri;
    const authorizationEndpoint = 'https://api.intra.42.fr/oauth/authorize';

    const state = Math.random().toString(36).substring(7); // Generate a random state to include in the authorization request
    const authUrl = `${authorizationEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&response_type=code`;
    window.location.href = authUrl;// Redirect the user to the 42 authorization page
}

function updateURL(url) {
    // Extract the path from the current URL
    const currentPath = window.location.pathname;
    // Check if the current path ends with the path to be pushed
    if (!currentPath.endsWith(url)) {
        window.history.pushState({ path: url }, '', url);
    } else if (url === '/') {
        window.history.pushState({ path: url }, '', url);
    }
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



function aboutPage(back_or_forward = 1) {
    handleRoute('/about/');
}

function chatPage(back_or_forward = 1) {
    handleRoute('/chat/');
}

function homePage(back_or_forward = 1) {
    handleRoute('/');
}

function req_registration_page(back_or_forward = 1) {
    handleRoute('/register/');
}

function profile(back_or_forward = 1) {
    handleRoute('/profile/');
}

function req_login_page(back_or_forward = 1) {
    handleRoute('/login/');
}

function addFriend(name, back_or_forward) {
    handleRoute(`/add_friend/${name}`, 0);
}

function removeFriend(name, back_or_forward) {
    handleRoute(`/remove_friend/${name}`, 0);
}

function play_online() {
    handleRoute('/play_online/');
}

function game_computer() {
    handleRoute('/game_computer/');
}

function local_game() {
    handleRoute('/local_game/');
}



function handleRoute(path, back_or_forward = 1) {
    fetch(path, {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward === 0)
            return;
        updateURL(path);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

window.addEventListener('unload', function() {
    navigator.sendBeacon('/unload/');
});

function handleButtonClick(event) {
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
        'loginWith42': authorize42Intra,
        'play_online': play_online,
        'game_computer': game_computer,
        'start_play_online': start_play_online,
        'local_game': local_game,
        'chatLink' : chatPage,
    };
    
    event.preventDefault();
    const buttonId = event.target.id;
    if (buttonFunctions.hasOwnProperty(buttonId)) {
        if (game_in_progress) {
            terminate_game = true;
            buttonFunctions[buttonId](event);
            return;
        }
        buttonFunctions[buttonId](event);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    document.body.addEventListener('click', handleButtonClick);
}
);

window.onpopstate = function(event) {

    const routeFunctions = {
        '/about/': aboutPage,
        '/chat/': chatPage,
        '/home/': homePage,
        '/register/': req_registration_page,
        '/login/': req_login_page,
        '/logout/': logout,
        '/profile/':  profile,
        'loginWith42': authorize42Intra,
        '/play_online/': play_online,
        '/game_computer/': game_computer,
        '/local_game/': local_game,
        '/chatLink/' : chatPage,
    };
    
    const path = event.state ? event.state.path : '/';
    console.log(path)
    const handler = routeFunctions[path] || homePage;
    handler(0);
};