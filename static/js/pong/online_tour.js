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


function displayMatchInvitation(matchRoom, opponent, socket) {
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
        let data = JSON.parse(e.data);
        // console.log('Data:', data);
        // if (data.type === 'join_msg') {
        //     console.log(data.message);
        // }
    
        if (data.type === 'html_content') {
            const parser = new DOMParser();
            const parsedHtml = parser.parseFromString(data.html, 'text/html');
            
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
        if (data.type === 'game_start') {
            matchName = data.match_name;
            player1 = data.player1;
            player2 = data.player2;
            document.getElementById('start_game_btn').style.display = 'block';
        }
        if (data.type === 'match_invitation') {
            console.log('Match Invitation Data:', data); 
            displayMatchInvitation(data.match_room, data.opponent, socket);
        }
        if (data.type === 'load_game') {
            console.log('Load_Game Data:', data);
        }
        if (data.type === 'waiting_message') {
            console.log('Waiting_Message Data:', data);
        }
        if (data.type === 'match_result') {
            alert(`Match result: ${data.result.winner.username} won against ${data.result.loser.username}`);
            // Redirect back to the tournament bracket
            window.location.href = '/tournament_bracket_url';  // Replace with the actual URL
        }
        if (data.type === 'confirmed_players_list') {
            console.log('Confirmed_ps:', data);
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