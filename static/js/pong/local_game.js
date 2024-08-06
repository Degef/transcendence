var data3 = null;

var p1score = 0;
var p2score = 0;
var isIntournament = false;

const player1Element = document.getElementById('player1Name');
const player2Element = document.getElementById('player2Name');
const player1_name  = player1Element ? player1Element.textContent.trim() : 'Player1';
const player2_name = player2Element ? player2Element.textContent.trim() : 'Player2';


/**
 * Retrieves the trimmed text content of an HTML element by its ID.
 *
 * @param {string} id - The ID of the HTML element.
 * @returns {string} - The trimmed text content of the element. Returns an empty string if the element is not found.
 */

function getTextContentById(id) {
    const element = document.getElementById(id);
    return element ? element.textContent.trim() : '';
}

/**
 * Gets the score display for a given player ID.
 *
 * @param {string} playerid - The player ID ('p1' for player 1, 'p2' for player 2).
 * @returns {number} - The score of the player. Returns the score of player 1 if the player ID is 'p1', otherwise returns the score of player 2.
 */
function getScoresDisplay(playerid) {
    return (playerid === 'p1' ? p1score : p2score);
}


/**
 * Updates the scores display for player 1 and player 2.
 *
 * @param {number} player1Score - The new score for player 1.
 * @param {number} player2Score - The new score for player 2.
 */
function updateScoresDisplay(player1Score, player2Score) {
    p1score = player1Score;
    p2score = player2Score;
}

/**
 * Generates a random direction vector with a magnitude of 9.
 * The angle is randomly chosen from specified ranges to ensure the vector
 * direction falls within specific angular sectors.
 *
 * @returns {{x: number, y: number}} - An object containing the x and y components of the direction vector.
 */
function generateRandDir() {
    // Define the angle ranges in degrees
    const angleRanges = [
        [0, 60],
        [120, 180],
        [180, 240],
        [300, 360]
    ];

    // Select a random range
    const selectedRange = angleRanges[Math.floor(Math.random() * angleRanges.length)];

    // Generate a random angle within the selected range and convert to radians
    const angle = (Math.random() * (selectedRange[1] - selectedRange[0]) + selectedRange[0]) * (Math.PI / 180);
    
    // Calculate the x and y components based on the angle
    const x = 9 * Math.cos(angle);
    const y = 9 * Math.sin(angle);
    
    return { x: x, y: y };
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
    game_color = (localStorage.getItem('theme') === 'light') ? '#1A1F33' : "WHITE";

	data3['ball'].color = game_color;
	data3['player1'].color = game_color;
	data3['player2'].color = game_color;
    if (data3['player1'].score == 5 || data3['player2'].score == 5) {
        winner = data3['player1'].score == 5 ? getTextContentById('player1Name') : getTextContentById('player2Name');
        clearInterval(intervalId);
        if (data3['player1'].score == 5) {
            drawText2(data3['ctx'], getTextContentById('player1Name') + " Won",  data3['canvas'].width/6, data3['canvas'].height/2, "#333");
            drawText2(data3['ctx'], getTextContentById('player2Name') + " Lost",  data3['canvas'].width/1.5, data3['canvas'].height/2, "#333");
        } else {
            drawText2(data3['ctx'], getTextContentById('player1Name') + " Lost", data3['canvas'].width/6, data3['canvas'].height/2, '#1A1F33');
            drawText2(data3['ctx'], getTextContentById('player2Name') + " Won", data3['canvas'].width/1.5, data3['canvas'].height/2, '#1A1F33');
        }
        game_in_progress = false;
        updateScoresDisplay(data3['player1'].score, data3['player2'].score);
        data3['player2'].x = data3['canvas'].width - 10;
        data3['player2'].y = ( data3['canvas'].height - 100)/2;
        data3['player1'].x = 0;
        data3['player1'].y = ( data3['canvas'].height - 100)/2;
        // update1(data3);
        // render1(data3);

        displayWinnerModal(winner, player2);

        setTimeout(() => {
            if (isIntournament) {
                    onGameCompleted();
            } else {
                displayBtn('restart_btn');
            }
        }, 6000);
        return;
    } else if (terminate_game) {
        clearInterval(intervalId);
        game_in_progress = false;
        terminate_game = false;
        return;
    }
    update1(data3);
    render1(data3);
}

function start_local_game() {
    hideBtn('start_play_computer');
    hideBtn('restart_btn');
    displayBtn('quit_game');
    if (game_in_progress) return;

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

    game_color = (localStorage.getItem('theme') === 'light') ? '#1A1F33' : "WHITE";
    bdir = generateRandDir();
    data3['ball'] = {
        x : data3['canvas'].width/2,
        y : data3['canvas'].height/2,
        radius : 10,
        velocityX : bdir.x,
        velocityY : bdir.y,
        speed : 9,
        color : game_color
    };

    data3['player1'] = {
        x : 0,
        y : ( data3['canvas'].height - 100)/2,
        speedY : 0,
        width : 10,
        height : 60,
        score : 0,
        color : game_color
    }
    data3['player2'] = {
        x : data3['canvas'].width - 10,
        y : ( data3['canvas'].height - 100)/2,
        speedY : 0,
        width : 10,
        height : 60,
        score : 0,
        color : game_color
    }

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
    render1(data3);
    startCountdown() 
    hideBtn('quit_game');
    setTimeout (() => {
        intervalId = setInterval(function(){
            gameLoop1(data3);
        }, 1000/50);
        displayBtn('quit_game');
    }, 5000);
}


function goBack() {
    // terminate_game = false;
	// terminate_game = true;
	game_in_progress = false;
    // document.getElementById('tournament').style.display = 'block';
    history.back();
    clearInterval(intervalId);
}