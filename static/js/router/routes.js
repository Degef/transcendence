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
	// console.log(path);
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
	'/leaderboard/': () => { handleRoute('/leaderboard/', true); setTimeout(init_leaderboard, 1000); },
	'/privacy/': () => handleRoute('/privacy/', true),
	'/chat/': () => { handleRoute('/chat/', true); setTimeout(initializeChat, 1000); },
	'/register/': () => register(),
	'/req_register/': () => handleRoute('/register/', true),
	'/login/': () => login(),
	'/logout/': () => { handleLogout(); handleRoute('/logout/', false); },
	'/req_login/': () => handleRoute('/login/', true),
	'/profile/': () => { handleRoute('/profile/', true); setTimeout(init_profile, 1000); },
	'/friends/': () => handleRoute('/friends/', true),
	'/edit_profile/': () => handleRoute('/edit_profile/', true),
	'/delete_profile/': () => initializeDeleteProfile('/delete_profile/', '/'),
	'/update': () => update(),
	'/play_online/': () => handleRoute('/play_online/', true),
	'/game_computer/': () => handleRoute('/game_computer/', true),
	'/local_game/': () => handleRoute('/local_game/', true),
	'/pre_tourn/': name => handleRoute('/pre_tourn/', true),
	'/offline_tourn/': name => handleRoute('/offline_tourn/', true),
	'/four_players/': () => setupTournament(4),
	'/eight_players/':  () => setupTournament(8),
	'/online_tourn/':  () => fourPlayers(),
};

function handleButtonClick(event) {
	console.log(event.target.id);
	const buttonFunctions = {
		home: routeHandlers['/'],
		about: routeHandlers['/about/'],
		leaderboard: routeHandlers['/leaderboard/'],
		privacy: routeHandlers['/privacy/'],
		req_register: routeHandlers['/req_register/'],
		register: routeHandlers['/register/'],
		req_login: routeHandlers['/req_login/'],
		login: routeHandlers['/login/'],
		profile: routeHandlers['/profile/'],
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
		pre_tourn: routeHandlers['/pre_tourn/'],
		offline_tourn:routeHandlers['/offline_tourn/'],
		four_players:routeHandlers['/four_players/'],
		eight_players:routeHandlers['/eight_players/'],
		online_tourn:routeHandlers['/online_tourn/'],
	};

	event.preventDefault();
	const buttonId = event.target.id;
	const handler = buttonFunctions[buttonId];
	// console.log(buttonId);
	// console.log(handler);

	if (handler) {
		if (window.game_in_progress) {
			window.terminate_game = true;
		}
		handler();
	}
}

// document.addEventListener('DOMContentLoaded', () => {
// 	document.body.addEventListener('click', handleButtonClick);
// });

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

function addEventListenersToElements(elements) {
	elements.forEach(element => {
	  if (!element.hasAttribute('data-listener-added')) {
		element.addEventListener('click', handleButtonClick);
		element.setAttribute('data-listener-added', 'true');
	  }
	});
}
  
  
  
// add eventListner to any link and any any button every time the page updated
document.addEventListener('DOMContentLoaded', () => {
	const initialElements = document.querySelectorAll('button, a');
	addEventListenersToElements(initialElements);
  /** Setup a MutationObserver to monitor the DOM for changes then Iterate over each mutation
   *  1. Check if new nodes were added, Iterate over the added nodes, Check if the node is a button or a link
   * Add event listener to the node, or 2. Check if the node is an element, Find nested buttons and links
   * Add event listeners to nested elements **/
	const observer = new MutationObserver(mutations => {
	  mutations.forEach(mutation => {
		if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
		  mutation.addedNodes.forEach(node => {
			if (node.nodeName === 'BUTTON' || node.nodeName === 'A') {
			  addEventListenersToElements([node]);
			} else if (node.nodeType === Node.ELEMENT_NODE) {
			  const nestedElements = node.querySelectorAll('button, a');
			  if (nestedElements.length > 0) {
				addEventListenersToElements(nestedElements);
			  }
			}
		  });
		}
	  });
	});
  
	observer.observe(document.body, { childList: true, subtree: true });
});
  
  
  