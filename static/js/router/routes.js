const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

const config = {
	ip: '',
	client_id: '',
	redirectUri: '',
	secret: '',
};

if (!config.ip) {
	getIPAddress();
}

async function getIPAddress() {
	try {
		const response = await fetch('/get_ipaddress/');
		const data = await response.json();
		Object.assign(config, data);
		if (code) {
			loginWith42();
		}
	} catch (error) {
		showAlert('Unknown error occurred', 'danger');
	}
}

function authorize42Intra() {
    const clientId = config.client_id;
    const redirectUri = config.redirectUri;
    const authorizationEndpoint = 'https://api.intra.42.fr/oauth/authorize';

    const state = Math.random().toString(36).substring(7);
    const authUrl = `${authorizationEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&response_type=code`;
    window.location.href = authUrl;
}

function updateURL(url) {
	const currentPath = window.location.pathname;
	if (currentPath !== url) {
		window.history.pushState({ path: url }, '', url);
	}
}

function updateBody(htmlContent) {
	const parser = new DOMParser();
	const doc = parser.parseFromString(htmlContent, 'text/html');
	document.body.innerHTML = doc.body.innerHTML;
}

async function handleRoute(path, pushState = true) {
	try {
		const response = await fetch(path, {
			method: 'GET',
			headers: { 'Content-Type': 'text/html' },
		});
		const htmlContent = await response.text();
		updateBody(htmlContent);
		if (pushState) {
			updateURL(path);
		}
	} catch (error) {
		console.error('Error handling route:', error);
	}
}


const routeHandlers = {
	'/': () => handleRoute('/', true),
	'/about/': () => handleRoute('/about/', true),
	'/leaderboard/': () => { handleRoute('/leaderboard/', true); setTimeout(init_leaderboard, 1000); },
	'/privacy/': () => handleRoute('/privacy/', true),
	'/chat/': () => { handleRoute('/chat/', true); setTimeout(initializeChat, 1000); },
	'/register/': () => register(),
	'/req_register/': () => handleRoute('/register/', true),
	'/login/': () => login(),
	'/logout/': () => { handleRoute('/logout/', false); },
	'/req_login/': () => handleRoute('/login/', true),
	'/friends/': () => handleRoute('/friends/', true),
	'/edit_profile/': () => handleRoute('/edit_profile/', true),
	'/delete_profile/': () => initializeDeleteProfile('/delete_profile/', '/'),
	'/update': () => update(),
	'/play_online/': () => handleRoute('/play_online/', true),
	'/game_computer/': () => handleRoute('/game_computer/', true),
	'/local_game/': () => handleRoute('/local_game/', true),
	'/offline_tourn/': name => handleRoute('/offline_tourn/', true),
	'/four_players/': () => setupTournament(4),
	'/eight_players/':  () => setupTournament(8),
};

function handleButtonClick(event) {
	const buttonFunctions = {
		home: routeHandlers['/'],
		about: routeHandlers['/about/'],
		leaderboard: routeHandlers['/leaderboard/'],
		privacy: routeHandlers['/privacy/'],
		req_register: routeHandlers['/req_register/'],
		register: routeHandlers['/register/'],
		req_login: routeHandlers['/req_login/'],
		login: routeHandlers['/login/'],
		edit_profile: routeHandlers['/edit_profile/'],
		delete_profile: routeHandlers['/delete_profile/'],
		update: routeHandlers['/update'],
		logout: routeHandlers['/logout/'],
		loginWith42: authorize42Intra,
		play_online: routeHandlers['/play_online/'],
		game_computer: routeHandlers['/game_computer/'],
		start_play_online: () => handleRoute('/play_online/', true),
		local_game: routeHandlers['/local_game/'],
		chatLink: routeHandlers['/chat/'],
		offline_tourn:routeHandlers['/offline_tourn/'],
		four_players:routeHandlers['/four_players/'],
		eight_players:routeHandlers['/eight_players/'],
	};

	const isFileInput = event.target.tagName === 'INPUT' && event.target.type === 'file';

	if (!isFileInput) {
		event.preventDefault();
	}
	const buttonId = event.target.id;
	const handler = buttonFunctions[buttonId];

	if (handler) {
		if (window.game_in_progress) {
			window.terminate_game = true;
			if (window.data.playerId != null && window.data.waiting_to_play == true) {
				// if this condition is true, it mean the player was waiting to play online game and clicked a button so this will make him leave the web socket
				window.data['socket'].close()
				terminate_game = false;
			}
		}
		handler();
	}
}

document.addEventListener('DOMContentLoaded', () => {
	document.body.addEventListener('click', handleButtonClick);
	const path = window.location.pathname;
    intializeJsOnPathChange(path);
});

function intializeJsOnPathChange(path) {
	if (path === '/chat/') {
		waitForElement('.chat__container', initializeChat);
	} else if (path === '/leaderboard/') {
		waitForElement('.leaderboard', init_leaderboard);
	} else if (path.includes('/profile/')) {
		waitForElement('.profile-container__', init_profile);
	}
}

window.onpopstate = event => {
	const path = event.state ? event.state.path : '/';
	handleRoute(path, true) || routeHandlers['/'](false);
	intializeJsOnPathChange(path);
};

function waitForElement(selector, callback) {
	requestAnimationFrame(() => {
		const element = document.querySelector(selector);
		if (element) {
			callback();
		} else {
			const observer = new MutationObserver((mutations, obs) => {
				if (document.querySelector(selector)) {
					callback();
					obs.disconnect();
				}
			});
			observer.observe(document.body, { childList: true, subtree: true });
		}
	});
}


function loginWith42() {
	handleRoute(`http://${config.ip}:8000/exchange_code?code=${code}`);
}
