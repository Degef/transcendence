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
    
    console.log('even [' , event);

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




function displayMatchInvitation(matchRoom, opponent, socket) {
    console.log("match_room: ", matchRoom);
    // Create modal elements
    const modal = document.createElement('div');
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

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = 'black';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '5px';
    modalContent.style.textAlign = 'center';

    const modalMessage = document.createElement('p');
    modalMessage.textContent = `You are invited to join the game room to play with ${opponent}`;
    

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Join Game';
    confirmButton.onclick = function() {
        console.log('click join Game');
        socket.send(JSON.stringify({
            type: 'confirm_match_join',
            match_room: matchRoom,

        }));
        document.body.removeChild(modal);
    };

    modalContent.appendChild(modalMessage);
    modalContent.appendChild(confirmButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}





function fourPlayers() {

    const socket = new WebSocket(`ws://${window.location.host}/ws/tournament/`);

    socket.onopen = function() {
        console.log('WebSocket connection established.');
        sendMessage('join_tournament');
    };
    // Log messages from the server
    // socket.onmessage = function(event) {
    //     const message = JSON.parse(event.data);
    //     console.log('Message from server:', message);
    // };
    
    socket.onmessage = function(e) {
        let res = JSON.parse(e.data);
        console.log('Data:', res);
        // if (data.type === 'join_msg') {
        //     console.log(data.message);
        // }
        if (res['type'] == 'playerId') {
            data['playerId'] = res['playerId'];
        }
    
        if (res.type === 'html_content') {
            const parser = new DOMParser();
            const parsedHtml = parser.parseFromString(res.html, 'text/html');
            
            
            // Extract the new content to replace the details-section
            const newContent = parsedHtml.getElementById('bracket');
            // console.log( "[ " , data.html, " ]");
            // document.open();
            // document.write(data.html);
            // document.close();
            if (newContent) {
                const detailsSection = document.querySelector('.details-section');
                if (detailsSection) {
                    detailsSection.innerHTML = newContent.outerHTML;
                } else {
                    console.error('details-section not found in the current document');
                }
            } else {
                console.error('details-section not found in the received HTML content');
            }
        }
        if (res.type === 'game_start') {
            matchName = data.match_name;
            player1 = res.player1;
            player2 = res.player2;
            document.getElementById('start_game_btn').style.display = 'block';
        }
        if (res.type === 'match_invitation') {
            console.log('Match Invitation Data:', res); 
            displayMatchInvitation(res.match_room, res.opponent, socket);
        }
        if (res.type === 'load_game') {
            // console.log('Load_Game Data:', data);
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
        if (res.type === 'gameState') {
            start_play_onl_tour(e, socket)
        }
        if (res.type === 'waiting_for_opponent') {
            console.log('Waiting_Message Data:', res);
        }
        if (res.type === 'match_result') {
            alert(`Match result: ${res.result.winner.username} won against ${res.result.loser.username}`);
            // Redirect back to the tournament bracket
            window.location.href = '/tournament_bracket_url';  // Replace with the actual URL
        }
        if (res.type === 'confirmed_players_list') {
            console.log('Confirmed_ps:', res);
        }
    }
    


    socket.onclose = function(event) {
        console.log('WebSocket connection closed:', event);
        // history.back();
    };
    
    // Send messages to the server
    function sendMessage(type) {
        const message = { type: type };
        console.log("sending messgesage to server");
        console.log(type);
        socket.send(JSON.stringify(message));
    }

}