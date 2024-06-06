var data3 = null;

function update1(data3){
    // update the ball
    data3['ball'].x += data3['ball'].velocityX;
    data3['ball'].y += data3['ball'].velocityY;

    //update paddle
    data3['player1'].y += data3['player1'].speedY;
    data3['player2'].y += data3['player2'].speedY;

    // Keep paddles within the canvas
    data3['player1'].y = Math.max(0, Math.min(data3['canvas'].height - data3['player1'].height, data3['player1'].y));
    data3['player2'].y = Math.max(0, Math.min(data3['canvas'].height - data3['player2'].height, data3['player2'].y));

    // simple AI to control com paddle
    // let computerLevel = 0.1;
    // data3['com'].y += (data3['ball'].y - (data3['com'].y + data3['com'].height/2)) * computerLevel;

    if(data3['ball'].y + data3['ball'].radius > data3['canvas'].height || data3['ball'].y - data3['ball'].radius < 0){
        data3['ball'].velocityY = -data3['ball'].velocityY;
        // data3['wall'].play();
    }

    let player = (data3['ball'].x < data3['canvas'].width/2) ? data3['player1'] : data3['player2'];

    if(collision(data3['ball'],player)){
        data3['hit'].play();
        let collidePoint = (data3['ball'].y - (player.y + player.height/2));
        collidePoint = collidePoint / (player.height/2);
        let angleRad = (Math.PI/4) * collidePoint;
        let direction = (data3['ball'].x < data3['canvas'].width/2) ? 1 : -1;
        data3['ball'].velocityX = direction * data3['ball'].speed * Math.cos(angleRad);
        data3['ball'].velocityY = data3['ball'].speed * Math.sin(angleRad);
        data3['ball'].speed += 0.2;
    }

    if (data3['ball'].x - data3['ball'].radius < 0){
        data3['player2'].score++;
        // data3['comScore'].play();
        resetBall(data3);
    } else if(data3['ball'].x + data3['ball'].radius > data3['canvas'].width){
        data3['player1'].score++;
        // data3['player1Score'].play();
        resetBall(data3);
    }

}

function render1(data3) {
    data3['ctx'].clearRect(0, 0, data3['canvas'].width, data3['canvas'].height);
    drawText(data3['ctx'], data3['player1'].score, data3['canvas'].width/4, data3['canvas'].height/5);
    drawText(data3['ctx'], data3['player2'].score, 3*data3['canvas'].width/4, data3['canvas'].height/5);
    drawNet(data3);
    drawRect(data3['ctx'], data3['player1'].x, data3['player1'].y, data3['player1'].width, data3['player1'].height, data3['player1'].color);
    drawRect(data3['ctx'], data3['player2'].x, data3['player2'].y, data3['player2'].width, data3['player2'].height, data3['player2'].color);
    drawArc(data3, data3['ball'].x, data3['ball'].y, data3['ball'].radius, data3['ball'].color);
}

function gameLoop1(data3) {
    if (data3['player1'].score == 5 || data3['player2'].score == 5) {
        clearInterval(intervalId);
        if (data3['player1'].score == 5) {
            drawText2(data3['ctx'], "You Won",  data3['canvas'].width/6, data3['canvas'].height/2, "#333");
        } else {
            drawText2(data3['ctx'], "You Lost", data3['canvas'].width/6, data3['canvas'].height/2, '#444');
        }
        game_in_progress = false;
        return;
    } else if (terminate_game) {
        clearInterval(intervalId);
        game_in_progress = false;
        terminate_game = false;
        start_challenge_checking();
        return;
    }
    update1(data3);
    render1(data3);
}

function start_local_game() {
    if (game_in_progress) {
        return;
    }
    if (challengeInterval != null) {
        clearInterval(challengeInterval);
        challengeInterval = null;
    }
    game_in_progress = true;
    
    if (data3 == null) {
        data3 = {};
        data3['hit'] = new Audio();
        data3['wall'] = new Audio();
        data3['userScore'] = new Audio();
        data3['comScore'] = new Audio();
    
        data3['hit'].src = "/media/sounds/hit.mp3";
        data3['wall'].src ="/media/sounds/wall.mp3";
        data3['userScore'].src =  "/media/sounds/userScore.mp3";
        data3['comScore'].src = "/media/sounds/comScore.mp3";
    } else {
        data3['ctx'].clearRect(0, 0, data3['canvas'].width, data3['canvas'].height);
    }
    data3['canvas'] = document.getElementById('gameCanvas');
    data3['ctx'] = data3['canvas'].getContext('2d');
    data3['paddle_speed'] = 10;

    data3['ball'] = {
        x : data3['canvas'].width/2,
        y : data3['canvas'].height/2,
        radius : 10,
        velocityX : 7,
        velocityY : 0,
        speed : 7,
        color : "WHITE"
    };

    data3['player1'] = {
        x : 0,
        y : ( data3['canvas'].height - 100)/2,
        speedY : 0,
        width : 10,
        height : 60,
        score : 0,
        color : "WHITE"
    }
    data3['player2'] = {
        x : data3['canvas'].width - 10,
        y : ( data3['canvas'].height - 100)/2,
        speedY : 0,
        width : 10,
        height : 60,
        score : 0,
        color : "WHITE"
    }
    // canvas.addEventListener("mousemove", getMousePos);
    // data3['canvas'].addEventListener("mousemove", getMousePos(data3['canvas'], data3['user']));
    window.addEventListener('keydown', (e) => {
        if (e.key === 'w') {
            data3['player1'].speedY = -data3['paddle_speed'];            
        } else if (e.key === 's') {
            data3['player1'].speedY = data3['paddle_speed'];
        } else if (e.key === 'ArrowUp') {
            data3['player2'].speedY = -data3['paddle_speed'];
        } else if (e.key === 'ArrowDown') {
            data3['player2'].speedY = data3['paddle_speed'];
        }

    });
    
    window.addEventListener('keyup', (e) => {
        if (e.key === 'w' || e.key === 's') {
            data3['player1'].speedY = 0;
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            data3['player2'].speedY = 0;
        }
    });
    intervalId = setInterval(function(){
        gameLoop1(data3);
    }, 1000/50);
}



