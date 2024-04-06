var data = {
    'playerId': null,
    'player': null,
    "paddleWidth": 10, 
    "paddleHeight": 60,
    'paddle_speed': 5,
    'paddle': {'speedY': 0},
    'endGame': false,
    'score': { 'player1': 0, 'player2': 0 },
}

function draw() {
    // console.log(data["gameState"])
    if (data['gameState']['paddle1'] != null && data['gameState']['paddle2'] != null) {
        const canvas = data['canvas'];
        const ctx = data['ctx'];
        const paddleWidth = data['paddleWidth'];
        const paddleHeight = data['paddleHeight'];
        const paddle1 = data['gameState']['paddle1'];
        const paddle2 = data['gameState']['paddle2'];
        const ball = data['gameState']['ball'];

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the paddles
        ctx.fillStyle = 'white';
        ctx.fillRect(paddle1['x'], paddle1['y'], paddleWidth, paddleHeight);
        ctx.fillRect(paddle2['x'], paddle2['y'], paddleWidth, paddleHeight);

        // Draw the ball
        ctx.beginPath();
        ctx.arc(ball['x'], ball['y'], ball.radius, 0, Math.PI * 2);
        ctx.fill();

        //draw net
        ctx.beginPath();
        ctx.setLineDash([5, 15]);
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.strokeStyle = 'white';
        ctx.stroke();

        //update score
        document.getElementById('score1').innerHTML = data['gameState']['score1'];
        document.getElementById('score2').innerHTML = data['gameState']['score2'];
    }
}

function main_loop () {
    data.paddle.y += data.paddle.speedY;
    // Keep paddles within the canvas
    data.paddle.y = Math.max(0, Math.min(data.canvas.height - data.paddleHeight, data.paddle.y));
    draw();

    const message = {
        'type': 'updateState',
        'playerId': data['playerId'],
        'paddle': data['paddle'],
        'player': data['player'],
    };
    if (data['endGame']) {
        data['endGame'] = false;
        return
    }
    data['socket'].send(JSON.stringify(message));
    requestAnimationFrame(main_loop);
}

function setPlayer(rec) {
    if (data['player'] == null) {
        if (rec['gameState']['player1'] == data['playerId']) {
            data['player'] = 1;
        } else {
            data['player'] = 2;
        }

        data['username1'] = rec['gameState']['p1_name']
        data['username2'] = rec['gameState']['p2_name']
        document.getElementById('player1').innerHTML = data['username1'];
        document.getElementById('player2').innerHTML = data['username2'];
        
        const canvasContainer = document.querySelector('.canvas_container');

        // Find the wait_load div
        const waitLoadDiv = canvasContainer.querySelector('#wait_load');

        // Check if wait_load div exists before removing it
        if (waitLoadDiv) {
            // Remove the wait_load div
            canvasContainer.removeChild(waitLoadDiv);
}

        data['canvas'] = document.getElementById('gameCanvas');
        data['ctx'] = data['canvas'].getContext('2d');
        // data['canvas'].width = window.innerWidth;
        // data['canvas'].height = window.innerHeight;

        if (data['player'] == 1) {
            data['paddle'] = { x: 0, y: data['canvas'].height / 2 - data['paddleHeight'] / 2, speedY: 0 };
        } else if (data['player'] == 2) {
            data['paddle'] = { x: data['canvas'].width - data['paddleWidth'], y: data['canvas'].height / 2 - data['paddleHeight'] / 2, speedY: 0 };
        }
        const message = {
            'type': 'startGame',
            'playerId': data['playerId'],
            'paddle': data['paddle'],
            'player': data['player'],
        };
        data['socket'].send(JSON.stringify(message));
        main_loop();
    }
}

function start_quick_match() {
    const socket = new WebSocket(`ws://${window.location.host}/ws/game/`);

    data['socket'] = socket;

    socket.onopen = function () {
        console.log('WebSocket connection established');
    }

    socket.onmessage = function (event) {
        const rec = JSON.parse(event.data);
        // console.log(rec);
        if (rec['type'] == 'playerId') {
            data['playerId'] = rec['playerId'];
            document.getElementById('end_game').innerHTML = " <p> Waiting for other player to join </p>"
            document.querySelector('.canvas_container').innerHTML += "<div id='wait_load'></div>"
            console.log(data['playerId']);
        } else if (rec['type'] == 'gameState') {
            // console.log("Received game state")
            data['gameState'] = rec['gameState'];
            setPlayer(rec);
            // draw(rec['gameState']);
        } else if (rec['type'] == 'gameEnd') {
            console.log(rec)
            data['endGame'] = true;
            data['playerId'] = null;
            data['player'] = null;
            document.getElementById('end_game').innerHTML = rec['message'];
            // const message = {
            //     'type': 'endGame',
            //     'playerId': data['playerId'],
            // };
            // data['socket'].send(JSON.stringify(message));
            data.socket.close();
        }
    }

    socket.onclose = function () {
        console.log('WebSocket connection closed');
        data['endGame'] = true;
    }
}

function quick_match() {
    fetch('/start_game/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}


// Function to resize the canvas
function resizeCanvas() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match window size
    canvas.width = window.innerWidth * 0.6;
    canvas.height = window.innerHeight * 0.4;

    // Redraw content on the canvas (if needed)
    // Your draw function goes here
}

// Call resizeCanvas function when the window is resized
// window.addEventListener('resize', resizeCanvas);

// Initial call to resizeCanvas function
// resizeCanvas();

window.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'ArrowUp' ) {
        data.paddle.speedY = - data.paddle_speed;
    } else if (e.key === 's' || e.key === 'ArrowDown') {
        data.paddle.speedY = data.paddle_speed;
    }
});

window.addEventListener('keyup', (e) => {
    if ((e.key === 'w' || e.key === 's') ) {
        data.paddle.speedY = 0;
    }
    
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        data.paddle.speedY = 0;
    }
});