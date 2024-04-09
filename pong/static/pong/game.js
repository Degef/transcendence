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

// draw a rectangle, will be used to draw paddles
function drawRect(data2, x, y, w, h, color){
    data2['ctx'].fillStyle = color;
    data2['ctx'].fillRect(x, y, w, h);
}

// draw circle, will be used to draw the ball
function drawArc(data2, x, y, r, color){
    data2['ctx'].fillStyle = color;
    data2['ctx'].beginPath();
    data2['ctx'].arc(x,y,r,0,Math.PI*2,true);
    data2['ctx'].closePath();
    data2['ctx'].fill();
}

// ################### Computer Game Logic #################

function getMousePos(canvas, user) {
    return function(evt) {
        let rect = canvas.getBoundingClientRect();
        user.y = evt.clientY - rect.top - user.height/2;
    }
}

function resetBall(data2){
    data2['ball'].x = data2['canvas'].width/2;
    data2['ball'].y = data2['canvas'].height/2;
    data2['ball'].velocityX = -data2['ball'].velocityX;
    data2['ball'].speed = 7;
}

function drawText(data2, text, x, y){
    data2['ctx'].fillStyle = "#FFF";
    data2['ctx'].font = "75px fantasy";
    data2['ctx'].fillText(text, x, y);
}

function collision(b, p){
    p.top = p.y;
    p.bottom = p.y + p.height;
    p.left = p.x;
    p.right = p.x + p.width;

    b.top = b.y - b.radius;
    b.bottom = b.y + b.radius;
    b.left = b.x - b.radius;
    b.right = b.x + b.radius;

    return p.left < b.right && p.top < b.bottom && p.right > b.left && p.bottom > b.top;
}

function update(data2){
    // update the ball
    data2['ball'].x += data2['ball'].velocityX;
    data2['ball'].y += data2['ball'].velocityY;

    // simple AI to control com paddle
    let computerLevel = 0.1;
    data2['com'].y += (data2['ball'].y - (data2['com'].y + data2['com'].height/2)) * computerLevel;

    if(data2['ball'].y + data2['ball'].radius > data2['canvas'].height || data2['ball'].y - data2['ball'].radius < 0){
        data2['ball'].velocityY = -data2['ball'].velocityY;
        data2['wall'].play();
    }

    let player = (data2['ball'].x < data2['canvas'].width/2) ? data2['user'] : data2['com'];

    if(collision(data2['ball'],player)){
        data2['hit'].play();
        // where the ball hit the player
        let collidePoint = (data2['ball'].y - (player.y + player.height/2));
        // normalization
        collidePoint = collidePoint / (player.height/2);

        // calculate angle in radian
        let angleRad = (Math.PI/4) * collidePoint;

        // X direction of the ball when it hits the player
        let direction = (data2['ball'].x < data2['canvas'].width/2) ? 1 : -1;
        // change velocity X and Y
        data2['ball'].velocityX = direction * data2['ball'].speed * Math.cos(angleRad);
        data2['ball'].velocityY = data2['ball'].speed * Math.sin(angleRad);
        // speed up the ball
        data2['ball'].speed += 0.1;
    }

    // change the score of players, if the ball goes to the left "ball.x<0" computer win, else if "ball.x > canvas.width" the user win
    if(data2['ball'].x - data2['ball'].radius < 0){
        data2['com'].score++;
        data2['comScore'].play();
        resetBall(data2);
    }else if(data2['ball'].x + data2['ball'].radius > data2['canvas'].width){
        data2['user'].score++;
        data2['userScore'].play();
        resetBall(data2);
    }
}

function render(data2){
    // clear the canvas
    data2['ctx'].clearRect(0, 0, data2['canvas'].width, data2['canvas'].height);

    // draw the user score to the left
    drawText(data2, data2['user'].score, data2['canvas'].width/4, data2['canvas'].height/5);

    // draw the com score to the right
    drawText(data2, data2['com'].score, 3*data2['canvas'].width/4, data2['canvas'].height/5);

    // draw the net
    drawRect(data2, data2['canvas'].width/2 - 1, 0, 2, data2['canvas'].height, "WHITE");

    // draw the user and com paddles
    drawRect(data2, data2['user'].x, data2['user'].y, data2['user'].width, data2['user'].height, data2['user'].color);
    drawRect(data2, data2['com'].x, data2['com'].y, data2['com'].width, data2['com'].height, data2['com'].color);

    // draw the ball
    drawArc(data2, data2['ball'].x, data2['ball'].y, data2['ball'].radius, data2['ball'].color);
}

function gameLoop(data2){
    update(data2);
    render(data2);
}

function start_play_computer() {
    var data2 = {};
    data2['hit'] = new Audio();
    data2['wall'] = new Audio();
    data2['userScore'] = new Audio();
    data2['comScore'] = new Audio();

    data2['hit'].src = "/static/pong/sounds/hit.mp3";
    data2['wall'].src = "/static/pong/sounds/wall.mp3";
    data2['userScore'].src = "/static/pong/sounds/user.mp3";
    data2['comScore'].src = "/static/pong/sounds/com.mp3";

    data2['canvas'] = document.getElementById('gameCanvas');
    data2['ctx'] = data2['canvas'].getContext('2d');
    data2['ball'] = {
        x : data2['canvas'].width/2,
        y : data2['canvas'].height/2,
        radius : 10,
        velocityX : 5,
        velocityY : 5,
        speed : 7,
        color : "WHITE"
    };
    data2['user'] = {
        x : 0, // left side of canvas
        y : ( data2['canvas'].height - 100)/2, // -100 the height of paddle
        width : 10,
        height : 100,
        score : 0,
        color : "WHITE"
    }
    data2['com'] = {
        x : data2['canvas'].width - 10, // - width of paddle
        y : ( data2['canvas'].height - 100)/2, // -100 the height of paddle
        width : 10,
        height : 100,
        score : 0,
        color : "WHITE"
    }
    // canvas.addEventListener("mousemove", getMousePos);
    data2['canvas'].addEventListener("mousemove", getMousePos(data2['canvas'], data2['user']));
    setInterval(function(){
        gameLoop(data2);
    }, 1000/50);
}

// ################### Online Game Logic ###################

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

function start_play_online() {
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
}

function play_online() {
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

function game_computer() {
    fetch('/game_computer/', {
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