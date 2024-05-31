const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

const config = {
	ipaddress: '',
	client_id: '',
	redirectUri: '',
	secret: '',
};

if (!config.ipaddress) {
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
		console.error('Error fetching IP address:', error);
	}
}

function authorize42Intra() {
	const { client_id, redirectUri } = config;
	const state = Math.random().toString(36).substring(7);
	const authUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${client_id}&redirect_uri=${redirectUri}&state=${state}&response_type=code`;
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
	console.log(path);
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

async function handleLogout() {
	if (statusSocket) {
		statusSocket.send(JSON.stringify({ 'status': 'offline' }));
		statusSocket.close();
		statusSocket = null;
	}
}


const routeHandlers = {
	'/': () => handleRoute('/', true),
	'/about/': () => handleRoute('/about/', true),
	'/leaderboard/': () => handleRoute('/leaderboard/', true),
	'/chat/': () => { handleRoute('/chat/', true); setTimeout(initializeChat, 1000); },
	'/register/': () => register(),
	'/req_register/': () => handleRoute('/register/', true),
	'/login/': () => login(),
	'/logout/': () => { handleLogout(); handleRoute('/logout/', false); },
	'/req_login/': () => handleRoute('/login/', true),
	'/profile/': () => { handleRoute('/profile/', true); setTimeout(init_profile, 1000); },
	'/friends/': () => handleRoute('/friends/', true),
	'/edit_profile/': () => handleRoute('/edit_profile/', true),
	'/update': () => update(),
	'/play_online/': () => handleRoute('/play_online/', true),
	'/game_computer/': () => handleRoute('/game_computer/', true),
	'/local_game/': () => handleRoute('/local_game/', true),
	'/add_friend/:name': name => handleRoute(`/add_friend/${name}`, false),
	'/remove_friend/:name': name => handleRoute(`/remove_friend/${name}`, false),
	'/pre_tourn/': name => handleRoute('/pre_tourn/', false),
	'/offline_tourn/': name => handleRoute('/offline_tourn/', false),
	'/four_players/': () => setupTournament(4),
	'/eight_players/':  () => setupTournament(8),
};

function handleButtonClick(event) {
	const buttonFunctions = {
		home: routeHandlers['/'],
		about: routeHandlers['/about/'],
		leaderboard: routeHandlers['/leaderboard/'],
		req_register: routeHandlers['/req_register/'],
		register: routeHandlers['/register/'],
		req_login: routeHandlers['/req_login/'],
		login: routeHandlers['/login/'],
		profile: routeHandlers['/profile/'],
		edit_profile: routeHandlers['/edit_profile/'],
		update: routeHandlers['/update'],
		logout: routeHandlers['/logout/'],
		loginWith42: authorize42Intra,
		play_online: routeHandlers['/play_online/'],
		game_computer: routeHandlers['/game_computer/'],
		start_play_online: () => handleRoute('/play_online/', true),
		local_game: routeHandlers['/local_game/'],
		chatLink: routeHandlers['/chat/'],
		pre_tourn: routeHandlers['/pre_tourn/'],
		offline_tourn:routeHandlers['/offline_tourn/'],
		four_players:routeHandlers['/four_players/'],
		eight_players:routeHandlers['/eight_players/'],
	};

	event.preventDefault();
	const buttonId = event.target.id;
	const handler = buttonFunctions[buttonId];
	console.log(buttonId);
	console.log(handler);

	if (handler) {
		if (window.game_in_progress) {
			window.terminate_game = true;
		}
		handler();
	}
}

document.addEventListener('DOMContentLoaded', () => {
	document.body.addEventListener('click', handleButtonClick);
});

window.addEventListener('beforeunload', () => {
	navigator.sendBeacon('/unload/');
});

window.onpopstate = event => {
	const path = event.state ? event.state.path : '/';
	(routeHandlers[path] || routeHandlers['/'])(false);
};

function loginWith42() {
	handleRoute(`http://${config.ipaddress}:8000/exchange_code?code=${code}`);
}
