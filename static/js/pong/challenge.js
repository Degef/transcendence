let challengeSocket = null;
let sessionKeyChall = '';
let currentUserChall = '';
let profileimageChall = '';

function getCurrentUser() {
	return fetch('/get_current_user/').then(response => response.json())
		.then(data => {
			console.log('Current user:', data.currentUser);
			currentUserChall = data.currentUser;
			profileimageChall = data.currentUserImage;
			sessionKeyChall = data.sessionKey;
		})
		.catch(error => {
			console.error('Error:', error);
		});
}

function initializeChallengeSocket() {
    challengeSocket = new WebSocket(`ws://${window.location.host}/ws/challenge/`);
	getCurrentUser();

    challengeSocket.onopen = function () {
        console.log('Challenge socket opened');
    };

    challengeSocket.onmessage = function (event) {
        const data = JSON.parse(event.data);
		console.log('Challenge socket message:', data);
		let challenger = data.message.split(' ')[0];
		let challenged = data.message.split(' ')[3];
		if (challenger == currentUserChall) {
			console.log('You challenged', challenged);
		}
		else {
			// console.log(challenger, 'challenged you');
			customConfirm(challenger + " is challenging you to pong game rightnow " + '. Do you accept?');
		}
    };

    challengeSocket.onclose = function () {
        console.log('Challenge socket closed');
    };

    challengeSocket.onerror = function (error) {
        console.error('Error:', error);
    };
}

function customConfirm(message) {
    const modal = document.getElementById('custom-confirm');
    const messageElement = document.getElementById('challenge-message');
    const acceptButton = document.getElementById('accept-button');
    const declineButton = document.getElementById('decline-button');
  
    messageElement.innerText = message;
  
    acceptButton.onclick = function() {
        modal.style.display = "none";
        // onAccept();
    };
  
    declineButton.onclick = function() {
        modal.style.display = "none";
        // onDecline();
    };

    modal.style.display = "block";
}

function challengeUser(username) {
    if (challengeSocket && challengeSocket.readyState === WebSocket.OPEN) {
        challengeSocket.send(JSON.stringify({ action: 'send_challenge', username: username }));
    } else {
        console.error('Challenge socket is not open');
    }
}

function respondChallenge(challengeId, response) {
    if (challengeSocket && challengeSocket.readyState === WebSocket.OPEN) {
        challengeSocket.send(JSON.stringify({ action: 'respond_challenge', challenge_id: challengeId, response: response }));
        console.log('Response sent for challenge:', challengeId, 'with response:', response);
    } else {
        console.error('Challenge socket is not open');
    }
}

initializeChallengeSocket();
