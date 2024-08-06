let players = [];
let currentPlayerIndex = 0;
let totalPlayers = 0;
let tournamentSection, mainSection, player1, player2, matchElement;


/**
 * Creates a button element within a container and attaches an event handler.
 * Generates a button element with the specified ID, label, and click event handler.
 * Wraps the button within a styled container for layout purposes.
 * If additional parameters are provided, they are passed to the click handler.
 *
 * @param {string} buttonId - The ID to assign to the button element.
 * @param {string} label - The text label to display on the button.
 * @param {Function} clickHandler - The function to execute when the button is clicked.
 * @param {...*} params - Additional parameters to pass to the click handler.
 * @return {HTMLElement} - The container element containing the button.
 */

function getBtnContainer(buttonId, label, clickHandler, ...params) {
	// Create button element
	let buttonContainer = document.createElement('div');
	buttonContainer.className = 'row justify-content-center';

	let colContainer = document.createElement('div');
	colContainer.className = 'col button-container justify-content-center';

	let btn = document.createElement('button');
	btn.id = buttonId;
	btn.className = 'btn btn-outline-light mt-3 btn-custom';
	btn.type = 'submit';
	btn.textContent = label;
	if (buttonId != 'online_tourn' && buttonId != 'offline_tourn') {
		if (typeof clickHandler === 'function') {
			if (params != null && params.length > 0) {
				// Call clickHandler with params if provided
				btn.addEventListener('click', function(event) {
					clickHandler.apply(null, params);
				});
			} else {
				btn.addEventListener('click', clickHandler);
			}
		}
	}
	else {
		btn.addEventListener('click', clickHandler);
	}
	colContainer.appendChild(btn);
	buttonContainer.appendChild(colContainer);
	return buttonContainer;
}

/**
 * Removes the specified button container element from the DOM if it is a valid `Element`.
 * 
 * @param {Element} buttonContainer - The button container element to be removed.
 * @returns {void}
 */
function removeBtnContainer(buttonContainer) {
	if (!(buttonContainer instanceof Element)) return;
	buttonContainer.remove();
}

const startTrounBtn = getBtnContainer('startTour', 'Start Tournament', startFirstMatch, null);
const backOnlineBtn = getBtnContainer('online_tourn', 'Back-to-Home', handleButtonClick, null);
const backOfflineBtn = getBtnContainer('offline_tourn', 'Back-to-home', handleButtonClick, null);
let nextGameBtn = getBtnContainer('nextGame', 'Next Match', startNextMatch, matchElement);


const tourWinnerModal = (winner) => {
	const message = isOnlineTournament 
		? "You won this Tournament!" 
		: `The winner of this Tournament is <span  class="winner-name">${winner}</span>`;
	modalHtml = ` 
		<center> 
			<div class="modal fade" id="m-result-modal" tabindex="-1" role="dialog" aria-labelledby="basicModal" aria-hidden="true">
				<div class="modal-dialog modal-lg">
					<div class="modal-content justify-content-center">
						<div class="modal-header justify-content-center">
							<h4 class="modal-title" id="myModalLabel">Winner</h4>
						</div>
						<div class="modal-body">
							<div class="card-body text-center"> 
								<img src="/media/images/win.png" class="winner-img winneronline-img">
								<h4 class="congrats-message">CONGRATULATIONS! <span  class="winner-name">${winner}</span></h4>
								<p class="winner-message">🎉🎉🎉 ${message} 🎉🎉🎉</p> 
							</div>
						</div>
					</div>
				</div>
			</div>
		</center> 
	`;
	return modalHtml;
} 

{/* <h4 class="congrats-message"Losers, hands up and applaud the winner <span  class="winner-name">${winner}</span>!</h4> */}

const tourLosersModal = (winner) => {
	modalHtml = ` 
		<center> 
			<div class="modal fade" id="m-result-modal" tabindex="-1" role="dialog" aria-labelledby="basicModal" aria-hidden="true">
				<div class="modal-dialog modal-lg">
					<div class="modal-content justify-content-center">
						<div class="modal-header justify-content-center">
							<h4 class="modal-title" id="myModalLabel">Losers</h4>
						</div>
						<div class="modal-body">
							<div class="card-body text-center"> 
								<img src="/media/images/tourLoser.png" class="winner-img winneronline-img">
								<h4 class="congrats-message">Hands up Losers! Let's all congratulate <span  class="winner-name">${winner}</span>!</h4>
								<p class="winner-message">🎉🎉🎉 He Just cooked all of you in this Tournament<span  class="winner-name"></span> 🎉🎉🎉</p> 
							</div>
						</div>
					</div>
				</div>
			</div>
		</center> 
	`;
	return modalHtml;
} 

/**
 * Generates the HTML content for the loser modal for the online game.
 * @returns {string} The HTML string for the loser modal.
 */
const loserModal = () => {
	const modalHtml = ` 
		<center> 
			<div class="modal fade" id="m-result-modal" tabindex="-1" role="dialog" aria-labelledby="basicModal" aria-hidden="true">
				<div class="modal-dialog modal-lg">
					<div class="modal-content justify-content-center">
						<div class="modal-header justify-content-center">
							<h4 class="modal-title" id="myModalLabel">Sorry Loser</h4>
						</div>
						<div class="modal-body">
							<div class="card-body text-center">
								<img src="/media/images/loser.jpg" class="loser-img" >
								<h4 class="congrats-message">HAHAHAHAHA.....!!!</h4>
								<p class="winner-message">🤦‍♂️🤦‍♂️ YOU LOST THE GAME.. 🤦‍♂️🤦‍♂️</p> 
							</div>
						</div>
					</div>
				</div>
			</div>
		</center> 
	`;
	return modalHtml;
}

/**
 * Generates the HTML for the winner of modal for the online game.
 * @returns {string} The HTML string for the winner modal.
 */
const winM = () => {
	modalHtml = ` 
		<center> 
			<div class="modal fade" id="m-result-modal" tabindex="-1" role="dialog" aria-labelledby="basicModal" aria-hidden="true">
				<div class="modal-dialog modal-lg">
					<div class="modal-content justify-content-center">
						<div class="modal-header justify-content-center">
							<h4 class="modal-title" id="myModalLabel">Winner</h4>
						</div>
						<div class="modal-body">
							<div class="card-body text-center"> 
								<img src="/media/images/winner.jpg" class="winneronline-img">
								<h4 class="congrats-message">CONGRATULATIONS!</h4>
								<p class="winner-message"> 🎉🎉 YOU WON THE GAME... 🎉🎉</p> 
							</div>
						</div>
					</div>
				</div>
			</div>
		</center> 
	`;
	return modalHtml;
}

{/* <img src="https://img.icons8.com/?size=100&id=VUt5dWfcfFzt&format=png&color=000000"> */}
/**
 * Generates the HTML content for the winner modal that will be used for local games.
 * @param {string} winner - The name of the winner.
 * @returns {string} The HTML string for the winner modal.
 */
const winnerModal = (winner) => {
	modalHtml = ` 
		<center> 
			<div class="modal fade" id="m-result-modal" tabindex="-1" role="dialog" aria-labelledby="basicModal" aria-hidden="true">
				<div class="modal-dialog modal-lg">
					<div class="modal-content justify-content-center">
						<div class="modal-header justify-content-center">
							<h4 class="modal-title" id="myModalLabel">Winner</h4>
						</div>
						<div class="modal-body">
							<div class="card-body text-center"> 
								
								<img src="/media/images/win.png" class="winner-img" id="winner-image">
								<h4 class="congrats-message">CONGRATULATIONS!</h4>
								<p class="winner-message">🎉 The winner of this game is <span  class="winner-name">${winner}</span> 🎉</p> 
							</div>
						</div>
					</div>
				</div>
			</div>
		</center> 
	`;
	return modalHtml;
} 

var matchModal = function getMatchModal(player1, player2) {
	modalHtml = ` 
		<center> 
			<div class="modal fade" id="m-result-modal" tabindex="-1" role="dialog" aria-labelledby="basicModal" aria-hidden="true">
				<div class="modal-dialog modal-lg">
					<div class="modal-content justify-content-center" id="match-modal" >
						<div class="modal-header justify-content-center">
							<h4 class="modal-title" id="myModalLabel">Upcoming Match</h4>
						</div>
						<div class="modal-body">
							<div class="card-body text-center"> 
								<img src="/media/images/matchm.png">
								<div class="d-flex justify-content-center matchbox">
									<div class="box box-1">
										<div class="p-2">${player1}</div>
									</div>
									<div class="vsbox justify-content-center">
										<img src="/media/images/vss.png" alt="VS Icon">
									</div>
									<div class="box box-2">
										<div class="p-2">${player2} </div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</center> 
	`;
	return modalHtml;
} 

/**
 * Displays a modal with the provided content.
 * Creates a modal container if it doesn't exist, sets its HTML content,
 * initializes the Bootstrap modal, and shows it. The modal is hidden after a delay.
 *
 * @param {string} modalContent - HTML content for the modal.
 * @param {number} [delay=5000] - Time in milliseconds to hide the modal after showing. Defaults to 5000ms.
 */
function displayAnyModal(modalContent, delay = 5000) {
	let modalContainer = document.getElementById('modal-container');
	if (!modalContainer) {
		modalContainer = document.createElement('div');
		modalContainer.id = 'modal-container';
		document.body.appendChild(modalContainer);
	}
	// Insert the modal HTML into the container
	modalContainer.innerHTML = modalContent;
	const myModal = new bootstrap.Modal('#m-result-modal', { 
		backdrop: 'static',
		keyboard: false
	});
	const modal = bootstrap.Modal.getOrCreateInstance('#m-result-modal'); 
	modal.show();
	// animateWinnerImage();
	hideModalAfterDelay(myModal, delay);
}

/**
 * Appends an element to a container specified by its class name.
 * Searches for the container element using the provided class name.
 * If the container is found, it appends the element to it.
 *
 * @param {HTMLElement} toBeAppended - The element to be appended to the container.
 * @param {string} classname - The class name of the container element.
 * @return {void}
 */
function appendToContainer(toBeAppended, classname) {
	const container = document.querySelector(`.${classname}`);
	if (container) {
		container.appendChild(toBeAppended);
	}
}

/**
 * Displays the winner modal with the specified winner.
 * @param {string} winner - The winner's name or identifier.
 * @param {string} loser - The loser's name or identifier (not used in this function).
 */
const displayWinnerModal = (winner, loser) => displayAnyModal(winnerModal(winner));

/**
 * Displays the loser modal, given that the current player is the loser.
 */
const displayLoserModal = () => displayAnyModal(loserModal());

/**
 * Displays the win modal, given that the current player is the winner.
 */
const displayWinM = () => displayAnyModal(winM());

/**
 * Displays the tournament winner modal with the specified winner.
 * @param {string} winner - The winner's name or identifier.
 */
const displayTourWinM = winner => displayAnyModal(tourWinnerModal(winner));

/**
 * Displays the tournament losers modal with the specified winner.
 * @param {string} winner - The winner's name or identifier.
 */
const displayTourLosersM = winner => displayAnyModal(tourLosersModal(winner));

/**
 * Displays the match modal for the specified players, informing the player about play the game.
 * @param {string} player1 - The name or identifier of player 1.
 * @param {string} player2 - The name or identifier of player 2.
 */
const displayMatchModal = (player1, player2) => displayAnyModal(matchModal(player1, player2), 4000);


/**
 * Shuffles an array using the Fisher-Yates (Knuth) shuffle algorithm.
 * This function modifies the original array by randomly swapping its elements.
 *
 * @param {Array} array - The array to be shuffled.
 * @return {Array} - The shuffled array.
 */
function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}


/**
 * Sets up the tournament by initializing player data and creating the player input form.
 * Initializes the `players` array and sets the `currentPlayerIndex` and `totalPlayers` variables.
 * Creates and displays the player input form in the specified HTML element.
 * Adds an event listener to the submit button for handling player name submissions.
 *
 * @param {number} playerCount - The total number of players participating in the tournament.
 * @return {void}
 */
function setupTournament(playerCount) {
	players = [];
	currentPlayerIndex = 0;
	totalPlayers = playerCount;
	var tournElementtmp = document.getElementById("inputPlayers");
	// document.getElementById('off_tourn_hero').style.display = 'none';
	tournElementtmp.innerHTML = `
		<div class="center-container">
			<div id="playerFormContainer" class="input-group mb-3 square-box">
				<span class="pheader" > 
					<h2">Enter Player Names <br></h2>
				</span>
				<form id="playerForm">
					<div id="playerInputs", class="p-form">
						<input type="text" id="playerName" class="playerName" name="playerName" placeholder="Player 1" required>
					</div>
					<div class="sub-btn">
						<button type="button" id="submitPlayer" class="submitBtn" >Next</button>
					</div>
				</form>
			</div>
		</div>
	`;
	const playerFormContainer = document.getElementById('playerFormContainer');
	playerFormContainer.style.display = 'block';
	document.getElementById('submitPlayer').addEventListener('click', submitPlayerName);
	attachEventListner();
}

/**
 * Attaches an event listener to the 'playerName' input field to detect the 'Enter' key press.
 * On 'Enter', it triggers a click event on the 'submitPlayer' button and prevents the default form submission.
 * Additionally, sets focus to the 'playerName' input field on page load.
 */
function attachEventListner() {
	document.getElementById('playerName').addEventListener('keypress', function(event) {
		if (event.key === 'Enter') {
			document.getElementById("submitPlayer").click();
			event.preventDefault();
		}
	});
	document.getElementById('playerName').focus();
}

/**
 * Removes leading and trailing whitespace, single quotes, and double quotes from the input string.
 *
 * @param {string} input - The string to be trimmed.
 * @returns {string} - The trimmed string.
 */
const customTrim = input => input.replace(/^[\s'"]+|[\s'"]+$/g, '');

/**
 * Validates a player name. Checks if the input is empty, too long, already taken, or does not 
 * match the required pattern.Alerts the user with an appropriate message if any validation fails.
 *
 * @param {string} input - The player name to validate.
 * @return {boolean} - Returns true if the input is valid, otherwise false.
 */
function validateInputString(input) {

	const regex = /^[a-zA-Z]\S*$/;
	if (!input || input === "") return alert('Player name cannot be empty.') || false;
	if (input.length > 10) return alert('Player name too long.') || false;
	if (players.includes(input)) return alert(`The name "${input}" is already taken. Please choose another.`) || false;
	return regex.test(input) ? true : (alert('Invalid Player Name') || false);
}

/**
 * Handles the submission of player names during tournament setup.
 * Validates the input player name and updates the player list.
 * If the current player index is less than the total number of players, it updates the input field for the next player.
 * Once all player names are submitted, it shuffles and organizes the tournament.
 *
 * @param {Event} event - The event object representing the click event.
 * @return {void}
 */
function submitPlayerName(event) {
	if (event.type === 'click') {
		const playerNameInput = document.getElementById('playerName');
		const playerName = customTrim(playerNameInput.value).toLowerCase();

		if (validateInputString(playerName)) {
			players.push(playerName);
			currentPlayerIndex++;
			
			if (currentPlayerIndex < totalPlayers) {
				document.getElementById('playerInputs').innerHTML = `
				<input type="text" id="playerName" class="playerName" name="playerName" placeholder="Player ${currentPlayerIndex + 1}" required>
				`;
				attachEventListner();
			} else {
				myplayers = shuffleArray(players);
				organizeTournament(myplayers);
			}
		}
	}
}

function getCookie(name) {
	let cookieValue = null;
	if (document.cookie && document.cookie !== '') {
		const cookies = document.cookie.split(';');
		for (let i = 0; i < cookies.length; i++) {
			const cookie = cookies[i].trim();
			if (cookie.substring(0, name.length + 1) === (name + '=')) {
				cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
				break;
			}
		}
	}
	return cookieValue;
}

/**
 * Organizes the tournament by sending the player list to the server and updating the tournament bracket.
 * Sends a POST request to the server with the player list, retrieves the tournament bracket, 
 * and updates the corresponding HTML element. Displays a start button and applies styling if there are exactly 4 players.
 *
 * @param {Array<string>} players - The list of player names.
 * @return {Promise<void>} - A promise that resolves when the operation is complete.
 */
async function organizeTournament(players) {
	const csrftoken = getCookie('csrftoken');
	try {
		const response = await fetch('/off_tour_bracket/', {
			method: 'POST',
			headers: { 
				'Content-Type': 'application/json',
				'X-CSRFToken': csrftoken  // Include the CSRF token in the headers
			},
			body: JSON.stringify({ players: players })
		});
		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}

		const parsedjson = await response.json();
		const tournElementtmp =  document.getElementById("inputPlayers");
		if (tournElementtmp.length === 0) {
			throw new Error('No element with class "details-section" found');
		}
		
		tournElementtmp.innerHTML = parsedjson.tournament_bracket;
		appendToContainer(startTrounBtn, 'my-5.main-section');
		if (players.length == 4) {
			changeSplitStyle();
			changeRoundStyle();
		}
	} catch (error) {
		// console.error('Error fetching tournament bracket:', error);
	}
}

/**
 * Starts the first match in the tournament by finding the first match element,
 * removing the start tournament button, and calling `startMatch` on the matchelement players.
 */
function startFirstMatch() {
	matchElement = document.querySelector('.round-one .matchup');
	if (matchElement) {
		player1 = matchElement.querySelector('.team-top').innerText;
		player2 = matchElement.querySelector('.team-bottom').innerText;
		removeBtnContainer(startTrounBtn);
		startMatch(player1, player2);
	}
}

/**
 * Updates the scores for the players in the given match element, handles updating
 * the next round and starting the next match, or displays the winner in a tournament.
 * 
 * @param {Element} matchElement - The DOM element representing the match.
 * @param {number} player1_score - The score for player 1.
 * @param {number} player2_score - The score for player 2.
 */
function updateScores(matchElement, player1_score, player2_score) {
	if (!matchElement) return;
	const player1ScoreInput = matchElement.querySelector('.team-top .score-input');
	const player2ScoreInput = matchElement.querySelector('.team-bottom .score-input');
	
	player1ScoreInput.value = player1_score;
	player2ScoreInput.value = player2_score;

	// Check if the match is not in the championship final
	if (!matchElement.closest('.champion')) {
		// Proceed with updating the next round and starting the next match
		updateNextRound(matchElement);
		if (isOnlineTournament) return;
		nextGameBtn = getBtnContainer('nextGame', 'Next Match', startNextMatch, matchElement);
		appendToContainer(nextGameBtn, 'my-5.main-section');
	} else {
		var player1_name = matchElement.querySelector(".team-top");
		var player2_name = matchElement.querySelector(".team-bottom");
		var winner = player1_score > player2_score ? player1_name.querySelector(".player-name") : player2_name.querySelector(".player-name");
		winner = winner.textContent.trim();
		if (isOnlineTournament) {
			tourId = null; gameNum = null; gameRound = null; gameSide = null;
			(username === winner) ? displayTourWinM(winner) : displayTourLosersM(winner);
			isOnlineTournament = false;
		} else {
			displayTourWinM(winner);
			appendToContainer(backOfflineBtn, 'my-5.main-section');
		}
	}
}

/**
 * Updates the bracket for the next match with the winner from the current match.
 * 
 * @param {Element} matchElement - The DOM element representing the current match.
 * @param {string} winner - The name of the winning player.
 */
function updateBracket(matchElement, winner) {
	console.log("I am updating from here")
	const nextMatchElement = getNextMatchElement(matchElement);
	if (nextMatchElement) {
		const playerSpots = nextMatchElement.querySelectorAll('.team');
		if (!playerSpots[0].innerText.trim()) {
			playerSpots[0].innerText = winner;
		} else if (!playerSpots[1].innerText.trim()) {
			playerSpots[1].innerText = winner;
		}
		startNextMatch(matchElement);
	}
}

/**
 * Starts the next match in the same round, if available, by finding the next match element,
 * removing the 'Next Match' button, and initializing the match with the players.
 * 
 * @param {Element} currentMatchElement - The DOM element representing the current match.
 */
function startNextMatch(currentMatchElement) {
	matchElement = getNextMatchInSameRound(currentMatchElement);
	if (matchElement) {
		player1 = matchElement.querySelector('.team-top').innerText.trim();
		player2 = matchElement.querySelector('.team-bottom').innerText.trim();
		removeBtnContainer(nextGameBtn);
		startMatch(player1, player2);
	}
}

/**
 * Finds and returns the next match element in the tournament bracket.
 * The function first check the matches in the sameRound (on both sides of the bracket) as currentMatchElement. 
 * if unable to find any next match in the same round it will jump to the next round(including the final championship) and get the first marchup
 * 
 * @param {Element} currentMatchElement - The DOM element representing the current match.
 * @returns {Element|null} The DOM element representing the next match, or null if not found.
 */
function getNextMatchInSameRound(currentMatchElement) {
	// Find the current round and current split
	const currentSplit = currentMatchElement.closest('.split');
	const currentRound = currentMatchElement.closest('.round');

	// Find all matches in the current round within the current split
	var allMatchesInCurrentSplit = Array.from(currentSplit.querySelectorAll('.round .matchup'));
	// Filter matches to include only those in the same round as the current match
	allMatchesInCurrentSplit = allMatchesInCurrentSplit.filter(match => {
		return match.closest('.round') === currentRound;
	});

	const currentIndex = allMatchesInCurrentSplit.indexOf(currentMatchElement);
	if (currentIndex === -1) return null;
	if (currentIndex + 1 < allMatchesInCurrentSplit.length) return allMatchesInCurrentSplit[currentIndex + 1];

	let otherSplit = null;
	if (currentSplit.classList.contains('split-one')) {
		otherSplit = currentRound.closest('.custom-container').querySelector('.split-two');
	}
	if (otherSplit) {
		const otherSplitMatches = Array.from(otherSplit.querySelectorAll('.round .matchup'));
		const otherRoundMatches = otherSplitMatches.filter(match => {
			return match.closest('.round').classList.toString() === currentRound.classList.toString();
		});
		if (otherRoundMatches.length > 0) return otherRoundMatches[0];
	}

	// If no more matches in the current round, find the next round
	let nextRound = null;
	if (currentSplit.classList.contains('split-two')) {
		// Move to the next round in split-one
		const container = currentRound.closest('.custom-container');
		const splitOne = container.querySelector('.split-one');
		if (splitOne) {
			const splitOneRounds = Array.from(splitOne.querySelectorAll('.round'));
			const currentRoundIndex = splitOneRounds.findIndex(round => 
				round.classList.toString() === currentRound.classList.toString()
			);
			if (currentRoundIndex !== -1 && currentRoundIndex + 1 < splitOneRounds.length) {
				nextRound = splitOneRounds[currentRoundIndex + 1];
			}
		}
	}

	// If next round is found, get the first match of that round
	if (nextRound) {
		const nextRoundMatches = Array.from(nextRound.querySelectorAll('.matchup'));
		if (nextRoundMatches.length > 0) return nextRoundMatches[0];
	}

	// If next round is not found, check for the final championship round
	const container = currentRound.closest('.custom-container');
	const finalRound = container.querySelector('.champion .final');
	if (finalRound) {
		const finalRoundMatches = Array.from(finalRound.querySelectorAll('.matchup'));
		if (finalRoundMatches.length > 0) return finalRoundMatches[0];
	}

	// No next match found
	return null;
}

/**
 * Retrieves the next match element in the tournament bracket.
 * 
 * @param {Element} currentMatchElement - The current match element.
 * @returns {Element|null} - The next match element or null if not found.
 */
function getNextMatchElement(currentMatchElement) {
	let nextMatchElement = null;
	const currentSplit = currentMatchElement.closest('.split');

	if (currentSplit.nextElementSibling) {
		nextMatchElement = currentSplit.nextElementSibling.querySelector('.matches .matchup');
	} else {
		const championshipMatchElement = document.querySelector('.champion .matches .matchup');
		nextMatchElement = championshipMatchElement || nextMatchElement;
	}
	return nextMatchElement;
}

/**
 * Updates the next round in the tournament based on the current matchup results.
 * It determines the winner and loser from the current matchup results and updates the next round accordingly.
 * 
 * @param {Element} currentMatchup - The current matchup element.
 */
function updateNextRound(currentMatchup) {
  var teamTop = currentMatchup.querySelector(".team-top");
  var teamBottom = currentMatchup.querySelector(".team-bottom");
  var scoreTop = parseFloat(teamTop.querySelector(".score-input").value);
  var scoreBottom = parseFloat(teamBottom.querySelector(".score-input").value);

  if (!isNaN(scoreTop) && !isNaN(scoreBottom)) {
	var winner = scoreTop > scoreBottom ? teamTop : teamBottom;
	var loser = scoreTop > scoreBottom ? teamBottom : teamTop;
	updateNextMatchup(winner, loser);
  }
}


/**
 * Updates the match cell with the winner's information.
 * Clears the existing cell content and adds the winner's image, name, and score input.
 * 
 * @param {Element} nextCell - The cell element to be updated.
 * @param {Element} winnerName - The winner's name element.
 * @param {Element} winnerImg - The winner's image element.
 * @param {number} winnerScore - The winner's score.
 */
function updateMatchCell(nextCell, winnerName, winnerImg, winnerScore) {
	nextCell.innerHTML = "";
	nextCell.appendChild(winnerImg);
	nextCell.appendChild(winnerName);
	nextCell.insertAdjacentHTML("beforeend", `<input class="score-input" type="number" value="${winnerScore}" disabled>`);
}

/**
 * Updates the next matchup with the winner's information.
 * Finds the appropriate round and matchup, and updates the corresponding cell with the winner's details.
 * 
 * @param {Element} winner - The element representing the winning team/player.
 * @param {Element} loser - The element representing the losing team/player.
 */
function updateNextMatchup(winner, loser) {
	var currentRound = winner.closest(".round");
	var currentMatchupIndex = Array.from(currentRound.querySelectorAll(".matchup")).indexOf(winner.closest(".matchup"));
	var isLeftSide = winner.closest(".split").classList.contains("split-one");
	var nextRound = isLeftSide ? currentRound.nextElementSibling : currentRound.previousElementSibling;
	var winnerImg = winner.querySelector("img").cloneNode(true);
	var winnerName = winner.querySelector(".player-name").cloneNode(true);
	var winnerScore = "";

	if (nextRound) {
		var nextMatchups = nextRound.querySelectorAll(".matchup");
		var nextMatchupIndex = Math.floor(currentMatchupIndex / 2);
		var nextMatchup = nextMatchups[nextMatchupIndex];

		updateNextMatchup = isOnlineTournament ? nextMatchup: updateNextMatchup;
	
		if (nextMatchup) {
			var nextTeamTop = nextMatchup.querySelector(".team-top");
			var nextTeamBottom = nextMatchup.querySelector(".team-bottom");

			if (currentMatchupIndex === nextMatchupIndex) {
				updateMatchCell(nextTeamTop, winnerName, winnerImg, winnerScore);
			} 
			else if (currentMatchupIndex === nextMatchupIndex + 1) {
				updateMatchCell(nextTeamBottom, winnerName, winnerImg, winnerScore);
			}
		}
	}
	else {
		// If there's no next round, update the championship matchup directly
		var championshipMatchup = document.querySelector(".championship.matchup");
		var championshipTeamTop = championshipMatchup.querySelector(".team-top");
		var championshipTeamBottom = championshipMatchup.querySelector(".team-bottom");

		updatedMatchup = isOnlineTournament ? championshipMatchup: updatedMatchup;

		if (isLeftSide) {
			updateMatchCell(championshipTeamTop, winnerName, winnerImg, winnerScore);
		}
		else {
			updateMatchCell(championshipTeamBottom, winnerName, winnerImg, winnerScore);
		}
	}
}

/**
 * Handles actions when a game is completed.Updates the scores, removes the tournament section, and restores the main section content (bracket page).
 */
function onGameCompleted() {
	const player1_score = getScoresDisplay('p1');
	const player2_score = getScoresDisplay('p2');
	const winner = player1_score > player2_score ? player1 : player2;
	// displayWinnerModal(winner, player2);
	if (tournamentSection && tournamentSection.parentNode) {
		tournamentSection.parentNode.removeChild(tournamentSection);
	}
	// Restore the original body content
	mainSection.style.display = 'block';

	isIntournament = false;
	updateScores(matchElement, player1_score, player2_score);
}

/**
 * Starts a match by fetching the local game page from the server and updating the UI.
 * 
 * @param {string} player1 - The name of the first player.
 * @param {string} player2 - The name of the second player.
 */
async function startMatch(player1, player2) {
	mainSection = document.querySelector('.main-section');
	const mainContainer = document.getElementById('main-container');

	mainSection.style.display = 'none';
	// await new Promise(resolve => setTimeout(resolve, 1000));
	const csrftoken = getCookie('csrftoken');

	try {
		const response = await fetch('/local_game/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrftoken
			},
			body: JSON.stringify({ player1, player2 })
		});
		const html = await response.text();
		isIntournament = true;

		// Replace the entire body content with the fetched content
		const parser = new DOMParser();
		const parsedHtml = parser.parseFromString(html, 'text/html');
		tournamentSection = parsedHtml.getElementById('tournament');
		const restartButton = parsedHtml.getElementById('restart_btn');
		const quitButton = parsedHtml.getElementById('quit_game');

		restartButton?.parentNode?.removeChild(restartButton); 
		quitButton?.parentNode?.removeChild(quitButton);
		
		mainContainer.appendChild(tournamentSection);
		const customizeDialog = document.getElementById('customizeDialog');
		customizeDialog.style.display = 'none';
		displayMatchModal(player1, player2);
	} catch (error) {
		// console.error('Error fetching local game page:', error);
	}
}

/**
 * Applies the 'flex-mode' class to all elements with the class 'matchup' within the 'round-one' container.
 *
 * @return {void}
 */
function changeRoundStyle() {
	const roundOneMatchup = document.querySelectorAll('.round-one .matchup');
	
	if (roundOneMatchup && roundOneMatchup.length > 0) {
		roundOneMatchup.forEach(matchup => {
			if (matchup && matchup.classList) {
				matchup.classList.add('flex-mode');
			}
		});
	}

}

/**
 * Changes the style of elements with the class 'split' by adding the 'split-four-p' class.
 *
 * @return {void}
 */
function changeSplitStyle() {
	const splits = document.querySelectorAll('.split');

	if (splits && Array.isArray(splits) && splits.length > 0) {
		splits.forEach(matchup => {
			if (matchup && matchup.classList) {
				matchup.classList.add('split-four-p');
			}
		});
	}
}

/**
 * Displays the spinner overlay with a customizable message.
 * If a message is provided, it sets the message content and appends animated dots.
 * The spinner overlay is made visible by setting its display style to 'flex'.
 *
 * @param {string} message - The message to display alongside the spinner.
 * @return {void}
 */
function showSpinner(message) {
	const bodySection = document.querySelector('.main-section');
	if (bodySection) {
		bodySection.style.opacity = 0.01;
	}
	const spinnerMessage = document.getElementById('spinner-message');
	const spinnerOverlay = document.getElementById('spinner-overlay');
	if (message) {
	  spinnerMessage.innerHTML = `
		${message}
		<div class="dots">
		  <span>.</span>
		  <span>.</span>
		  <span>.</span>
		</div>
	  `;
	}
	spinnerOverlay.style.display = 'flex';
}

/**
 * Hides the spinner overlay by setting its display style to 'none'.
 *
 * @return {void}
 */
  function hideSpinner() {
	const spinnerOverlay = document.getElementById('spinner-overlay');
	const bodySection = document.querySelector('.main-section');
	if (bodySection) {
		bodySection.style.opacity = 1;
	}
	spinnerOverlay.style.display = 'none';
  }

/**
 * Animates the winner image inside the modal by cycling through a set of images.
 */
function animateWinnerImage() {
	const images = [
		"/media/images/win.png",
		"/media/images/win3.png",
		"/media/images/w1.png",
		"/media/images/w2.png",
		"/media/images/w3.png",
	];

	let currentImageIndex = 0;
	const winnerImage = document.getElementById("winner-image");

	function changeImage() {
		currentImageIndex = (currentImageIndex + 1) % images.length;
		winnerImage.style.opacity = 0; // Fade out
		setTimeout(() => {
			winnerImage.src = images[currentImageIndex];
			winnerImage.style.opacity = 1; // Fade in
		}, 1000); // Match the transition duration
	}
	setInterval(changeImage, 2000); // Change image every 3 seconds
}

/**
 * Hides the given modal after a specified wait time.
 * @param {Object} modalInstance - The Bootstrap modal instance to hide.
 * @param {number} waitTime - The time to wait in milliseconds before hiding the modal.
 */
const hideModalAfterDelay = (modalInstance, waitTime) => {
	setTimeout(() => {
		modalInstance.hide();
	}, waitTime);
};