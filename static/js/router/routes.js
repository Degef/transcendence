const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
var isLoggin = false;
let controller = null;

const config = {
	ip: '',
	client_id: '',
	redirectUri: '',
	secret: '',
};

if (!config.ip) {
	getIPAddress();
}

function destroyOpenWebsocket() {
	window.terminate_game = true;
	if (window.data.playerId != null && window.data.waiting_to_play == true) {
		// if this condition is true, it mean the player was waiting to play online game and clicked a button so this will make him leave the web socket
		if (window.data['socket'] && window.data['socket'].readyState === WebSocket.OPEN) {
			window.data['socket'].close()
		}
		terminate_game = false;
	}
	return ;
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
	const newContent = tempDiv.innerHTML;
	// console.log(newContent);

	if (newContent) {
		const mainContainer = document.getElementById('main-container');
		// const range = document.createRange();
		// range.setStart(mainContainer.childNodes[1], 0);
		// range.setEnd(mainContainer.lastChild, 0);
		// range.deleteContents();
		// mainContainer.insertAdjacentHTML('beforeend', newContent);
		mainContainer.innerHTML = newContent;
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
		if (controller) {
			controller.abort();
		}
		controller = new AbortController();
		const { signal } = controller;
		htype = 'XMLHttpRequest';
		if ((isLoggin || path === '/logout/')) {
			htype = 'loggin'
		}
		const response = await fetch(path, {
			signal: signal,
			method: 'GET',
			headers: { 'Content-Type': 'text/html', 'X-Requested-With': htype },
		});
		const htmlContent = await response.text();
		if ((isLoggin && (path === '/' || path.includes('exchange_code'))) || path === '/logout/') {
			updateBody(htmlContent);
			isLoggin = false;
		} else {
			updateContent(htmlContent);
		}
		if (pushState) {
			updateURL(path);
		}
	} catch (error) {
		if (error.name === 'AbortError') {
			console.log('Request aborted');
			return;
		}
		console.error('Error handling route:', error);
	}
}


const routeHandlers = {
	'/': () => handleRoute('/', true),
	'/about/': () => handleRoute('/about/', true),
	'/leaderboard/': () => { handleRoute('/leaderboard/', true); setTimeout(init_leaderboard, 200); },
	'/privacy/': () => handleRoute('/privacy/', true),
	'/aboutus/': () => handleRoute('/aboutus/', true),
	'/chat/': () => { handleRoute('/chat/', true); setTimeout(initializeChat, 800); },
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
	'/online_tourn/': () => handleRoute('/online_tourn/', true),
	'/four_online_players/': () => onlineTournament(4),
	'/eight_online_players/':  () => onlineTournament(8),
};

function handleButtonClick(event) {
	const buttonFunctions = {
		home: routeHandlers['/'],
		about: routeHandlers['/about/'],
		leaderboard: routeHandlers['/leaderboard/'],
		privacy: routeHandlers['/privacy/'],
		aboutus: routeHandlers['/aboutus/'],
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
		online_tourn:routeHandlers['/online_tourn/'],
		four_online_players:routeHandlers['/four_online_players/'],
		eight_online_players:routeHandlers['/eight_online_players/'],
		mode_toggle: toggleTheme,
		yesButton: cutomizePlayerName,
		noButton: hidePnameForm,
		zoomin: zoomIn,
		zoomout: zoomOut,
	};

	const isFileInput = event.target.tagName === 'INPUT' && event.target.type === 'file';

	if (!isFileInput) {
		event.preventDefault();
	}
	const buttonId = event.target.id;
	const handler = buttonFunctions[buttonId];
	console.log("game_in_progress :", window.game_in_progress);

	if (handler) {
		if (window.game_in_progress) {
			if (buttonId === 'zoomin' || buttonId === 'zoomout' || buttonId === 'mode_toggle' || buttonId === 'yesButton') { handler(); return ; }
			destroyOpenWebsocket();
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
	let Page = document.documentElement;
	let savedZoom = localStorage.getItem('zoom') || '100%';
	let zoomText = document.getElementById('zoom-text');
	if (savedZoom) {
		Page.style.setProperty('--page-zoom', savedZoom);
		zoomText.innerHTML = savedZoom;
	}
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
		const timeoutPromise = new Promise((resolve) => {
			setTimeout(() => {
				init_profile();
				resolve();
			}, 1000);
		});

		const elementPromise = new Promise((resolve) => {
			waitForElement('.profile-container__', () => {
				init_profile();
				resolve();
			});
		});

		Promise.race([timeoutPromise, elementPromise])
		.then(() => {
			return ;
		})
		.catch((error) => {
			console.error("Profile initialization failed:", error);
		});
	}
	waitForElement('.theme-badge', initializeNotifications);
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
	isLoggin = true;
	handleRoute(`https://${config.ip}/exchange_code?code=${code}`);
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
	let themebutton = document.getElementById('mode_toggle');
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

function zoomIn() {
	let Page = document.documentElement;
	let zoomText = document.getElementById('zoom-text');
	let zoom = parseFloat(Page.style.getPropertyValue('--page-zoom')) || 100;
	zoom = zoom + 10;
	if (zoom > 160) {
		return;
	}
	Page.style.setProperty('--page-zoom', zoom + '%');
	localStorage.setItem('zoom', zoom + '%');
	zoomText.innerHTML = zoom + '%';
	return false;
}

function zoomOut() {
	let Page = document.documentElement;
	let zoomText = document.getElementById('zoom-text');
	let zoom = parseFloat(Page.style.getPropertyValue('--page-zoom')) || 100;
	zoom = zoom - 10;
	if (zoom < 70) {
		return;
	}
	Page.style.setProperty('--page-zoom', zoom + '%');
	localStorage.setItem('zoom', zoom + '%');
	zoomText.innerHTML = zoom + '%';
	return false;
}