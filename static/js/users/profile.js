let chartInstance = null;

function init_profile() {
	console.log("I am here my friend");
	if (window.location.pathname === '/profile/') {
		const tabs = [
			{ id: 'history-tab', section: 'history-section' },
			{ id: 'friends-tab', section: 'friends-section' },
			{ id: 'stats-tab', section: 'stats-section' }
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
	const sections = ['history-section', 'friends-section', 'stats-section'];
	const tabs = ['history-tab', 'friends-tab', 'stats-tab'];
	
	sections.forEach(section => document.getElementById(section).classList.add('d-none'));
	tabs.forEach(tab => document.getElementById(tab).classList.remove('active'));

	document.getElementById(activeSectionId).classList.remove('d-none');
	document.getElementById(activeTabId).classList.add('active');

	if (activeTabId === 'stats-tab') {
		drawChart();
	}
}

window.addEventListener('DOMContentLoaded', function (event) {
	if (window.location.pathname === '/profile/') {
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

function update() {
	const form = document.getElementById('profile_form');
	const formData = new FormData(form);

	fetch(form.action, {
		method: 'POST',
		body: formData,
	})
	.then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.text();
	})
	.then(data => {
		const parser = new DOMParser();
		const doc = parser.parseFromString(data, 'text/html');
		const alertBox = doc.querySelector('.alert');
		if (alertBox) {
			document.body.insertAdjacentElement('afterbegin', alertBox);
		}
	})
	.catch(error => {
		console.error('Error:', error);
	});
}


function loadProfile(username) {
	if (username)
		handleRoute('/profile/' + username);
}
