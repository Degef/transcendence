let chartInstance = null;

function init_profile() {
	if (window.location.pathname.includes('/profile/')) {
		const tabs = [
			{ id: 'history-tab', section: 'history-section' },
			{ id: 'friends-tab', section: 'friends-section' },
			{ id: 'stats-tab', section: 'stats-section' },
			{ id: 'requests-tab', section: 'requests-section' }
		];

		tabs.forEach(tab => {
			const tabElement = document.getElementById(tab.id);
			if (tabElement) {
				tabElement.addEventListener('click', function() {
					showSection(tab.id, tab.section);
				});
			}
		});
	}
}
function showSection(activeTabId, activeSectionId) {
	const sections = ['history-section', 'friends-section', 'stats-section', 'requests-section'];
	const tabs = ['history-tab', 'friends-tab', 'stats-tab', 'requests-tab'];
	
	sections.forEach(section => document.getElementById(section).classList.add('d-none'));
	tabs.forEach(tab => document.getElementById(tab).classList.remove('active'));

	document.getElementById(activeSectionId).classList.remove('d-none');
	document.getElementById(activeTabId).classList.add('active');

	if (activeTabId === 'stats-tab') {
		drawChart();
	}
}

window.addEventListener('DOMContentLoaded', function (event) {
	if (window.location.pathname.includes('/profile/')) {
		setTimeout(init_profile, 1000);
	}
});

function drawChart() {
	const ctx = document.getElementById('gamesChart').getContext('2d');
	const gamesData = JSON.parse(document.getElementById('gamesData').textContent);

	const labels = gamesData.map(game => new Date(game.fields.date).toLocaleDateString());
	const wins = gamesData.map(game => (game.fields.winner === user_id ? 1 : 0));
	const losses = gamesData.map(game => (game.fields.winner !== user_id ? 1 : 0));

	if (chartInstance) {
		chartInstance.destroy();
	}

	chartInstance = new Chart(ctx, {
		type: 'line',
		data: {
			labels: labels,
			datasets: [
				{
					label: 'Wins',
					data: wins,
					borderColor: 'rgba(75, 192, 192, 1)',
					backgroundColor: 'rgba(75, 192, 192, 0.2)',
					fill: false,
					tension: 0.1
				},
				{
					label: 'Losses',
					data: losses,
					borderColor: 'rgba(255, 99, 132, 1)',
					backgroundColor: 'rgba(255, 99, 132, 0.2)',
					fill: false,
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
						text: 'Rate'
					},
					beginAtZero: true
				}
			}
		}
	});
}

async function update(back_or_forward = 1) {
	await handleFormSubmission('profile_form', '/edit_profile/', '/profile/', back_or_forward);
}

function loadProfile(username) {
	if (username)
		handleRoute('/profile/' + username);
}

function addFriend(name) {
	handleRoute(`/add_friend/${name}`, false);
}

function removeFriend(name) {
	handleRoute(`/remove_friend/${name}`, false);
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
					window.location.href = redirectUrl;
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

