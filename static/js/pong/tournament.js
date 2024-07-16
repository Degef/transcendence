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

    if (typeof clickHandler === 'function') {
        if (params.length > 0) {
            // Call clickHandler with params if provided
            btn.addEventListener('click', function(event) {
                clickHandler.apply(null, params);
            });
        } else {
            // Call clickHandler without params
            btn.addEventListener('click', clickHandler);
        }
    }
    colContainer.appendChild(btn);
    buttonContainer.appendChild(colContainer);
    return buttonContainer;
}

function removeBtnContainer(buttonContainer) {
    // Ensure buttonContainer is a valid element
    if (!(buttonContainer instanceof Element)) {
        console.error('Invalid parameter. Expected an Element.');
        return;
    }
    buttonContainer.remove();
}


const startTrounBtn = getBtnContainer('startTour', 'Start Tournament', startFirstMatch, null);
let nextGameBtn = getBtnContainer('nextGame', 'Next Match', startNextMatch, matchElement);


// var loserModal = function getLoserModal() {
//     modalHtml = ` 
//         <center> 
//             <div class="modal fade" id="m-result-modal" tabindex="-1" role="dialog" aria-labelledby="basicModal" aria-hidden="true">
//                 <div class="modal-dialog modal-lg">
//                     <div class="modal-content justify-content-center">
//                         <div class="modal-header justify-content-center">
//                             <h4 class="modal-title" id="myModalLabel">Sorry</h4>
//                         </div>
//                         <div class="modal-body">
//                             <div class="card-body text-center">
//                                 <img src="/media/images/loser.jpg">
//                                 <h4>HAHAHAHAHA.....!!!</h4>
//                                 <p>YOU LOST THE GAME..🤦‍♂️🤦‍♂️</p> 
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
// 	    </center> 
//     `;
//     return modalHtml;
// } 


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
                            <h4 class="modal-title" id="myModalLabel">Sorry</h4>
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
                                        <div class="p-2 text-white">${player1}</div>
                                    </div>
                                    <div class="vsbox justify-content-center">
                                        <img src="/media/images/vss.png" alt="VS Icon">
                                    </div>
                                    <div class="box box-2">
                                        <div class="p-2 text-white">${player2} </div>
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
    } else {
        console.error(`Element with class "${classname}" not found.`);
    }
}

/**
 * Displays a winner modal with given winner and loser information.
 * Creates a modal container if not already present in the DOM,
 * inserts the modal HTML into it, and shows the modal using Bootstrap.
 * Adds event listeners to hide the modal when clicked outside and prevent hiding when clicked inside.
 * 
 * @param {string} winner - The winner's name or information.
 * @param {string} loser - The loser's name or information.
 * @return {void}
 */
function displayWinnerModal(winner, loser) {
    let modalContainer = document.getElementById('modal-container');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'modal-container';
        document.body.appendChild(modalContainer);
    }

    // Insert the modal HTML into the container
    modalContainer.innerHTML = winnerModal(winner);
    const myModal = new bootstrap.Modal('#m-result-modal');
    const modal = bootstrap.Modal.getOrCreateInstance('#m-result-modal'); 
    modal.show();
    // animateWinnerImage();
    hideModalAfterDelay(myModal, 5000);
    // setTimeout(() => {
    //     myModal.hide();
    // }, 5000);

    // function hideModalOnClickOutsideTwo(event) {
    //     if (!modalContainer.contains(event.target)) {
    //         myModal.hide();
    //         document.removeEventListener('click', hideModalOnClickOutsideTwo);
    //     }
    // }

    // document.addEventListener('click', hideModalOnClickOutsideTwo);
    // modalContainer.addEventListener('click', function(event) {
    //     event.stopPropagation();
    // });
}



function displayLoserModal() {
    let modalContainer = document.getElementById('modal-container');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'modal-container';
        document.body.appendChild(modalContainer);
    }

    // Insert the modal HTML into the container
    modalContainer.innerHTML = loserModal();
    const myModal = new bootstrap.Modal('#m-result-modal');
    const modal = bootstrap.Modal.getOrCreateInstance('#m-result-modal'); 
    modal.show();
    hideModalAfterDelay(myModal, 5000);
    // setTimeout(() => {
    //     myModal.hide();
    // }, 5000);
}

function displayWinM() {
    let modalContainer = document.getElementById('modal-container');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'modal-container';
        document.body.appendChild(modalContainer);
    }

    // Insert the modal HTML into the container
    modalContainer.innerHTML = winM();
    const myModal = new bootstrap.Modal('#m-result-modal');
    const modal = bootstrap.Modal.getOrCreateInstance('#m-result-modal'); 
    modal.show();
    hideModalAfterDelay(myModal, 5000);
    // setTimeout(() => {
    //     myModal.hide();
    // }, 5000);
}


/**
 * Displays a match modal with the provided player names.
 * Creates a modal container if it doesn't already exist, inserts the modal HTML, and shows the modal.
 * Adds an event listener to hide the modal when clicking outside of it.
 *
 * @param {string} player1 - The name of the first player.
 * @param {string} player2 - The name of the second player.
 * @return {void}
 */
function displayMatchModal(player1, player2) {
  
    let modalContainer = document.getElementById('modal-container');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'modal-container';
        document.body.appendChild(modalContainer);
    }

    // Insert the modal HTML into the container
    modalContainer.innerHTML = matchModal(player1, player2);
    const myModal = new bootstrap.Modal('#m-result-modal');
    const modal = bootstrap.Modal.getOrCreateInstance('#m-result-modal'); 
    modal.show();
    // Function to hide modal
    // setTimeout(() => {
    //     myModal.hide();
    // }, 10000);
    function hideModalOnClickOutside(event) {
        if (!modalContainer.contains(event.target)) {
            modal.hide();
            document.removeEventListener('click', hideModalOnClickOutside);
        }
    }

    // Add event listener to hide modal on click outside
    document.addEventListener('click', hideModalOnClickOutside);

    // Optional: Add event listener to prevent hiding modal if clicked inside
    modalContainer.addEventListener('click', function(event) {
        event.stopPropagation();
    });
}

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

function attachEventListner() {
    document.getElementById('playerName').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            document.getElementById("submitPlayer").click();
            event.preventDefault();
        }
    });
    document.getElementById('playerName').focus();
}

function customTrim(input) {
    return input.replace(/^[\s'"]+|[\s'"]+$/g, '');
}

/**
 * Validates a player name input string based on several criteria.
 * Checks if the input is empty, too long, already taken, or does not match the required pattern.
 * Alerts the user with an appropriate message if any validation fails.
 *
 * @param {string} input - The player name to validate.
 * @return {boolean} - Returns true if the input is valid, otherwise false.
 */
function validateInputString(input) {

    const regex = /^[a-zA-Z]\S*$/;
    
    if (!input || input == "") {
        alert('Player name cannot be empty.');
        return false;
    }
    if (input.length > 10) {
        alert('Player name too long.');
        return false;
    }
    if (players.includes(input)) {
        alert(`The name "${input}" is already taken. Please choose another.`);

        // showAlert("The name " + input + " is already taken. Please choose another." , 'danger');
        return false;
    }
    if (regex.test(input)) {
        return true;
    } else {
        alert('Invalid Player Name');
        return false;
    }
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
        // const playerName = playerNameInput.value.trim();
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
        // Check if the response is OK (status code 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Try to parse the JSON response
        const parsedjson = await response.json();

        // Ensure there's a details-section element
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
        console.error('Error fetching tournament bracket:', error);
    }
}



function startFirstMatch() {
    const firstMatchElement = document.querySelector('.round-one .matches .matchup');
    matchElement = document.querySelector('.round-one .matchup');
    if (matchElement) {
        player1 = matchElement.querySelector('.team-top').innerText;
        player2 = matchElement.querySelector('.team-bottom').innerText;
        const matchId = matchElement.getAttribute('.matchup');
        removeBtnContainer(startTrounBtn);
        startMatch(player1, player2, matchElement);
    }
}

function updateScores(matchElement, player1_score, player2_score) {
    const player1ScoreInput = matchElement.querySelector('.team-top .score-input');
    const player2ScoreInput = matchElement.querySelector('.team-bottom .score-input');
    
    player1ScoreInput.value = player1_score;
    player2ScoreInput.value = player2_score;

    // Check if the match is not in the championship final
    if (!matchElement.closest('.champion')) {
        // Proceed with updating the next round and starting the next match
        updateNextRound(matchElement);
        if (isOnlineTrounament)
            return;
        nextGameBtn = getBtnContainer('nextGame', 'Next Match', startNextMatch, matchElement);
        appendToContainer(nextGameBtn, 'my-5.main-section');
        
        // setTimeout(() => {
        //     startNextMatch(matchElement);
        // }, 10000);
    } else {
        if (isOnlineTrounament) {
            isOnlineTrounament = false;
        }
        console.log("This is the final game. The tournament is complete.");
        // Additional actions when the tournament is complete can be added here
    }
}


function updateBracket(matchElement, winner) {
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

function startNextMatch(currentMatchElement) {
    // Find the next match in the same round
    matchElement = getNextMatchInSameRound(currentMatchElement);
    if (matchElement) {
        player1 = matchElement.querySelector('.team-top').innerText.trim();
        player2 = matchElement.querySelector('.team-bottom').innerText.trim();
        removeBtnContainer(nextGameBtn);
        startMatch(player1, player2, matchElement);
    }
}

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

    // Locate the index of the current match within the current split
    const currentIndex = allMatchesInCurrentSplit.indexOf(currentMatchElement);
    if (currentIndex === -1) {
        return null;
    }

    // Check for the next match in the same split
    if (currentIndex + 1 < allMatchesInCurrentSplit.length) {
        return allMatchesInCurrentSplit[currentIndex + 1];
    }

    // If no more matches in the current split, check the other split within the same round
    let otherSplit = null;

    if (currentSplit.classList.contains('split-one')) {
        otherSplit = currentRound.closest('.custom-container').querySelector('.split-two');
    }

    if (otherSplit) {
        const otherSplitMatches = Array.from(otherSplit.querySelectorAll('.round .matchup'));
        const otherRoundMatches = otherSplitMatches.filter(match => {
            return match.closest('.round').classList.toString() === currentRound.classList.toString();
        });
        if (otherRoundMatches.length > 0) {
            return otherRoundMatches[0];
        }
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
        if (nextRoundMatches.length > 0) {
            return nextRoundMatches[0];
        }
    }

    // If next round is not found, check for the final championship round
    const container = currentRound.closest('.custom-container');
    const finalRound = container.querySelector('.champion .final');
    if (finalRound) {
        const finalRoundMatches = Array.from(finalRound.querySelectorAll('.matchup'));
        if (finalRoundMatches.length > 0) {
            return finalRoundMatches[0];
        }
    }

    // No next match found
    return null;
}





function getNextMatchElement(currentMatchElement) {
    // Check if we are in the championship round
    const currentSplit = currentMatchElement.closest('.split');
    let nextMatchElement = null;

    if (currentSplit.nextElementSibling) {
        // Check for the next match in the same split (next round)
        nextMatchElement = currentSplit.nextElementSibling.querySelector('.matches .matchup');
    } else {
        // Move to the championship if there is no next split
        const championshipMatchElement = document.querySelector('.champion .matches .matchup');
        if (championshipMatchElement) {
            nextMatchElement = championshipMatchElement;
        }
    }
    
    return nextMatchElement;
}

function updateNextRound(currentMatchup) {

  // Get the teams and scores for the current matchup
  var teamTop = currentMatchup.querySelector(".team-top");
  var teamBottom = currentMatchup.querySelector(".team-bottom");
  var scoreTop = parseFloat(teamTop.querySelector(".score-input").value);
  var scoreBottom = parseFloat(teamBottom.querySelector(".score-input").value);

  // Determine the winner and update the next round
  if (!isNaN(scoreTop) && !isNaN(scoreBottom)) {
    var winner = scoreTop > scoreBottom ? teamTop : teamBottom;
    var loser = scoreTop > scoreBottom ? teamBottom : teamTop;

    updateNextMatchup(winner, loser);
  }
}

function updateMatchCell(nextCell, winnerName, winnerImg, winnerScore) {
    nextCell.innerHTML = "";
    nextCell.appendChild(winnerImg);
    nextCell.appendChild(winnerName);
    // nextCell.insertAdjacentHTML("beforeend", winnerName);
    nextCell.insertAdjacentHTML("beforeend", `<input class="score-input" type="number" value="${winnerScore}" disabled>`);
}

function updateNextMatchup(winner, loser) {
    // Find the current round
    var currentRound = winner.closest(".round");
    
    // Find the index of the current matchup within its round
    var currentMatchupIndex = Array.from(currentRound.querySelectorAll(".matchup")).indexOf(winner.closest(".matchup"));

    // Determine whether it's the left or right side
    var isLeftSide = winner.closest(".split").classList.contains("split-one");

    // Find the next round
    var nextRound = isLeftSide ? currentRound.nextElementSibling : currentRound.previousElementSibling;
    var winnerImg = winner.querySelector("img").cloneNode(true);
    var winnerName = winner.querySelector(".player-name").cloneNode(true);
    // var winnerName = winner.textContent.trim();
        
    var winnerScore = "";

    // Check if the next round and matchup exist
    if (nextRound) {
        // Find the correct matchup in the next round based on the index
        var nextMatchups = nextRound.querySelectorAll(".matchup");
        var nextMatchupIndex = Math.floor(currentMatchupIndex / 2);
        var nextMatchup = nextMatchups[nextMatchupIndex];
        if (isOnlineTrounament) {
            updatedMatchup = nextMatchup;    
        }

        // Update the matchup with the winner and clear the loser
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
        if (isOnlineTrounament) {
            updatedMatchup = championshipMatchup;
        }

        // Set the championship teams' content and score inputs
        if (isLeftSide) {
            updateMatchCell(championshipTeamTop, winnerName, winnerImg, winnerScore);
        }
        else {
            updateMatchCell(championshipTeamBottom, winnerName, winnerImg, winnerScore);
        }
    }
}

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

    // const player1_score = p1score; // Example score
    // const player2_score = p2score; // Example score

    isIntournament = false;
    updateScores(matchElement, player1_score, player2_score);
}


async function startMatch(player1, player2, matchElement) {
    // displayMatchModal(player1, player2);
    mainSection = document.querySelector('.main-section');
    const mainContainer = document.getElementById('main-container');
    mainSection.style.display = 'none';
    
    // await new Promise(resolve => setTimeout(resolve, 1000));
    const csrftoken = getCookie('csrftoken');

    try {
        // Make a request to the backend to get the local game page
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

        // Select the tournament section from the parsed HTML content
        tournamentSection = parsedHtml.getElementById('tournament');
        // Select and remove the buttons from the parsed HTML content
        const restartButton = parsedHtml.getElementById('restart_btn');
        const quitButton = parsedHtml.getElementById('quit_game');

        if (restartButton && restartButton.parentNode) {
            restartButton.parentNode.removeChild(restartButton);
        }

        if (quitButton && quitButton.parentNode) {
            quitButton.parentNode.removeChild(quitButton);
        }

        // Append the tournament section before the footer
        mainContainer.appendChild(tournamentSection);
        const customizeDialog = document.getElementById('customizeDialog');
        customizeDialog.style.display = 'none';
        displayMatchModal(player1, player2);
    } catch (error) {
        console.error('Error fetching local game page:', error);
    }
}

function changeRoundStyle() {
    const roundOneMatchup = document.querySelectorAll('.round-one .matchup');
    console.log(roundOneMatchup);
    

    // roundOneMatchup.classList.add('flex-mode');
    roundOneMatchup.forEach(matchup => {
        matchup.classList.add('flex-mode');
    });

}

function changeSplitStyle() {
    const splits = document.querySelectorAll('.split');
    console.log(splits);
    

    // roundOneMatchup.classList.add('flex-mode');
    splits.forEach(matchup => {
        matchup.classList.add('split-four-p');
    });

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
 * Logs a message to the console indicating the spinner is being hidden.
 *
 * @return {void}
 */

  function hideSpinner() {
    const spinnerOverlay = document.getElementById('spinner-overlay');
    console.log("hidding the Spinner");
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