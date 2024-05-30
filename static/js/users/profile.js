// document.getElementById('history-tab').addEventListener('click', function() {
//     document.getElementById('history-section').classList.remove('d-none');
//     document.getElementById('friends-section').classList.add('d-none');
//     document.getElementById('stats-section').classList.add('d-none');
//     document.getElementById('history-tab').classList.add('active');
//     document.getElementById('friends-tab').classList.remove('active');
//     document.getElementById('stats-tab').classList.remove('active');
// });

// document.getElementById('friends-tab').addEventListener('click', function() {
//     document.getElementById('history-section').classList.add('d-none');
//     document.getElementById('stats-section').classList.add('d-none');
//     document.getElementById('friends-section').classList.remove('d-none');
//     document.getElementById('history-tab').classList.remove('active');
//     document.getElementById('stats-tab').classList.remove('active');
//     document.getElementById('friends-tab').classList.add('active');
// });


// document.getElementById('stats-tab').addEventListener('click', function() {
//     document.getElementById('history-section').classList.add('d-none');
//     document.getElementById('friends-section').classList.add('d-none');
//     document.getElementById('stats-section').classList.remove('d-none');
//     document.getElementById('history-tab').classList.remove('active');
//     document.getElementById('friends-tab').classList.remove('active');
//     document.getElementById('stats-tab').classList.add('active');
//     drawChart();
// });


function drawChart() {
    const ctx = document.getElementById('gamesChart').getContext('2d');
    const gamesData = JSON.parse(document.getElementById('gamesData').textContent);

    const labels = gamesData.map(game => new Date(game.fields.date).toLocaleDateString());
    const wins = gamesData.map(game => (game.fields.winner === user_id ? 1 : 0));
    const losses = gamesData.map(game => (game.fields.winner !== user_id ? 1 : 0));

    new Chart(ctx, {
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
                        text: 'Game Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Count'
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
