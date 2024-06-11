var data = {
    'playerId': null,
    'player': null,
    "paddleWidth": 10, 
    "paddleHeight": 60,
    'paddle_speed': 8,
    'paddle': {'speedY': 0},
    'endGame': false,
    'score': { 'player1': 0, 'player2': 0 },
}

var data2 = null;
var game_in_progress = false;
var terminate_game = false;
let intervalId;

// draw a rectangle, will be used to draw paddles
function drawRect(ctx, x, y, w, h, color){
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawArc(data2, x, y, r, color){
    data2['ctx'].fillStyle = color;
    data2['ctx'].beginPath();
    data2['ctx'].arc(x,y,r,0,Math.PI*2,true);
    data2['ctx'].closePath();
    data2['ctx'].fill();
}

function drawNet(data2) {
    data2.ctx.beginPath();
    data2.ctx.setLineDash([5, 15]);
    data2.ctx.moveTo(data2.canvas.width / 2, 0);
    data2.ctx.lineTo(data2.canvas.width / 2, data2.canvas.height);
    data2.ctx.strokeStyle = 'white';
    data2.ctx.stroke();
}

// ###################################### VS Computer Game ####################################

function getMousePos(canvas, user) {
    return function(evt) {
        let rect = canvas.getBoundingClientRect();
        user.y = evt.clientY - rect.top - user.height/2;
    }
}

function resetBall(data2){
    data2['ball'].x = data2['canvas'].width/2;
    data2['ball'].y = data2['canvas'].height/2;
    data2['ball'].velocityX = 7;
    data2['ball'].velocityY = 0;
    data2['ball'].speed = 7;
}

function drawText(ctx, text, x, y){
    ctx.fillStyle = "#FFF";
    ctx.font = "75px sans-serif";
    ctx.fillText(text, x, y);
}

function drawText2(ctx, text, x, y, color){
   ctx.fillStyle = "#FFF";
   ctx.font = "25px sans-serif";
   ctx.fillText(text, x, y);
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

function updateGame(data2){
    // update the ball
    data2['ball'].x += data2['ball'].velocityX;
    data2['ball'].y += data2['ball'].velocityY;

    // simple AI to control com paddle
    let computerLevel = 0.1;
    data2['com'].y += (data2['ball'].y - (data2['com'].y + data2['com'].height/2)) * computerLevel;

    if(data2['ball'].y + data2['ball'].radius > data2['canvas'].height || data2['ball'].y - data2['ball'].radius < 0){
        data2['ball'].velocityY = -data2['ball'].velocityY;
        // data2['wall'].play();
    }

    let player = (data2['ball'].x < data2['canvas'].width/2) ? data2['user'] : data2['com'];

    if(collision(data2['ball'],player)){
        data2['hit'].play();
        let collidePoint = (data2['ball'].y - (player.y + player.height/2));
        collidePoint = collidePoint / (player.height/2);
        let angleRad = (Math.PI/4) * collidePoint;
        let direction = (data2['ball'].x < data2['canvas'].width/2) ? 1 : -1;
        data2['ball'].velocityX = direction * data2['ball'].speed * Math.cos(angleRad);
        data2['ball'].velocityY = data2['ball'].speed * Math.sin(angleRad);
        data2['ball'].speed += 0.2;
    }

    if (data2['ball'].x - data2['ball'].radius < 0){
        data2['com'].score++;
        data2['comScore'].play();
        resetBall(data2);
    } else if(data2['ball'].x + data2['ball'].radius > data2['canvas'].width){
        data2['user'].score++;
        data2['userScore'].play();
        resetBall(data2);
    }
     // Keep paddles within the canvas
     data2['user'].y = Math.max(0, Math.min(data2['canvas'].height - data2['user'].height, data2['user'].y));
}

function render(data2) {
    data2['ctx'].clearRect(0, 0, data2['canvas'].width, data2['canvas'].height);
    drawText(data2['ctx'], data2['user'].score, data2['canvas'].width/4, data2['canvas'].height/5);
    drawText(data2['ctx'], data2['com'].score, 3*data2['canvas'].width/4, data2['canvas'].height/5);
    drawNet(data2);
    drawRect(data2['ctx'], data2['user'].x, data2['user'].y, data2['user'].width, data2['user'].height, data2['user'].color);
    drawRect(data2['ctx'], data2['com'].x, data2['com'].y, data2['com'].width, data2['com'].height, data2['com'].color);
    drawArc(data2, data2['ball'].x, data2['ball'].y, data2['ball'].radius, data2['ball'].color);
}

function gameLoop(data2) {
    if (data2['user'].score == 5 || data2['com'].score == 5) {
        clearInterval(intervalId);
        if (data2['user'].score == 5) {
            drawText2(data2['ctx'], "You Won",  data2['canvas'].width/6, data2['canvas'].height/2, "#333");
        } else {
            drawText2(data2['ctx'], "You Lost", data2['canvas'].width/6, data2['canvas'].height/2, '#444');
        }
        displayBtn('restart_btn');
        game_in_progress = false;
        return;
    } else if (terminate_game) {
        clearInterval(intervalId);
        game_in_progress = false;
        terminate_game = false;
        return;
    }
    updateGame(data2);
    render(data2);
}

function hideBtn(id) {
    const button = document.getElementById(id);
    if (button) {
        button.style.display = 'none';
    }
}

function displayBtn(id) {
    const button = document.getElementById(id);
    if (button) {
        button.style.display = 'block';
    }
}


function start_play_computer() {
    // document.getElementById('start_play_computer').style.display = 'none';
    // document.getElementById('restart_btn').style.display = 'none';
    // document.getElementById('quit_game').style.display = 'block';
    hideBtn('start_play_computer');
    hideBtn('restart_btn');
    displayBtn('quit_game');

    if (game_in_progress) {
        return;
    }
    game_in_progress = true;
    
    if (data2 == null) {
        data2 = {};
        data2['hit'] = new Audio();
        // data2['wall'] = new Audio();
        data2['userScore'] = new Audio();
        data2['comScore'] = new Audio();
    
        data2['hit'].src = "/media/sounds/wall.mp3";
        // data2['wall'].src = "media/sounds/wall.mp3";
        data2['userScore'].src = "/media/sounds/userScore.mp3";
        data2['comScore'].src = "/media/sounds/comScore.mp3";
        // console.log('data2 is not defined')
    } else {
        data2['ctx'].clearRect(0, 0, data2['canvas'].width, data2['canvas'].height);
    }
    data2['canvas'] = document.getElementById('gameCanvas');
    data2['ctx'] = data2['canvas'].getContext('2d');

    data2['ball'] = {
        x : data2['canvas'].width/2,
        y : data2['canvas'].height/2,
        radius : 10,
        velocityX : 7,
        velocityY : 0,
        speed : 7,
        color : "WHITE"
    };

    data2['user'] = {
        x : 0, // left side of canvas
        y : ( data2['canvas'].height - 100)/2, // -100 the height of paddle
        width : 10,
        height : 60,
        score : 0,
        color : "WHITE"
    }
    data2['com'] = {
        x : data2['canvas'].width - 10, // - width of paddle
        y : ( data2['canvas'].height - 100)/2, // -100 the height of paddle
        width : 10,
        height : 60,
        score : 0,
        color : "WHITE"
    }
    // canvas.addEventListener("mousemove", getMousePos);
    data2['canvas'].addEventListener("mousemove", getMousePos(data2['canvas'], data2['user']));
    intervalId = setInterval(function(){
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
        drawText(ctx, data['gameState']['score1'], canvas.width / 4, canvas.height / 5, 'white');
        drawText(ctx, data['gameState']['score2'], 3 * canvas.width / 4, canvas.height / 5, 'white');
    }
}

function main_loop () {
    if (data['gameState'].collision.paddle)
        data['hit'].play();
    if (data['gameState'].collision.goal)
        data['comScore'].play();
    if (data['gameState'].collision.wall)
        data['wall'].play();

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
        game_in_progress = false;
        return
    }
    if (terminate_game) {
        terminate_game = false;
        game_in_progress = false;
        data['socket'].close();
        return;
    }
    data['socket'].send(JSON.stringify(message));
    requestAnimationFrame(main_loop);
}

function getMousePos2(canvas) {
    return function(evt) {
        let rect = canvas.getBoundingClientRect();
        data['paddle'].y = evt.clientY - rect.top - data['paddleHeight'] / 2;
    }
}

function setPlayer(rec) {
    if (data['player'] == null) {
        if (rec['gameState']['player1'] == data['playerId']) {
            data['player'] = 1;
        } else {
            data['player'] = 2;
        }

        // console.log("Player Number   " +  data.player)
        const canvasContainer = document.querySelector('.canvas_container');

        // Find the wait_load div
        const waitLoadDiv = canvasContainer.querySelector('#wait_load');

        // Check if wait_load div exists before removing it
        if (waitLoadDiv) {
            // Remove the wait_load div
            canvasContainer.removeChild(waitLoadDiv);
            document.getElementById('end_game').innerHTML = "";
        }

        data['canvas'] = document.getElementById('gameCanvas');
        data['ctx'] = data['canvas'].getContext('2d');

        
        if (data['player'] == 1) {
            data['paddle'] = { x: 0, y: data['canvas'].height / 2 - data['paddleHeight'] / 2, speedY: 0 };
        } else if (data['player'] == 2) {
            data['paddle'] = { x: data['canvas'].width - data['paddleWidth'], y: data['canvas'].height / 2 - data['paddleHeight'] / 2, speedY: 0 };
        }

        data['canvas'].addEventListener('mousemove', getMousePos2(data['canvas']));
        
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
    if (game_in_progress) {
        return;
    }
    if (challengeInterval != null) {
        clearInterval(challengeInterval);
        challengeInterval = null;
    }
    game_in_progress = true;

    const socket = new WebSocket(`ws://${window.location.host}/ws/game/`);

    data['socket'] = socket;
    data['hit'] = new Audio();
    data['wall'] = new Audio();
    data['userScore'] = new Audio();
    data['comScore'] = new Audio();

    data['hit'].src = "/media/sounds/hit.mp3";
    data['wall'].src = "/media/sounds/wall.mp3";
    data['userScore'].src = "/media/sounds/userScore.mp3";
    data['comScore'].src = "/media/sounds/comScore.mp3";

    socket.onopen = function () {
        console.log('WebSocket connection established');
    }

    socket.onmessage = function (event) {
        const rec = JSON.parse(event.data);
        console.log(rec);
        if (rec['type'] == 'playerId') {
            data['playerId'] = rec['playerId'];
            document.getElementById('end_game').innerHTML = " <p> Waiting for other player to join </p>"
            document.querySelector('.canvas_container').innerHTML += "<div id='wait_load'></div>"
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
            // start_challenge_checking();
        }
    }

    socket.onclose = function () {
        console.log('WebSocket connection closed');
        data['endGame'] = true;
        data['playerId'] = null;
        game_in_progress = false;
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

