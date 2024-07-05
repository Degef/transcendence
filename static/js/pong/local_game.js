var data3 = null;

var p1score = 0;
var p2score = 0;
var isIntournament = false;

const player1Element = document.getElementById('player1Name');
const player2Element = document.getElementById('player2Name');
const player1_name  = player1Element ? player1Element.textContent.trim() : 'Player1';
const player2_name = player2Element ? player2Element.textContent.trim() : 'Player2';

function getTextContentById(id) {
    const element = document.getElementById(id);
    return element ? element.textContent.trim() : '';
}

function getScoresDisplay(playerid) {
    return (playerid === 'p1' ? p1score : p2score);
}

function updateScoresDisplay(player1Score, player2Score) {
    p1score = player1Score;
    p2score = player2Score;
}
function generateRandDir() {
    const randDir = Math.random() < 0.5;

    if (randDir) {
        // Generate a random number greater than 3
        return Math.random() * (10 - 3) + 3;
    } else {
        // Generate a random number less than -3
        return Math.random() * (10 - 3) - 10;
    }
}

function update1(data3){
    // update the ball
    data3['ball'].x += data3['ball'].velocityX;
    if (data3['ball'].y + data3['ball'].radius < data3['canvas'].height && data3['ball'].y - data3['ball'].radius > 0) {
        data3['ball'].y += data3['ball'].velocityY;
    } else if (data3['ball'].y - data3['ball'].radius <= 0) {
        data3['ball'].velocityY = -data3['ball'].velocityY;
        data3['ball'].y += data3['ball'].velocityY;
    } 
    else {
        data3['ball'].velocityY = -data3['ball'].velocityY;
        data3['ball'].y += data3['ball'].velocityY;
    }

    //update paddle
    data3['player1'].y += data3['player1'].speedY;
    data3['player2'].y += data3['player2'].speedY;

    // Keep paddles within the canvas
    data3['player1'].y = Math.max(0, Math.min(data3['canvas'].height - data3['player1'].height, data3['player1'].y));
    data3['player2'].y = Math.max(0, Math.min(data3['canvas'].height - data3['player2'].height, data3['player2'].y));

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
        winner = data3['player1'].score == 5 ? getTextContentById('player1Name') : getTextContentById('player2Name');
        clearInterval(intervalId);
        if (data3['player1'].score == 5) {
            drawText2(data3['ctx'], getTextContentById('player1Name') + " Won",  data3['canvas'].width/6, data3['canvas'].height/2, "#333");
            drawText2(data3['ctx'], getTextContentById('player2Name') + " Lost",  data3['canvas'].width/1.5, data3['canvas'].height/2, "#333");
        } else {
            drawText2(data3['ctx'], getTextContentById('player1Name') + " Lost", data3['canvas'].width/6, data3['canvas'].height/2, '#444');
            drawText2(data3['ctx'], getTextContentById('player2Name') + " Won", data3['canvas'].width/1.5, data3['canvas'].height/2, '#444');
        }
        game_in_progress = false;
        updateScoresDisplay(data3['player1'].score, data3['player2'].score);
        // document.getElementById('restart_btn').style.display = 'block';
        displayBtn('restart_btn');
        // document.getElementById('quit_game').style.display = 'none';
        if (isIntournament) {
            // displayWinnerModal(winner,  getTextContentById('player1Name'));
            displayWinnerModal(winner, player2);
            setTimeout(() => {
                onGameCompleted();
            }, 6000);
        }
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
    // document.getElementById('start_play_computer').style.display = 'none';
    // document.getElementById('restart_btn').style.display = 'none';
    // document.getElementById('quit_game').style.display = 'block';
    hideBtn('start_play_computer');
    hideBtn('restart_btn');
    displayBtn('quit_game');
    if (game_in_progress) {
        console.log("return From game_in_progres")
        return;
    }
    // if (challengeInterval != null) {
    //     clearInterval(challengeInterval);
    //     challengeInterval = null;
    // }
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
        // velocityX : generateRandDir(),
        // velocityY : generateRandDir(),
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


function goBack() {
    // terminate_game = false;
    clearInterval(intervalId);
	// terminate_game = true;
	game_in_progress = false;
    document.getElementById('tournament').style.display = 'block';
    history.back();
}