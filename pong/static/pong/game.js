var data = {}

function connect() {
    const socket = new WebSocket(`ws://${window.location.host}/ws/game/`);

    socket.onopen = function () {
        console.log('WebSocket connection established');
        start_game(0);

    }

    socket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        console.log(data);
    }
}


function start_game(back_or_forward = 1) {
    fetch('/start_game/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        updateURL('/start_game/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}