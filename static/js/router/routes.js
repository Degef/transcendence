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

async function updateContent(htmlContent) {

	const tempDiv = document.createElement('div');
	tempDiv.innerHTML = htmlContent;
	const newContent = tempDiv.querySelector('main').innerHTML;

	if (newContent) {
		const mainContainer = document.getElementById('main-container');
		const range = document.createRange();
		range.setStart(mainContainer, 1); 
		range.setEnd(mainContainer, mainContainer.childNodes.length);
		range.deleteContents();
		mainContainer.insertAdjacentHTML('beforeend', newContent);
	}
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
		// updateContent(htmlContent);
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
	'/online_tourn/': () => fourPlayers(),
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
		online_tourn:routeHandlers['/online_tourn/'],
		four_players:routeHandlers['/four_players/'],
		eight_players:routeHandlers['/eight_players/'],
		mode_toggle: toggleTheme,
	};

	const isFileInput = event.target.tagName === 'INPUT' && event.target.type === 'file';

	if (!isFileInput) {
		event.preventDefault();
	}
	const buttonId = event.target.id;
	const handler = buttonFunctions[buttonId];
	// console.log(buttonId);

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

// document.addEventListener('DOMContentLoaded', () => {
// 	document.body.addEventListener('click', handleButtonClick);
// 	const path = window.location.pathname;
//     intializeJsOnPathChange(path);
// 	setuptheme();
// });


function setuptheme() {
	console.log(localStorage.getItem('theme'));
	if (localStorage.getItem('theme') === '' || localStorage.getItem('theme') === null || localStorage.getItem('theme') === 'dark') {
		localStorage.setItem('theme', 'dark');
	}
	else if (localStorage.getItem('theme') === 'light') {
		document.body.classList.add('light-mode');
		document.getElementById('mode_toggle').innerHTML = '<i class="fa-solid fa-moon nav-link mt-1" id="mode_toggle" style="color:black;"></i>';
	}
}

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

function toggleTheme() {
	const toggleButton = document.querySelector('#mode_toggle');
	const isLightMode = document.body.classList.toggle('light-mode');

	if (isLightMode) {
		toggleButton.innerHTML = '<i class="fa-solid fa-moon nav-link mt-1" id="mode_toggle" style="color:black;"></i>';
		localStorage.setItem('theme', 'light');
	} else {
		toggleButton.innerHTML = '<i class="fa-solid fa-lightbulb nav-link mt-1" id="mode_toggle"></i>';
		localStorage.setItem('theme', 'dark');
	}
}


function loginWith42() {
	handleRoute(`http://${config.ip}:8000/exchange_code?code=${code}`);
}


// document.addEventListener('DOMContentLoaded', () => {
// 	const path = window.location.pathname;
//     intializeJsOnPathChange(path);
// 	setuptheme();
// });


function addEventListenersToElements(elements) {
	elements.forEach(element => {
	  if (!element.hasAttribute('data-listener-added')) {
		element.addEventListener('click', handleButtonClick);
		element.setAttribute('data-listener-added', 'true');
	  }
	});
	themebutton = document.getElementById('mode_toggle');
	themebutton.addEventListener('click', handleButtonClick);
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
	const path = window.location.pathname;
    intializeJsOnPathChange(path);
	setuptheme();
});
  