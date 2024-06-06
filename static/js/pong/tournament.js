let players = [];
let currentPlayerIndex = 0;
let totalPlayers = 0;

let tournamentSection, mainSection, player1, player2, matchElement;


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function setupTournament(playerCount) {
    players = [];
    currentPlayerIndex = 0;
    totalPlayers = playerCount;
    var tournElementtmp = document.getElementsByClassName("details-section");
    const tournElement = tournElementtmp[0];
    tournElement.innerHTML = `
        <div class="center-container">
            <div id="playerFormContainer" class="input-group mb-3 square-box">
                <h2">Enter Player Names <br></h2>
                <form id="playerForm">
                    <div id="playerInputs">
                        <label for="playerName">Player 1:</label>
                        <input type="text" id="playerName" name="playerName" required>
                    </div>
                    <button type="button" id="submitPlayer">Next</button>
                </form>
            </div>
        </div>
    `;
    const playerFormContainer = document.getElementById('playerFormContainer');
    playerFormContainer.style.display = 'block';
    document.getElementById('submitPlayer').addEventListener('click', submitPlayerName);
    document.getElementById('playerName').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
        }
    });

}




function submitPlayerName(event) {
    if (event.type === 'click' || (event.type === 'keypress' && event.key === 'Enter')) {
        event.preventDefault();
        const playerNameInput = document.getElementById('playerName');
        const playerName = playerNameInput.value.trim();
        playerNameInput.style.display = 'block';

        if (playerName && (!players.includes(playerName)) && !(playerName.length > 10)) {
            players.push(playerName);
            currentPlayerIndex++;
            
            if (currentPlayerIndex < totalPlayers) {
                document.getElementById('playerInputs').innerHTML = `
                    <label for="playerName">Player ${currentPlayerIndex + 1}:</label>
                    <input type="text" id="playerName" name="playerName" required>
                `;
            } else {
                myplayers = shuffleArray(players);
                organizeTournament(myplayers);
            }
        } else if (players.includes(playerName)) {
            alert('Player name taken.');
        } else if (playerName.length > 10) {
            alert('Player name too  long.');
        } else {
            alert('Player name cannot be empty.');
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
        const tournElementtmp = document.getElementsByClassName("details-section");
        if (tournElementtmp.length === 0) {
            throw new Error('No element with class "details-section" found');
        }
        
        const tournElement = tournElementtmp[0];
        tournElement.innerHTML = parsedjson.tournament_bracket;
        startFirstMatch();
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
        setTimeout(() => {
            startNextMatch(matchElement);
        }, 10000);
    } else {
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
    nextCell.insertAdjacentHTML("beforeend", `<input class="score-input" type="number" value="${winnerScore}">`);
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
            // var newScoreInputs = nextMatchup.querySelectorAll(".score-input");
            // createEventListners(newScoreInputs);
        }
    }
    else {
        // If there's no next round, update the championship matchup directly
        var championshipMatchup = document.querySelector(".championship.matchup");
        var championshipTeamTop = championshipMatchup.querySelector(".team-top");
        var championshipTeamBottom = championshipMatchup.querySelector(".team-bottom");

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
    if (tournamentSection && tournamentSection.parentNode) {
        tournamentSection.parentNode.removeChild(tournamentSection);
    }
    // Restore the original body content
    mainSection.style.display = 'block';

    const player1_score = getScoresDisplay('p1');
    const player2_score = getScoresDisplay('p2');
    // const player1_score = p1score; // Example score
    // const player2_score = p2score; // Example score

    const winner = player1_score > player2_score ? player1 : player2;
    isIntournament = false;
    updateScores(matchElement, player1_score, player2_score);
}


async function startMatch(player1, player2, matchElement) {
    mainSection = document.querySelector('.main-section');
    const mainContainer = document.getElementById('main-container');
    setTimeout(() => {
        mainSection.style.display = 'none';
    }, 1000);
    
    // Wait for 10 seconds before hiding the content of the whole page
    await new Promise(resolve => setTimeout(resolve, 1000));
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
    } catch (error) {
        console.error('Error fetching local game page:', error);
    }
}
