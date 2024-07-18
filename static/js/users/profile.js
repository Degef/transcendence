let chartInstance = null;
let all_user_list = [];

function init_profile() {
	const user_getting_viewed = document.getElementById('profile_name');
	if (!user_getting_viewed) {
		return ;
	}
	if (window.location.pathname.includes('/profile/')) {
		const tabs = [
			{ id: 'history-tab', section: 'history-section' },
			{ id: 'friends-tab', section: 'friends-section' },
			{ id: 'stats-tab', section: 'stats-section' }
		];
		if (user_getting_viewed.innerText === window.location.pathname.split('/')[2]) {
			tabs.push({ id: 'requests-tab', section: 'requests-section' });
		}
		tabs.forEach(tab => {
			const tabElement = document.getElementById(tab.id);
			if (tabElement) {
				tabElement.addEventListener('click', function() {
					showSection(tab.id, tab.section);
				});
			}
		});
		get_all_users();
	}
}

function showSection(activeTabId, activeSectionId) {
	const sections = ['history-section', 'friends-section', 'stats-section', 'requests-section'];
	const tabs = ['history-tab', 'friends-tab', 'stats-tab', 'requests-tab'];
	
	sections.forEach(section => {
		const sectionElement = document.getElementById(section);
		if (sectionElement) {
			sectionElement.classList.add('d-none');
		}
	});
	tabs.forEach(tab => {
		const tabElement = document.getElementById(tab);
		if (tabElement) {
			tabElement.classList.remove('active');
		}
	});

	const activeSectionElement = document.getElementById(activeSectionId);
	const activeTabElement = document.getElementById(activeTabId);

	if (activeSectionElement) {
		activeSectionElement.classList.remove('d-none');
	}
	if (activeTabElement) {
		activeTabElement.classList.add('active');
	}

	if (activeTabId === 'stats-tab') {
		drawChart();
	}
}


function drawChart() {
	const ctx = document.getElementById('gamesChart').getContext('2d');
	const gamesData = JSON.parse(document.getElementById('gamesData').textContent);
	const user_id = document.getElementById('userID').textContent;

	const labels = gamesData.map(game => new Date(game.fields.date).toLocaleDateString());

	let accumulatedWins = 0;
	let accumulatedLosses = 0;
	const wins = [];
	const losses = [];

	gamesData.forEach(game => {
		if (game.fields.winner == user_id) {
			accumulatedWins++;
		} else {
			accumulatedLosses++;
		}
		wins.push(accumulatedWins);
		losses.push(accumulatedLosses);
	});

	if (chartInstance) {
		chartInstance.destroy();
	}

	chartInstance = new Chart(ctx, {
		type: 'line',
		data: {
			labels: labels,
			datasets: [
				{
					label: 'Accumulated Wins',
					data: wins,
					borderColor: 'rgba(75, 192, 192, 1)',
					backgroundColor: 'rgba(75, 192, 192, 0.2)',
					fill: false,
					stepped: true,
					tension: 0.1
				},
				{
					label: 'Accumulated Losses',
					data: losses,
					borderColor: 'rgba(255, 99, 132, 1)',
					backgroundColor: 'rgba(255, 99, 132, 0.2)',
					fill: false,
					stepped: true,
					tension: 0.1
				}
			]
		},
		options: {
			scales: {
				x: {
					title: {
						display: true,
						text: 'Date'
					}
				},
				y: {
					title: {
						display: true,
						text: 'Cumulative Count'
					},
					beginAtZero: true
				}
			}
		}
	});
}

async function get_all_users() {
	const response = await fetch('/list_of_all_username_json/');
	const data = await response.json();
	all_user_list = data.map(user => user.username);
	setTimeout(setupProfileSearchFunctionality, 1000);
}

function setupProfileSearchFunctionality() {
	const searchForPlayer = document.getElementById('searchForPlayer');
	const searchResults = document.getElementById('searchResults');

	if (!searchForPlayer || !searchResults) {
		return;
	}
	searchForPlayer.addEventListener('input', function() {
		const query = this.value.toLowerCase();
		const filteredUsers = all_user_list.filter(user => user.toLowerCase().includes(query));
		displaySearchResults(filteredUsers);
		if (query.length === 0) {
			searchResults.classList.add('d-none');
		}
	});

	function displaySearchResults(users) {
		searchResults.innerHTML = '';
		if (users.length === 0) {
			searchResults.classList.add('d-none');
			return;
		}
		searchResults.classList.remove('d-none');
		users.forEach(user => {
			const userElement = document.createElement('div');
			userElement.className = 'user-item';
			userElement.addEventListener('click', function() {
				loadProfile(user);
			});
			userElement.textContent = user;
			searchResults.appendChild(userElement);
		});
	}
}

async function update(back_or_forward = 1) {
	await handleFormSubmission('profile_form', '/edit_profile/', '/profile/', back_or_forward);
}

function loadProfile(username) {
	if (window.game_in_progress) {
		destroyOpenWebsocket();
	}
	if (username) {
		handleRoute('/profile/' + username, true);
		setTimeout(init_profile, 1000);
	}
	get_all_users();
}

function addFriend(name) {
	handleRoute(`/send_friend_request/${name}`, false);
	setTimeout(init_profile, 1000);
}

function removeFriend(name) {
	handleRoute(`/remove_friend/${name}`, false);
	setTimeout(init_profile, 1000);
}

function acceptRequest(name) {
	handleRoute(`/accept_friend_request/${name}`, false);
	setTimeout(init_profile, 1000);
}

function cancelRequest(name) {
	handleRoute(`/cancel_friend_request/${name}`, false);
	setTimeout(init_profile, 1000);
}

function declineRequest(name) {
	handleRoute(`/decline_friend_request/${name}`, false);
	setTimeout(init_profile, 1000);
}


function getCookie(name) {
	let cookieValue = null;
	if (document.cookie && document.cookie !== '') {
		const cookies = document.cookie.split(';');
		for (let i = 0; i < cookies.length; i++) {
			const cookie = cookies[i].trim();
			if (cookie.substring(0, name.length + 1) === (name + '=')) {
				cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
				break;
			}
		}
	}
	return cookieValue;
}

function initializeDeleteProfile(deleteUrl, redirectUrl) {
	const responseAlert = document.getElementById('responseAlert');
	const responseMessage = document.querySelector('.response__message');
	const csrfToken = getCookie('csrftoken');

	if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
		fetch(deleteUrl, {
			method: 'POST',
			headers: {
				'X-CSRFToken': csrfToken,
				'Content-Type': 'application/json'
			},
		})
		.then(response => response.json())
		.then(data => {
			if (data.success) {
				responseMessage.textContent = data.message;
				responseAlert.classList.remove('d-none');
				responseAlert.classList.add('show', 'alert-success');
				setTimeout(() => {
					isLoggin = true;
					handleRoute(redirectUrl, true);
				}, 2000);
			} else {
				responseMessage.textContent = data.error;
				responseAlert.classList.remove('d-none');
				responseAlert.classList.add('show', 'alert-danger');
			}
		})
		.catch(error => {
			responseMessage.textContent = 'An error occurred while trying to delete your account.';
			responseAlert.classList.remove('d-none');
			responseAlert.classList.add('show', 'alert-danger');
		});
	}
}

function anonymize() {
	isLoggin = true;
	handleRoute('/anonymize_user/', false);
	setTimeout(() => handleRoute('/', true), 500);
}
