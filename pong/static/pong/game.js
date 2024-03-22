var data = {
    'playerId': null,
    'player': null,
    "paddleWidth": 5, 
    "paddleHeight": 30,
}

function setPlayer(rec) {
    if (data['player'] == null) {
        if (rec['gameState']['player1'] == data['playerId']) {
            data['player'] = 1;
        } else {
            data['player'] = 2;
        }
        
        const canvas = document.getElementById('gameCanvas');
        data['canvas'] = canvas;
        data['ctx'] = data['canvas'].getContext('2d');

        if (data['player'] == 1) {
            data['paddle'] = { x: 0, y: data['canvas'].height / 2 - data['paddleHeight'] / 2, speedY: 0 };
        } else if (data['player'] == 2) {
            data['paddle'] = { x: data['canvas'].width - data['paddleWidth'], y: data['canvas'].height / 2 - data['paddleHeight'] / 2, speedY: 0 };
        }
        const message = {
            'type': 'updatePaddle',
            'playerId': data['playerId'],
            'paddle': data['paddle'],
            'player': data['player']
        };
        data['socket'].send(JSON.stringify(message));
    }
}

function connect1() {
    start_game(0);
}

function draw(gameState) {
    if (gameState['paddle1'] != null && gameState['paddle2'] != null) {
        const canvas = data['canvas'];
        const ctx = data['ctx'];
        const paddleWidth = data['paddleWidth'];
        const paddleHeight = data['paddleHeight'];
        const paddle1 = gameState['paddle1'];
        const paddle2 = gameState['paddle2'];

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'white';
        ctx.fillRect(paddle1['x'], paddle1['y'], paddleWidth, paddleHeight);
        ctx.fillRect(paddle2['x'], paddle2['y'], paddleWidth, paddleHeight);
    }
}

function connect() {
    const socket = new WebSocket(`ws://${window.location.host}/ws/game/`);

    data['socket'] = socket;

    socket.onopen = function () {
        console.log('WebSocket connection established');
    }

    socket.onmessage = function (event) {
        const rec = JSON.parse(event.data);
        console.log(rec);
        if (rec['type'] == 'playerId') {
            data['playerId'] = rec['playerId'];
            console.log(data['playerId']);
        } else if (rec['type'] == 'gameState') {
            setPlayer(rec);
            draw(rec['gameState']);
        }
    }

    socket.onclose = function () {
        console.log('WebSocket connection closed');
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