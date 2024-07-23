var isOnlineTrounament = false;
let match_room = null;
let onlineTourSocket = null;
let matchupElement = null;
let updatedMatchup = null;
let winner = null;
let invitationTimeoutId = null;
let	tourGame = false;
let isLoser = false;
let tourId = null;
let gameNum = null;
let gameSide = null;
let gameRound = null;
// let username = null;


/**
 * Extracts player names from a given matchup element.
 * This function takes a DOM element representing a matchup and retrieves the player names from the top and bottom teams. 
 * If the player names are non-empty, they are added to the result array.
 *
 * @param {HTMLElement} updatedMatchup - The DOM element containing the matchup information.
 * @returns {string[]} An array of player names from the matchup.
 */

function getPlayerNamesFromMatchup(updatedMatchup) {
	// Assuming updatedMatchup is a DOM element
	let result = [];
	const teamTopPlayerName = updatedMatchup.querySelector(".team-top .player-name").textContent.trim();
	const teamBottomPlayerName = updatedMatchup.querySelector(".team-bottom .player-name").textContent.trim();
	if (teamTopPlayerName.length > 0) {
		result.push(teamTopPlayerName);
	}
	if (teamBottomPlayerName.length > 0) {
		result.push(teamBottomPlayerName);
	}
	return result;
}


/**
 * Handles the completion of a tournament game.
 * Updates the matchup element, determines the winner, and sends the match result.
 *
 * @param {string} player1 - The username of player 1.
 * @param {string} player2 - The username of player 2.
 * @param {number} score1 - The score of player 1.
 * @param {number} score2 - The score of player 2.
 * @return {void}
 */

function onTourGameCompleted(player1, player2, score1, score2) {
	let p1, p2, s1, s2;

	if (matchupElement) {
		var teamTop = matchupElement.querySelector('.team-top');
		var teamBottom = matchupElement.querySelector('.team-bottom');
		
		if (teamTop && teamBottom) {
			var teamTopPlayer = teamTop.querySelector('.player-name').innerText.trim();
			var teamBottomPlayer = teamBottom.querySelector('.player-name').innerText.trim();
		}
		if (teamTopPlayer === player1) {
			p1 = player1; p2 = player2; s1 = score1; s2 = score2;
		}
		else if (teamBottomPlayer === player1) {
			p1 = player2; p2 = player1; s1 = score2; s2 = score1;
		}
	}
	winner = s1 > s2 ? p1 : p2;

	if (tournamentSection && tournamentSection.parentNode) {
		tournamentSection.parentNode.removeChild(tournamentSection);
	}
	// Restore the original body content
	if (mainSection && mainSection.style) {
		mainSection.style.display = 'block';
	}
	const message = {
		'type': 'match_result',
		'player1': p1,
		'player2': p2,
		'score1': s1,
		'score2': s2,
		'matchelement': matchupElement,
		'winner': winner
	};
	if (username === winner) {
		tourGame = true;
		send_message(onlineTourSocket, message)
	} else {
		isLoser = true;
	}
}

/**
 * Sends a message to save the game data to the server.
 *
 * @param {string} player1 - The username of player 1.
 * @param {string} player2 - The username of player 2.
 * @param {number} score1 - The score of player 1.
 * @param {number} score2 - The score of player 2.
 */
function sendSaveGame(player1, player2, score1, score2) {
	var matchups = document.querySelectorAll('#bracket .matchup');
	matchupElement = findMatchup(player1, player2, matchups);
	mInfo = extractGameInfo(matchupElement);
	gameNum = mInfo.gameNumtmp
	gameRound = mInfo.gameRoundtmp
	gameSide = mInfo.gameSideTmp
	const message = {
		'type': 'save_game',
		'player1': player1,
		'player2': player2,
		'score1': score1,
		'score2': score2,
		't_id': tourId,
		'round': gameRound,
		'side': gameSide,
		'g_num':gameNum	
	};
	console.log(message);
	send_message(onlineTourSocket, message);
}


/**
 * Displays the game section by replacing the main section content with the tournament section.
 *
 * @param {Object} event - The event object containing the HTML data.
 */
function display_game(event) {
	const mainContainer = document.getElementById('main-container');
	mainSection = document.querySelector('.main-section');
	const parser = new DOMParser();
	const parsedHtml = parser.parseFromString(event.html, 'text/html');
	tournamentSection = parsedHtml.getElementById('tournament');

	mainSection.style.display = 'none';
	mainContainer.appendChild(tournamentSection);
}


/**
 * Finds a specific matchup element based on the given player names. This function iterates through a 
 * list of matchup elements and checks if either team in the matchup contains the given challenger and challenged player names. 
 * If a matchup is found, it returns the corresponding DOM element.
 *
 * @param {string} challenger - The name of the challenger player or first player.
 * @param {string} challenged - The name of the challenged player or second player.
 * @param {HTMLElement[]} matchups - An array of DOM elements representing the matchups.
 * @returns {HTMLElement|null} The DOM element representing the found matchup, or null if no matchup is found.
 */
function findMatchup(challenger, challenged, matchups) {
  for (var i = 0; i < matchups.length; i++) {
	var teams = matchups[i].querySelectorAll('.team');
	
	if (teams.length == 2) {
	  var teamTopPlayer = teams[0].querySelector('.player-name').innerText.trim();
	  var teamBottomPlayer = teams[1].querySelector('.player-name').innerText.trim();
	  
	  if ((teamTopPlayer == challenger && teamBottomPlayer == challenged) || 
		  (teamTopPlayer == challenged && teamBottomPlayer == challenger)) {
		return matchups[i];
	  }
	}
  }
  
  return null; // No matchup found
}



/**
 * Asynchronously loads a tournament game between two players and updates the main container with the game content.
 * This function hides the main section, makes a POST request to the backend to fetch the game page for the given players, and replaces 
 * the current main container content with the fetched game content. It also removes certain buttons from the fetched content to make the 
 * game suitable for tournament and handles online tournament state.
 *
 * @param {string} player1 - The name of the first player.
 * @param {string} player2 - The name of the second player.
 */
async function loadTrounametGame(player1,  player2) {
	mainSection = document.querySelector('.main-section');
	const mainContainer = document.getElementById('main-container');
	mainSection.style.display = 'none';
	
	const csrftoken = getCookie('csrftoken');

	try {
		// Make a request to the backend to get the local game page
		const response = await fetch('/play_online/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrftoken
			},
			body: JSON.stringify({ player1, player2})
		});
		const html = await response.text();
		isIntournament = true;

		const parser = new DOMParser();
		const parsedHtml = parser.parseFromString(html, 'text/html');
		tournamentSection = parsedHtml.getElementById('tournament');
		const restartButton = parsedHtml.getElementById('restart_btn');
		const quitButton = parsedHtml.getElementById('quit_game');

		if (restartButton && restartButton.parentNode) {
			restartButton.parentNode.removeChild(restartButton);
		}

		if (quitButton && quitButton.parentNode) {
			quitButton.parentNode.removeChild(quitButton);
		}

		mainContainer.appendChild(tournamentSection);
		displayMatchModal(player1, player2);
		if (!isOnlineTrounament) {
			isOnlineTrounament = false;
			tourId = null; gameNum = null; gameRound = null; gameSide = null;
			handleRoute('/', true);
			return ;
		}
	} catch (error) {
		alert('Error fetching local game page:', error);
	}
}


/**
 * Removes a child element from the document by its ID.
 * If the element with the specified ID is found, it is removed from its parent node.
 *
 * @param {string} elementId - The ID of the element to be removed.
 * @return {void}
 */
function removeChildById(elementId) {
	const element = document.getElementById(elementId);
	if (element) {
		element.parentNode.removeChild(element);
		console.log(`Element with ID ${elementId} has been removed.`);
	}
}


/**
 * Displays a modal inviting the user to join a tournament match/game.
 *
 * @param {string} matchRoom - The match room identifier.
 * @param {string} opponent - The opponent's name.
 * @param {Array} players - An array containing the names of the challenger and challenged players.
 */
function displayMatchInvitation(matchRoom, opponent, players) {

	match_room = matchRoom;
	if (!isOnlineTrounament) {
		return ;
	}
	const modal = document.createElement('div');
	mainSection = document.querySelector('.main-section');
	modal.id = 'match-invitation-modal';
	modal.style.zIndex = '1000';
	modal.setAttribute('tabindex', '-1');

	const modalContent = document.createElement('div');
	modalContent.style.backgroundColor = 'black';
	modalContent.style.padding = '20px';
	modalContent.style.borderRadius = '5px';
	modalContent.style.textAlign = 'center';

	const modalMessage = document.createElement('p');
	modalMessage.textContent = `You are invited to join the game room to play with ${opponent}`;

	challenger_username = players[0];
	challenged_username = players[1];
	// Get all matchups
	var matchups = document.querySelectorAll('#bracket .matchup');
	matchupElement = findMatchup(challenger_username, challenged_username, matchups);
	mInfo = extractGameInfo(matchupElement);
	gameNum = mInfo.gameNumtmp
	gameRound = mInfo.gameRoundtmp
	gameSide = mInfo.gameSideTmp

	const confirmButton = document.createElement('button');
	confirmButton.textContent = 'Join Game';

	confirmButton.onclick = function() {
		removeChildById("match-invitation-modal");
		loadTrounametGame(challenger_username, challenged_username);
		// setTimeout(() => {
		// 	start_play_online_challenge(challenger_username, challenged_username);
		// }, 4000);
	};

	modalContent.appendChild(modalMessage);
	modalContent.appendChild(confirmButton);
	modal.appendChild(modalContent);
	document.body.appendChild(modal);
}


/**
 * Handles the logic for progressing to the next round of the tournament.
 *
 * @param {Object} res - The response object containing information about the match result.
 * @param {string} res.winner - The username of the winner.
 */

function getNextRoundMatch(res) {
	if (!isOnlineTrounament) {
		// displayWinnerModal(winner, winner);
		onlineTourSocket.close();
		return ;
	}
	if (username !== res['winner']) {
		return ;
	}
	var playernames = getPlayerNamesFromMatchup(updatedMatchup);
	if (playernames.includes(winner) && playernames.length === 2) {
		const opponent = res['winner'] === playernames[0] ? playernames[1]: playernames[0];
		const message = {
			'type': 'next_round_match',
			'player': winner,
			'player1': playernames[0],
			'player2': playernames[1],
			'opponent': opponent,
			'plcount': 2
		};
		// onlineTourSocket.send(JSON.stringify(message));
		send_message(onlineTourSocket, message);
	}
	if (playernames.includes(winner) && playernames.length === 1) {
		const message = {
			'type': 'next_round_match',
			'player': winner,
			'player1': playernames[0],
			'plcount': 1
		};
		// onlineTourSocket.send(JSON.stringify(message));
		send_message(onlineTourSocket, message);
	}
}

/**
 * Updates the tournament bracket with the provided match result.
 * If the main section is visible, it updates the scores and advances to the next round.
 * If the main section is not visible, it sets an observer to update the bracket when it becomes visible.
 *
 * @param {Object} res - The response object containing match result details.
 * @return {void}
 */
function update_bracket(res) {

	if (mainSection.style.display === 'block') {
		var matchups = document.querySelectorAll('#bracket .matchup');
		matchupElement = findMatchup(res.player1, res.player2, matchups);
		updateScores(matchupElement, res.score1, res.score2);
		tourGame = false;
		mainSection = document.querySelector('.main-section');
		getNextRoundMatch(res);
		// if (res.player1 === username || res.playe2 === username) {
		// 	tourGame = false;
		// }
		// updateBracket(res.melement, res.player1, res.player2, res.score1, res.score2);
	} else {
		// Set an observer to update the bracket when it becomes visible
		const observer = new MutationObserver((mutationsList, observer) => {
			for (const mutation of mutationsList) {
				if (mutation.attributeName === 'style' && mainSection.style.display === 'block') {
					// updateBracket(res.melement, res.player1, res.player2, res.score1, res.score2);
					var matchups = document.querySelectorAll('#bracket .matchup');
					matchupElement = findMatchup(res.player1, res.player2, matchups);
					updateScores(matchupElement, res.score1, res.score2);
					tourGame = false;
					observer.disconnect();
					getNextRoundMatch(res);
					// if (res.player1 === username || res.playe2 === username) {
					// 	tourGame = false;
					// }
					break;
				}
			}
		});

		observer.observe(mainSection, { attributes: true });
	}

}

/**
 * Updates the bracket display section of the tournament page with the received HTML content.
 * Parses the provided HTML string, extracts the new bracket content, and replaces the existing
 * bracket content in the '.main-section' element. If the tournament size is 4, it calls a 
 * function to change the round style.
 *
 * @param {Object} res - The response object containing the HTML content.
 * @param {number} tourSize - The size of the tournament.
 * @return {void}
 */

function displayBracket(res, tourSize) {
	const parser = new DOMParser();
	const parsedHtml = parser.parseFromString(res.html, 'text/html');
	
	
	// Extract the new content to replace the details-section   
	const newContent = parsedHtml.getElementById('bracket');
	if (newContent) {
		const detailsSection = document.querySelector('.main-section');
		if (detailsSection) {
			detailsSection.innerHTML = newContent.outerHTML;
			if (tourSize == 4) {
				changeRoundStyle();
			}
		} else {
			console.error('details-section not found in the current document');
		}
	} else {
		console.error('details-section not found in the received HTML content');
	}
	isOnlineTrounament = true;
}



function onlineTournament(tourSize) {

	const socket = new WebSocket(`wss://${window.location.host}/ws/tournament/`);

	socket.onopen = function() {
		console.log('WebSocket connection established.');
		sendMessage('join_tournament', tourSize);
		isOnlineTrounament = true;
	};

	onlineTourSocket = socket;
	socket.onmessage = function(e) {
		let res = JSON.parse(e.data);

		if (res['type'] == 'playerId') {
			data['playerId'] = res['playerId'];
			showSpinner("WAITING FOR OTHER PLAYER TO JOIN ONLINE TOURNAMENT");
		} else if (res.type === 'html_content') {
			hideSpinner();
			displayBracket(res, tourSize);
		} else if (res.type === 'game_start') {
			matchName = data.match_name;
			player1 = res.player1;
			player2 = res.player2;
			displayBtn('start_game_btn')
		} else if (res.type === 'match_invitation') {
			username = res.player;
			match_room = res.match_room;
			tourGame = false;
			tourId= res.tour_id;
			console.log(res);
			console.log("tour_id : ", tourId);
			challenger_username = res.players[0];
			challenged_username = res.players[1];
			scheduleMatchInvitation(res);
			// setTimeout(() => {
			//     displayMatchInvitation(res.match_room, res.opponent,  res.players);
			// }, 10000);
		} else if (res.type === 'update_bracket') {
			console.log('Update_bracket:', res);
			hideSpinner();
			update_bracket(res);
		} else if (res.type === 'opponent_left') {
			hideSpinner();
			showSpinner("Opps it seems like your opponenet has been left the tournament");
			closeGameSocket();
			abortMatchInvitation(res);
			removeChildById('match-invitation-modal');
			console.log(res);
		} 
	}
	


	socket.onclose = function(event) {
		hideSpinner();
		console.log('WebSocket connection closed:', event);
		// history.back();
	};
	
	// Send messages to the server
	function sendMessage(type, tourSize) {
		const message = { type: type, psize: tourSize };
		console.log("sending messgesage to server");
		console.log(type);
		socket.send(JSON.stringify(message));
	}

}

/**
 * Cleans up the online tournament by closing the WebSocket connection and resetting relevant game data.
 * If a tour game is active, it waits for 7 seconds before sending the 'leaving' message and closing the connection.
 *
 * @return {void}
 */
function cleanuptour() {
	if (onlineTourSocket) {
		isOnlineTrounament = false;
		tourId = null; gameNum = null; gameRound = null; gameSide = null;
		onlineTourSocket.onclose = null;
		console.log("Websocket tournament Closed because of popstate");
		if (tourGame) {
			setTimeout ( () => {
				leaveTournament();
				tourGame = false;
			}, 7000);
		} else {
			leaveTournament();
		}
	}
	game_in_progress = false;
	data.playerId = null;
	data.player = null;
}

// Handle back/forward navigation
window.addEventListener('popstate', () => {
	console.log("here-here-here", isOnlineTrounament);
	if (isOnlineTrounament) {
		cleanuptour();
	}
});



/**
 * Schedules the display of the match invitation after a specified delay.
 * If there is a previously scheduled invitation, it will be canceled.
 *
 * @param {Object} res - The response object containing match invitation details.
 * @return {void}
 */
function scheduleMatchInvitation(res) {
	if (invitationTimeoutId !== null) {
		clearTimeout(invitationTimeoutId);
	}
	invitationTimeoutId = setTimeout(() => {
		displayMatchInvitation(res.match_room, res.opponent, res.players);
	}, 5000);
}


/**
 * Aborts the scheduled match invitation if it exists.
 * Clears the timeout and resets the timeout ID to null.
 *
 * @param {Object} res - The response object containing match invitation details.
 * @return {void}
 */
function abortMatchInvitation(res) {
	var matchups = document.querySelectorAll('#bracket .matchup');
	matchupElement = findMatchup(challenger_username, challenged_username, matchups);
	mainSection = document.querySelector('.main-section');
	if (matchupElement) {
		console.log('Matchup found2:', matchupElement);
	} else {
		console.log('No matchup2 found for the given players.');
	}
	if (window.game_in_progress) {
		destroyOpenWebsocket();
	}
	if (invitationTimeoutId !== null) {
		clearTimeout(invitationTimeoutId);
		invitationTimeoutId = null;
		// if (!tourGame) {
		// 	setTimeout (() => {
		// 		console.log("res; ", res);
		// 		var matchups = document.querySelectorAll('#bracket .matchup');
		// 		matchupElement = findMatchup(res.player, res.opponent, matchups);
		// 		sendSaveGame(res.player, res.opponent, 0, 4);
		// 		onTourGameCompleted(res.player, res.opponent, 0, 4);
		// 	}, 10000); 
		// }
	}
	console.log('tourGame_beforeAbort', tourGame);
	if (!tourGame) {
		setTimeout (() => {
			console.log("res; ", res);
			var matchups = document.querySelectorAll('#bracket .matchup');
			matchupElement = findMatchup(res.player, res.opponent, matchups);
			sendSaveGame(res.player, res.opponent, 0, 4);
			onTourGameCompleted(res.player, res.opponent, 0, 4);
		}, 10000); 
	}
}


/**
 * Checks if the current match element has updated scores.
 *
 * @param {HTMLElement} matchElement - The current match element to check.
 * @return {boolean} - Returns true if the scores are updated, false otherwise.
 */
function hasUpdatedScores(matchElement) {
	
	const score1 = matchElement.querySelector('.score1');
	const score2 = matchElement.querySelector('.score2');
	if (!score1 || !score2)
		return false;
	
	return !isNaN(score1.innerText.trim()) && !isNaN(score2.innerText.trim());
}



/**
 * Checks if the current username is present in the match element.
 *
 * @param {HTMLElement} matchElement - The HTML element representing the match.
 * @param {string} username - The username to search for.
 * @return {boolean} - Returns true if the username is found in the match element, false otherwise.
 */
function isUsernameInMatch(matchElement, username) {
	if (!matchElement || !username) {
		return false; 
	}

	// Example: Check if username is in player names
	const player1Name = matchElement.querySelector('.player1-name');
	const player2Name = matchElement.querySelector('.player2-name');

	if (player1Name && player1Name.innerText.trim() === username) {
		return true;
	}

	if (player2Name && player2Name.innerText.trim() === username) {
		return true;
	}

	// Example: Check if username is in player IDs (assuming data attributes)
	const player1Id = matchElement.getAttribute('data-player1-id');
	const player2Id = matchElement.getAttribute('data-player2-id');

	if (player1Id === username) {
		return true;
	}

	if (player2Id === username) {
		return true;
	}

	return false;
}




/**
 * Sends a 'leaving' message through the online tournament WebSocket and handles closing the connection.
 *
 * @return {void}
 */
function leaveTournament() {
	const message = {
		'type': 'leaving',
		'player': username,
		'match_name': match_room
	};
	if (invitationTimeoutId !== null) {
		clearTimeout(invitationTimeoutId);
		console.log('Scheduled match invitation aborted', tourGame);
		invitationTimeoutId = null;
	}
	removeChildById('match-invitation-modal');
	
	console.log("tourGame: ", tourGame);
	console.log("msg1: ", message);

	if (onlineTourSocket && onlineTourSocket.readyState === WebSocket.OPEN) {
		if (!isLoser) {
			try { 
				onlineTourSocket.send(JSON.stringify(message));
			} catch (error) {
				console.error('Error sending message through WebSocket:', error);
			}
		}
		hideSpinner();
		isOnlineTrounament = false;
		tourId = null; gameNum = null; gameRound = null; gameSide = null;
		setTimeout(() => {
			if (onlineTourSocket && onlineTourSocket.readyState === WebSocket.OPEN) {
				onlineTourSocket.close();
			}
		}, 1000);
	}
}

/**
 * Closes the game WebSocket connection specified in the data object.
 * If the WebSocket connection is open, it attempts to close it.
 * Logs relevant messages based on the state of the WebSocket.
 *
 * @return {void}
 */
function closeGameSocket() {
	const gameSocket = data['socket'];
	if (gameSocket && gameSocket.readyState === WebSocket.OPEN && game_in_progress) {
		try {
			gameSocket.close();
		} catch (error) {
			console.error('Error closing WebSocket connection:', error);
		}
	}
	game_in_progress = false;
	data.playerId = null;
	data.player = null;
}




/**
 * Extracts game information from the match element.
 * Determines the round, side, and game number based on the match element and its surrounding structure.
 *
 * @param {HTMLElement} matchElement - The HTML element representing the match.
 * @returns {Object} An object containing gameRound, gameSide, and gameNum.
 */

function extractGameInfo(matchElement) {
	let gameRoundtmp = null;
	let gameSideTmp = null;
	let gameNumtmp = null;

	const roundElement = matchElement.closest('.round') || matchElement.closest('.final');
	if (roundElement) {
		const roundDetails = roundElement.querySelector('.round-details').innerText.trim();
		if (roundDetails.includes('Final')) {
			gameRoundtmp = 'final';
		} 
		else if (roundDetails.includes('Round')) {
			const roundNumber = parseInt(roundDetails.replace('Round ', ''), 10);
			if (roundNumber === 1) {
				gameRoundtmp = 'one';
			} else if (roundNumber === 2) {
				gameRoundtmp = 'two';
			}
		}
	}

	const parentElement = matchElement.closest('.split, .champion');
	if (parentElement) {
		if (parentElement.classList.contains('split-one')) {
			gameSideTmp = '1';
		} else if (parentElement.classList.contains('split-two')) {
			gameSideTmp = '2';
		} else if (parentElement.classList.contains('champion')) {
			gameSideTmp = 'champion';
		}
	}

	const matchups = parentElement.querySelectorAll('.matchup');
	if (matchups.length > 0) {
		gameNumtmp = Array.from(matchups).indexOf(matchElement) + 1;
	}

	return {
		gameRoundtmp: gameRoundtmp,
		gameSideTmp: gameSideTmp,
		gameNumtmp: gameNumtmp
	};
}
