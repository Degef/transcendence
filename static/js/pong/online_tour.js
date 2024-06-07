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



function fourPlayers() {

    const socket = new WebSocket(`ws://${window.location.host}/ws/tournament/`);

    socket.onopen = function() {
        console.log('WebSocket connection established.');
        sendMessage({ action: 'join_tournament'});
    };
    // Log messages from the server
    // socket.onmessage = function(event) {
    //     const message = JSON.parse(event.data);
    //     console.log('Message from server:', message);
    // };
    
    socket.onmessage = function(e) {
        let data = JSON.parse(e.data);
        console.log('Data:', data);
    
        if (data.type === 'html_content') {
            const parser = new DOMParser();
            const parsedHtml = parser.parseFromString(data.html, 'text/html');
            
            // Extract the new content to replace the details-section
            const newContent = parsedHtml.getElementById('bracket');
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
            // Redirect player to match room
            // window.location.href = `/match/${data.match_room}/`;
        }
        if (data.type === 'match_result') {
            alert(`Match result: ${data.result.winner.username} won against ${data.result.loser.username}`);
            // Redirect back to the tournament bracket
            window.location.href = '/tournament_bracket_url';  // Replace with the actual URL
        }
    }
    


    socket.onclose = function(event) {
        console.log('WebSocket connection closed:', event);
    };
    
    // Send messages to the server
    function sendMessage(message) {
        console.log("sending messgesage to server");
        console.log(message);
        socket.send(JSON.stringify(message));
    }

}