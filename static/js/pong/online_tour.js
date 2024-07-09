let isOnlineTrounament = false;
let match_room = null;
let onlineTourSocket = null;
let matchupElement = null;
let updatedMatchup = null;
let winner = null;
// let username = null;

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
    // displayWinnerModal(winner, p2);
    console.log("score: ", player1, player2);

    if (tournamentSection && tournamentSection.parentNode) {
        tournamentSection.parentNode.removeChild(tournamentSection);
    }
    // Restore the original body content
    mainSection.style.display = 'block';
    const message = {
        'type': 'match_result',
        'player1': p1,
        'player2': p2,
        'score1': s1,
        'score2': s2,
        'matchelement': matchupElement,
        'winner': winner
    };
    console.log("sending.....", message);
    console.log("username: ", username);
    if (username === winner) {
        onlineTourSocket.send(JSON.stringify(message));
    }
    
    // updateScores(matchElement, player1_score, player2_score);

}


function startGame() {
    if (socket && matchName) {
        socket.send(JSON.stringify({
            action: 'start_game',
            match_name: matchName
        }));
    }
}

function playerMove(moveData) {
    if (socket && matchName) {
        socket.send(JSON.stringify({
            action: 'player_move',
            match_name: matchName,
            move_data: moveData
        }));
    }
}

function display_game(event) {
    const mainContainer = document.getElementById('main-container');
    mainSection = document.querySelector('.main-section');
    const parser = new DOMParser();
    const parsedHtml = parser.parseFromString(event.html, 'text/html');
    tournamentSection = parsedHtml.getElementById('tournament');
    // console.log(tournamentSection);

    mainSection.style.display = 'none';
    mainContainer.appendChild(tournamentSection);
}

function start_play_onl_tour(event, socket) {
    if (game_in_progress) {
        return;
    }
    if (challengeInterval != null) {
        clearInterval(challengeInterval);
        challengeInterval = null;
    }
    game_in_progress = true;

    data['socket'] = socket;
    data['hit'] = new Audio();
    data['wall'] = new Audio();
    data['userScore'] = new Audio();
    data['comScore'] = new Audio();

    data['hit'].src = "/media/sounds/hit.mp3";
    data['wall'].src = "/media/sounds/wall.mp3";
    data['userScore'].src = "/media/sounds/userScore.mp3";
    data['comScore'].src = "/media/sounds/comScore.mp3";
    

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
        return ;
        // start_challenge_checking();
    }

    // socket.onclose = function () {
    //     console.log('WebSocket connection closed');
    //     data['endGame'] = true;
    //     data['playerId'] = null;
    //     game_in_progress = false;
    // }

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




// Function to find the correct matchup
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


async function loadTrounametGame(player1,  player2) {
    mainSection = document.querySelector('.main-section');
    const mainContainer = document.getElementById('main-container');
    mainSection.style.display = 'none';
    
    // await new Promise(resolve => setTimeout(resolve, 1000));
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
        displayMatchModal(player1, player2);
        if (!isOnlineTrounament) {
            alert("you just left the tournmanet");
            isOnlineTrounament = false;
            handleRoute('/', true);
            return ;
        }
    } catch (error) {
        console.error('Error fetching local game page:', error);
    }
}


function displayMatchInvitation(matchRoom, opponent, socket, players) {
    console.log("match_room: ", matchRoom);
    match_room = matchRoom;
    // Create modal elements
    if (!isOnlineTrounament) {
        return ;
    }
    const modal = document.createElement('div');
    mainSection = document.querySelector('.main-section');
    modal.id = 'match-invitation-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
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
    if (matchupElement) {
        console.log('Matchup found:', matchupElement);
      } else {
        console.log('No matchup found for the given players.');
      }
      

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Join Game';

    confirmButton.onclick = function() {
        console.log('click join Game');
        document.body.removeChild(modal);
        loadTrounametGame(challenger_username, challenged_username);
        
        // handleRoute('/play_online/');
    };

    modalContent.appendChild(modalMessage);
    modalContent.appendChild(confirmButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

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
    console.log(playernames);
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
        onlineTourSocket.send(JSON.stringify(message));
    }
    if (playernames.includes(winner) && playernames.length === 1) {
        const message = {
            'type': 'next_round_match',
            'player': winner,
            'player1': playernames[0],
            'plcount': 1
        };
        onlineTourSocket.send(JSON.stringify(message));
    }
}


function update_bracket(res) {
    // updateScores(matchupElement, res.score1, res.score2);
    // If the main section is currently displayed
    if (mainSection.style.display === 'block') {
        console.log("mainSection:", mainSection);
        var matchups = document.querySelectorAll('#bracket .matchup');
        matchupElement = findMatchup(res.player1, res.player2, matchups);
        updateScores(matchupElement, res.score1, res.score2);
        mainSection = document.querySelector('.main-section');
        getNextRoundMatch(res);
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
                    observer.disconnect();
                    getNextRoundMatch(res);
                    break;
                }
            }
        });

        observer.observe(mainSection, { attributes: true });
    }

}

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
}



function onlineTournament(tourSize) {

    const socket = new WebSocket(`wss://${window.location.host}/ws/tournament/`);

    socket.onopen = function() {
        console.log('WebSocket connection established.');
        sendMessage('join_tournament', tourSize);
        isOnlineTrounament = true;
    };
    // Log messages from the server
    // socket.onmessage = function(event) {
    //     const message = JSON.parse(event.data);
    //     console.log('Message from server:', message);
    // };
    onlineTourSocket = socket;
    socket.onmessage = function(e) {
        let res = JSON.parse(e.data);
        // console.log('Data:', res);

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
            document.getElementById('start_game_btn').style.display = 'block';
        } else if (res.type === 'match_invitation') {
            username = res.player;
            setTimeout(() => {
                displayMatchInvitation(res.match_room, res.opponent, socket,  res.players);
            }, 10000);
            // displayMatchInvitation(res.match_room, res.opponent, socket,  res.players);
        } else if (res.type === 'update_bracket') {
            console.log('Update_bracket:', res);
            update_bracket(res);
        } else if (res.type === 'opponent_left') {
            console.log(res);
            // onTourGameCompleted(res.player, res.opponent, 4, 0);
        } 
        else if (res.type === 'load_game') {
            console.log('Load_Game Data:', data);
            display_game(res);
            const message = {
                'type': 'startGame',
                'playerId': data['playerId'],
                'paddle': data['paddle'],
                'player': data['player'],
            };
            console.log("data:", data);
            socket.send(JSON.stringify(message))
        }
        else if (res.type === 'gameState') {
            start_play_onl_tour(e, socket)
        }
        else if (res.type === 'waiting_for_opponent') {
            // console.log('Waiting_Message Data:', res);
        }
        else if (res.type === 'match_result') {
            alert(`Match result: ${res.result.winner.username} won against ${res.result.loser.username}`);
            // Redirect back to the tournament bracket
            window.location.href = '/tournament_bracket_url';  // Replace with the actual URL
        }
        else if (res.type === 'confirmed_players_list') {
            // console.log('Confirmed_ps:', res);
        }
    }
    


    socket.onclose = function(event) {
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


function cleanuptour() {
	if (onlineTourSocket) {
		isOnlineTrounament = false;
		onlineTourSocket.onclose = null; // Prevent onclose from being called again
		console.log("Websocket tournament Closed because of popstate");
		mes = {
			'type': 'leaving',
			'playerId': data.playerId,
            'player': username,
            'match_name': match_room
		}
        console.log("msg: ", mes) ;
		onlineTourSocket.send(JSON.stringify(mes));
		if (onlineTourSocket.readyState === WebSocket.OPEN) {
			hideSpinner();
			setTimeout(function() {
				onlineTourSocket.close();
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
    console.log("here-here-here", isOnlineTrounament);
	if (isOnlineTrounament) {
		cleanuptour();
	}
});