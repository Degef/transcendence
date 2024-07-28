var data = {
	'playerId': null,
	'player': null,
	"paddleWidth": 10, 
	"paddleHeight": 60,
	'paddle_speed': 8,
	'paddle': {'speedY': 0},
	'endGame': false,
	'score': { 'player1': 0, 'player2': 0 },
	'waiting_to_play': false,
}

var data2 = null;
var game_in_progress = false;
var terminate_game = false;
var intervalId = null;
var type = "defaultGame";
let username = fetch('/get_current_user/').then(response => response.json());
let pusername = '';
let game_color = "WHITE";
let reloading = false;
let animationFrameId;



/**
 * Sends a message to the server through the provided WebSocket connection.
 *
 * @param {WebSocket} gsocket - The WebSocket connection to use for sending the message.
 * @param {Object} message - The message to send, which will be serialized to a JSON string.
 */
function send_message(gsocket, message) {
	if (gsocket && gsocket.readyState === WebSocket.OPEN) {
			gsocket.send(JSON.stringify(message));
	}
}


// draw a rectangle, will be used to draw paddles

function resetChallengeStatus(username) {
	if (type === 'challenge') {
		type = 'defaultGame';
		challenged_username = '';
		challenger_username = '';
		loadProfile(username);
	}
}


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
	data2.ctx.strokeStyle = game_color;
	data2.ctx.stroke();
}

// ###################################### VS Computer Game ####################################

function getMousePos(canvas, user) {
    return function(evt) {
        let rect = canvas.getBoundingClientRect();
        let zoom = parseFloat(document.documentElement.style.getPropertyValue('--page-zoom')) || 100;
        let zoomFactor = zoom / 100;
        user.y = (evt.clientY / zoomFactor) - rect.top - user.height / 2;
    }
}

function destroyAudioObjects(data) {
    if (data['hit']) {
        data['hit'].pause();
        data['hit'].src = "";
        data['hit'] = null;
    }

    if (data['wall']) {
        data['wall'].pause();
        data['wall'].src = "";
        data['wall'] = null;
    }

    if (data['userScore']) {
        data['userScore'].pause();
        data['userScore'].src = "";
        data['userScore'] = null;
    }

    if (data['comScore']) {
        data['comScore'].pause();
        data['comScore'].src = "";
        data['comScore'] = null;
    }
}



function resetallGamedata() {
	data['playerId'] = null;
	data['player'] = null;
	// data.endGame = false;
	data.p1_name = null;
	data.p2_name = null;
	if (data['canvas']) {
        data['canvas'] = null;
    }

    if (data['ctx']) {
        data['ctx'] = null;
    }
	data.gameState = null;
	destroyAudioObjects(data);
}


function resetBall(data2){
	randBallDir = generateRandDir();
	data2['ball'].x = data2['canvas'].width/2;
	data2['ball'].y = data2['canvas'].height/2;
	// data2['ball'].velocityX = generateRandDir();
	// data2['ball'].velocityY = generateRandDir();
	data2['ball'].velocityX = randBallDir.x;
	data2['ball'].velocityY = randBallDir.y;
	// data2['ball'].velocityX = 7;
	// data2['ball'].velocityY = 0;
	data2['ball'].speed = 7;
}

function drawText(ctx, text, x, y){
	if (localStorage.getItem('theme') === 'light') {
		ctx.fillStyle = "#444";
	} else {
		ctx.fillStyle = "#FFF";
	}
	ctx.font = "75px sans-serif";
	ctx.fillText(text, x, y);
}

function drawText2(ctx, text, x, y){
	if (localStorage.getItem('theme') === 'light') {
		ctx.fillStyle = "#444";
	} else {
		ctx.fillStyle = "#FFF";
	}
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
	if (data2['ball'].y + data2['ball'].radius < data2['canvas'].height && data2['ball'].y - data2['ball'].radius > 0) {
		data2['ball'].y += data2['ball'].velocityY;
	} else if (data2['ball'].y - data2['ball'].radius <= 0) {
		data2['ball'].velocityY = -data2['ball'].velocityY;
		data2['ball'].y += data2['ball'].velocityY;
	} 
	else {
		data2['ball'].velocityY = -data2['ball'].velocityY;
		data2['ball'].y += data2['ball'].velocityY;
	}

	// simple AI to control com paddle
	let computerLevel = 0.1;
	data2['com'].y += (data2['ball'].y - (data2['com'].y + data2['com'].height/2)) * computerLevel;

	let player = (data2['ball'].x < data2['canvas'].width/2) ? data2['user'] : data2['com'];

	if(collision(data2['ball'],player)){
		data2['hit'].play();
		let collidePoint = (data2['ball'].y - (player.y + player.height/2));
		collidePoint = collidePoint / (player.height/2);
		let angleRad = (Math.PI/4) * collidePoint;
		let direction = (data2['ball'].x < data2['canvas'].width/2) ? 1 : -1;
		data2['ball'].velocityX = direction * data2['ball'].speed * Math.cos(angleRad);
		data2['ball'].velocityY = data2['ball'].speed * Math.sin(angleRad);
		// data2['ball'].speed += 0.2;
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
	//  data2['user'].y = Math.max(0, Math.min(data2['canvas'].height, data2['user'].y));
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
	if (localStorage.getItem('theme') === 'light') {
		game_color = '#1A1F33';
	} else {
		game_color = "WHITE";
	}
	data2['ball'].color = game_color;
	data2['user'].color = game_color;
	data2['com'].color = game_color;

	if (data2['user'].score == 5 || data2['com'].score == 5) {
		clearInterval(intervalId);
		if (data2['user'].score == 5) {
			drawText2(data2['ctx'], "You Won",  data2['canvas'].width/6, data2['canvas'].height/2);
		} else {
			drawText2(data2['ctx'], "You Lost", data2['canvas'].width/6, data2['canvas'].height/2);
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
	} else {
		data2['ctx'].clearRect(0, 0, data2['canvas'].width, data2['canvas'].height);
	}
	data2['canvas'] = document.getElementById('gameCanvas');
	data2['ctx'] = data2['canvas'].getContext('2d');

	let game_color = "WHITE";
	if (localStorage.getItem('theme') === 'light') {
		game_color = '#1A1F33';
	}

	randBallDir = generateRandDir();
	data2['ball'] = {
		x : data2['canvas'].width/2,
		y : data2['canvas'].height/2,
		radius : 10,
		velocityX : randBallDir.x,
		velocityY : randBallDir.y,
		// velocityX : 7,
		// velocityY : 0,
		speed : 7,
		color : game_color
	};

	data2['user'] = {
		x : 0, // left side of canvas
		y : ( data2['canvas'].height - 100)/2, // -100 the height of paddle
		width : 10,
		height : 60,
		score : 0,
		color : game_color
	}
	data2['com'] = {
		x : data2['canvas'].width - 10, // - width of paddle
		y : ( data2['canvas'].height - 100)/2, // -100 the height of paddle
		width : 10,
		height : 60,
		score : 0,
		color : game_color
	}
	
	// canvas.addEventListener("mousemove", getMousePos);
	data2['canvas'].addEventListener("mousemove", getMousePos(data2['canvas'], data2['user']));
	intervalId = setInterval(function() {
		gameLoop(data2);
	}, 1000/50);
}

// ################### Online Game Logic ###################

function draw() {
	if (data['gameState']?.paddle1 != null && data['gameState']?.paddle2 != null && data.ctx && data.canvas) {
		const canvas = data['canvas'];
		const ctx = data['ctx'];
		const paddleWidth = data['paddleWidth'];
		const paddleHeight = data['paddleHeight'];
		const paddle1 = data['gameState']['paddle1'];
		const paddle2 = data['gameState']['paddle2'];
		const ball = data['gameState']['ball'];

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw the paddles
		let game_color = 'white';
		if (localStorage.getItem('theme') === 'light') {
			game_color = '#444';
		} 
		ctx.fillStyle = game_color;
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
		ctx.strokeStyle = game_color;
		ctx.stroke();

		//update score

		drawText(ctx, data['gameState']['score1'], canvas.width / 4, canvas.height / 5);
		drawText(ctx, data['gameState']['score2'], 3 * canvas.width / 4, canvas.height / 5);
	}
}

function main_loop () {
	if (data['gameState']?.collision.paddle && data['hit']) {
		data['hit'].play();
	}
	if (data['gameState']?.collision.goal && data['comScore']) {
		data['comScore'].play();
	}
	if (data['gameState']?.collision.wall && data['wall']) {
		data['wall'].play();
	}

	// data.paddle.y += data.paddle.speedY;
	// // Keep paddles within the canvas
	// data.paddle.y = Math.max(0, Math.min(data.canvas.height - data.paddleHeight, data.paddle.y));

	if (data.canvas) {
        data.paddle.y += data.paddle.speedY;
        data.paddle.y = Math.max(0, Math.min(data.canvas.height - data.paddleHeight, data.paddle.y));
    }
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
		if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
		return
	}
	if (terminate_game) {
		// This condition is handling when user presses any button while game is in progress
		// First we need to stop the game task created in the server, that is what endGame1 will do
		// Then we wait 1 second to make sure the task is stopped and then we close the socket
		otherPlayer = pusername === data.p1_name ? data.p2_name: data.p1_name;
		mes = {
			'type': 'endGame1',
			'playerId': data['playerId'],
			'winner': otherPlayer
		}
		send_message(data['socket'], mes);

		// wait one second
		setTimeout(function() {
			terminate_game = false;
			closeGameSocket();
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
			return;
		}, 1000);
	}
	send_message(data['socket'], message);
	animationFrameId = requestAnimationFrame(main_loop);
}

function setPlayer(rec) {
	if (data['player'] == null) {
		if (rec['gameState']['player1'] == data['playerId']) {
			data['player'] = 1;
		} else {
			data['player'] = 2;
		}

		const canvasContainer = document.querySelector('.canvas_container');
		// const waitLoadDiv = canvasContainer.querySelector('#wait_load');

		// if (waitLoadDiv) { // Remove the wait_load div if it exists
		// 	canvasContainer.removeChild(waitLoadDiv);
		// 	document.getElementById('end_game').innerHTML = "";
		// }
		startCountdown();

		data['canvas'] = document.getElementById('gameCanvas');
		if (data['canvas']) {
			data['ctx'] = data['canvas'].getContext('2d');
		} else {
			return ;
		}

		
		if (data['player'] == 1) {
			data['paddle'] = { x: 0, y: data['canvas'].height / 2 - data['paddleHeight'] / 2, speedY: 0, height: data['paddleHeight'] };
		} else if (data['player'] == 2) {
			data['paddle'] = { x: data['canvas'].width - data['paddleWidth'], y: data['canvas'].height / 2 - data['paddleHeight'] / 2, speedY: 0, height: data['paddleHeight'] };
		}

		data['canvas'].addEventListener('mousemove', getMousePos(data['canvas'], data['paddle']));
		
		const message = {
			'type': 'startGame',
			'playerId': data['playerId'],
			'paddle': data['paddle'],
			'player': data['player'],
		};
		setTimeout(() => {
			if (game_in_progress) {
				data['socket'].send(JSON.stringify(message));
				data.waiting_to_play = false;
				main_loop();
			}
		}, 5000);
	}
}


function start_play_online_challenge(challenged_username, challenger_username, username) {
	hideBtn('play_again');
	data.waiting_to_play = true;
	if (game_in_progress) {
		return;
	}
	game_in_progress = true;

	const socket = new WebSocket(`wss://${window.location.host}/ws/game/`);

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
		// console.log('WebSocket connection established');
	}
	type = (challenged_username === '' || challenger_username === '') ? "defaultGame"  : "challenge";
	if (isOnlineTournament) {
		type = "tournament";
	}

	socket.onmessage = function (event) {
		const rec = JSON.parse(event.data);
		if (rec['type'] == 'playerId') {
			data['playerId'] = rec['playerId'];
			username = rec.username;
			pusername = rec.username
			hideBtn('start_game_btn');
			showSpinner("WAITING FOR OTHER PLAYER TO JOIN");
			const message = {
				'type': type,
				'challengee': challenged_username,
				'challenger': challenger_username,
				't_id': tourId,
				'round': gameRound,
				'side': gameSide,
				'g_num': gameNum
			};
			send_message(data['socket'], message);
		} else if (rec['type'] === 'pnames') {
			hideSpinner();
			data.waiting_to_play = false;
			data['p1_name'] = rec.p1_name;
			data['p2_name'] = rec.p2_name;
			changePlayerNames(rec.p1_name, rec.p2_name);
		} else if (rec['type'] == 'gameState') {
			if (data.waiting_to_play) {
				data.waiting_to_play = false;
			}
			data['gameState'] = rec['gameState'];
			setPlayer(rec);
		} else if (rec['type'] == 'gameEnd') {
			if (username === rec.winner) {
				displayWinM();
			} else {
				displayLoserModal();
			}
			data['endGame'] = true;
			data['playerId'] = null;
			data['player'] = null;
			const message = {
				'type': 'endGame',
				'playerId': data['playerId'],
			};
			if (rec.message.includes("has left the game")) {
				data['endGame'] = false;
				if (animationFrameId !== null) {
					cancelAnimationFrame(animationFrameId);
					animationFrameId = null;
				}
				// type = 'defaultGame';
			}
			send_message(data['socket'], message);
			closeGameSocket();
			if (isOnlineTournament) {
				let s1 = rec['player1'] === rec.winner ? 4: rec['score1'];
				let s2 = rec['player2'] === rec.winner ? 4: rec['score2'];
				onTourGameCompleted(rec['player1'], rec['player2'],s1, s2);
			} else if (type != 'challenge') {
				displayBtn('play_again');
			}
		} else if (rec['type'] === 'noPlayerFound') {
			hideSpinner();
		}
	}

	socket.onclose = function () {
		data['playerId'] = null;
		data['player'] = null;
		hideSpinner();
		resetallGamedata(data);
		setTimeout(() => {
			if (type === 'challenge') {
				resetChallengeStatus(username);
			} else {
				// handleRoute('/');
			}
		}, 5000);
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


/**
 * Cleans up and closes the WebSocket connection for the ongoing game.
 * This function handles the cleanup process when a game ends or when the WebSocket connection needs to be closed.
 * It includes setting game progress flags, sending a message to notify about the end of the game, and closing the WebSocket connection.
 * 
 * The cleanup process includes:
 * - Stopping game progress.
 * - Sending a message to the server with the game result.
 * - Closing the WebSocket connection if it is open.
 * - Resetting relevant game and player data.
 */
function cleanup() {
	if (data.socket) {
		game_in_progress = false;
		data.socket.onclose = null; // Prevent onclose from being called again
		otherPlayer = pusername === data.p1_name ? data.p2_name: data.p1_name;
		mes = {
			'type': 'endGame1',
			'playerId': data.playerId,
			'winner': otherPlayer
		}
		// data.socket.send(JSON.stringify(mes));
		send_message(data.socket, mes);
		if (data.socket.readyState === WebSocket.OPEN) {
			hideSpinner();
			data.playerId = null;
			data.player = null;
			challenged_username = '';
			challenger_username = '';
			type = 'defaultGame';
			resetallGamedata(data);
			setTimeout(function() {
				terminate_game = false;
				data.socket.close();
				data.player = null;
			}, 1000);
			return;
		}
	}
	game_in_progress = false;
	data.playerId = null;
	data.player = null;
}

// Handle back/forward navigation
window.addEventListener('popstate', () => {
	handleDeclineOnUnload(respondChallenge);
	if (game_in_progress) {
		cleanup();
	}
});

function isNameEmpty(name) {
	return !name;
}

function isNameTooLong(name) {
	return name.length > 14;
}

function containsSpaces(name) {
	return /\s/.test(name);
}

function startOrEndsWithQuote(name) {
	return name.startsWith("'") || name.endsWith("'");
}

function containsInvalidQuotes(name) {
	return /["]/.test(name) || /''/.test(name) || /^'|'$/.test(name) || /'"/.test(name) || /"'/.test(name);
}

function isValidName(name) {
	return !isNameEmpty(name) && !containsSpaces(name) && !startOrEndsWithQuote(name) && !containsInvalidQuotes(name) && !isNameTooLong(name);
}

function isSame(name1, name2) {
	return name1 === name2;
}


/**
 * Updates the displayed names of the two players.
 * This function sets the text content of the HTML elements that display the names of the players to the provided player names.
 * 
 * @param {string} player1 - The name to be displayed for player 1.
 * @param {string} player2 - The name to be displayed for player 2.
 */
function changePlayerNames(player1, player2) {
	const player1NameDiv = document.getElementById('player1Name');
	const player2NameDiv = document.getElementById('player2Name');

	if (player1NameDiv) {
		player1NameDiv.textContent = player1;
	}
	if (player2NameDiv) {
		player2NameDiv.textContent = player2;
	}
}


/**
 * Initializes the player name customization dialog and handles name updates.
 * This function sets up and displays the customization dialog. It processes the player's input 
 * for names, performs validation, and updates the UI based on input validity. 
 * 
 * - Displays the customization dialog and form.
 * - Listens for form submission to save and validate player names.
 * - Provides real-time validation feedback for name inputs.
 * 
 * Internal Functions:
 * - `validateInput(currentInput, otherInput)`: Validates the input names and provides feedback.
 * - `updateFeedback(input, isInvalid, message)`: Updates the visual feedback for the input field.
 * - `showNotification(input, message)`: Displays a notification for invalid inputs.
 * - `hideNotification(input)`: Hides the notification for valid inputs.
 * 
 */
function cutomizePlayerName() {
	const customizeDialog = document.getElementById('customizeDialog');
	const customizeForm = document.getElementById('customizeForm');
	const player1NameDiv = document.getElementById('player1Name');
	const player2NameDiv = document.getElementById('player2Name');
  
	customizeDialog.style.display = 'flex';
	customizeDialog.style.display = 'none';
	customizeForm.style.display = 'flex';
  
	document.getElementById('saveButton').addEventListener('click', (event) => {
		event.preventDefault();
		const player1Name = document.getElementById('player1Input').value;
		const player2Name = document.getElementById('player2Input').value;

		if (!isValidName(player1Name) || !isValidName(player2Name) || isSame(player1Name, player2Name)) {
			return;
		}
		player1NameDiv.textContent = player1Name;
		player2NameDiv.textContent = player2Name;

		customizeForm.style.display = 'none';
	});

	const player1Input = document.getElementById('player1Input');
	const player2Input = document.getElementById('player2Input');
	player1Input.addEventListener('input', () => validateInput(player1Input, player2Input));
	player2Input.addEventListener('input', () => validateInput(player2Input, player1Input));

	function validateInput(currentInput, otherInput) {
		const currentName = currentInput.value.trim().toLowerCase();
		const otherName = otherInput.value.trim().toLowerCase();

		let message = '';
		let isInvalid = false;

		if (isNameEmpty(currentName)) {
			message = "Player name can't be empty";
			isInvalid = true;
		} else if (containsSpaces(currentName) || startOrEndsWithQuote(currentName) || containsInvalidQuotes(currentName)) {
			message = "Invalid Player Name";
			isInvalid = true;
		} else if (isNameTooLong(currentName)) {
			message = "Player name too long";
			isInvalid = true;
		} else if (currentName && otherName && isSame(currentName, otherName)) {
			message = 'Player names must be different';
			isInvalid = true;
		} 
		updateFeedback(currentInput, isInvalid, message);
		if (isValidName(otherName) &&  !isSame(otherName, currentName)) {
			updateFeedback(otherInput, false, "");
		}
	}

	function updateFeedback(input, isInvalid, message) {
		const feedback = input.nextElementSibling;
		if (isInvalid) {
			feedback.textContent = '✘';
			feedback.classList.remove('valid');
			feedback.classList.add('invalid');
			showNotification(input, message);
		} else {
			feedback.textContent = '✔';
			feedback.classList.remove('invalid');
			feedback.classList.add('valid');
			hideNotification(input);
		}
	}

	function showNotification(input, message) {
		let notification = input.nextElementSibling.nextElementSibling; // Get the notification box
		if (notification && notification.classList.contains('notification')) {
			notification.textContent = message || 'Error';
		} else {
			notification = document.createElement('div');
			notification.className = 'notification';
			notification.textContent = message || 'Error';
			input.parentNode.insertBefore(notification, input.nextElementSibling.nextElementSibling);
		}
	}
	
	function hideNotification(input) {
		const notification = input.nextElementSibling.nextElementSibling; // Get the notification box
		if (notification && notification.classList.contains('notification')) {
			notification.textContent = ''; // Clear the notification message
		}
	}
}

/**
 * Hides the player name customization dialog.
 */
function hidePnameForm() {
	const customizeDialog = document.getElementById('customizeDialog');
	customizeDialog.style.display = 'none';
}


/**
 * Starts a countdown sequence that displays a countdown from 3 to "START" on the screen.
 * After the countdown reaches 0, it fades out and is removed from the DOM.
 */
function startCountdown() {
	var counter = 3;
  
	var timer = setInterval(function () {
		var countdownElement = document.getElementById('countdown');
		if (countdownElement) {
			countdownElement.remove();
		}
  
		var countdown = document.createElement('span');
		countdown.id = 'countdown';
		countdown.textContent = (counter === 0 ? "START" : counter);

		if (counter === 0) {
			setTimeout(function () {
				countdown.style.transition = "opacity 1s ease-out";
				countdown.style.opacity = 0;
				setTimeout(function () {
					countdown.remove();
				}, 1000); // Wait for transition to complete before removing
			}, 2000); // Wait 2 seconds before starting the fade-out
		}
  
		var canvas = document.getElementById('gameCanvas');
		if (canvas) {
			var container = canvas.parentNode; // Get the parent of the canvas
			if (container) {
				container.appendChild(countdown);
			}
		}
  
		setTimeout(function () {
			if (counter > -1) {
				countdown.style.fontSize = "40vw";
				countdown.style.opacity = 0;
			} else {
				countdown.style.fontSize = "10vw";
				countdown.style.opacity = 0.7;
			}
	  	}, 20);
  
	  	counter--;
		if (counter === -1) clearInterval(timer);
	}, 1000);
}



/**
 * Event listener for the 'beforeunload' event, triggered when the user is about to leave the page on reload
 * This function handles cleanup tasks to ensure proper disconnection from the game or tournament.
 * 
 * @param {Event} event - The event object for the 'beforeunload' event.
 */
window.addEventListener('beforeunload', function(event) {
	reloading = true;
	handleDeclineOnUnload(respondChallenge);
	if (window.game_in_progress) {
		destroyOpenWebsocket();
	} else if (isOnlineTournament) {
		// leaveTournament();
		cleanuptour();
	}
});
  