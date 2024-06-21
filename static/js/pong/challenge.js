let challengeSocket = null;
let sessionKeyChall = null;
let currentUserChall = '';
let profileimageChall = '';
let challenger = '';
let challenged_username = '';
let challenger_username = '';


var decline_modal =  function getDeclineModal(message) {
	declineModal = `
		<div id="custom-decline" class="modal" tabindex="-1">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-body">
						<p id="decline-msg" class="text-large">${message}</p>
					</div>
					<div class="modal-footer">
						<button id="decline-close-button" class="btn btn-outline-light btn-lg mb-3" data-dismiss="modal">Close</button>
					</div>
				</div>
			</div>
		</div>
	`;
	return declineModal;
}

function showDeclinedModal(message) {
	const modalHTML = decline_modal(message);
	$(modalHTML).appendTo('body');

	// if (typeof $ !== 'undefined') {
	// 	$('#custom-decline').modal('show');
	// }
	$('#custom-decline').modal('show');

    const declineButton = document.getElementById('decline-close-button');
    function hideModal(event) {
        event.preventDefault();
        console.log(event);
        $('#custom-decline').modal('hide');
        declineButton.removeEventListener('click', hideModal);
    }
	declineButton.addEventListener('click', hideModal);
}

async function getCurrentUserr() {
	try {
		const response = await fetch('/get_current_user/');
		const data = await response.json();
		if (data.error) {
			showAlert(data.error, 'danger');
			return;
		}
		currentUserChall = data.currentUser;
		profileimageChall = data.currentUserImage;
		sessionKeyChall = data.sessionKey;

	} catch (error) {
		showAlert('Unknown error occurred', 'danger');
	}
}

function handleChallengeSocketEvents(challsocket) {
	challsocket.onmessage = function (event) {
		const data = JSON.parse(event.data);
		if (data.id) {
			return;
		}
		if (data.error) {
			showAlert(data.error, 'danger');
			return;
		}
		const message_json = data;
		challenger = message_json.challenger;
		challenger_username = challenger;
		challenged_username = message_json.challengee
		console.log('challengee', challenged_username);
		console.log('challenger', challenger_username);
		if (message_json.type === 'challenge_created') {
			username = currentUserChall;
			if (message_json.challenger === currentUserChall) {
				showAlert('Challenge sent successfully', 'success');
			} else {
				customConfirm(message_json.challenger + " is challenging you to pong game right now. Do you accept?", respondChallenge, respondChallenge);
			}
		} else if (message_json.type === 'challenge_accepted') {
			if (message_json.challenger === currentUserChall) {
				showAlert(message_json.challengee + ' accepted your challenge', 'success');
				handleRoute('/play_online/')
			} else {
				showAlert('Starting game with ' + message_json.challenger, 'success');
				handleRoute('/play_online/')
			}
		} else if (message_json.type === 'challenge_declined') {
			if (message_json.challenger === currentUserChall) {
				showAlert(message_json.challengee + ' declined your challenge', 'danger');
				// customDeclineMsg(message_json.challengee + " declined your challenge!!!");
				showDeclinedModal(message_json.challengee + " declined your challenge!!!");
				// showDeclinedModal();
				return;
			}
		}
	};

	challsocket.onclose = function () {
		cleanupWebSocket(challsocket);
		showAlert('Connection to challenge socket closed, please refresh the page and try again', 'danger');
	};

	challsocket.onerror = function (error) {
		showAlert('Failed to connect to challenge socket, please refresh the page and try again', 'danger');
	};
}

function cleanupWebSocket(challsocket) {
	challsocket.onopen = null;
	challsocket.onmessage = null;
	challsocket.onerror = null;
	challsocket.onclose = null;
}

async function initializeChallengeSocket() {
	await getCurrentUserr();

	if (sessionKeyChall) {
		challengeSocket = new WebSocket(`wss://${window.location.host}/ws/challenge/`);
		handleChallengeSocketEvents(challengeSocket);
	}
}

function customConfirm(message, onAccept, onDecline) {
	const modal = document.getElementById('custom-confirm');
	const messageElement = document.getElementById('challenge-message');
	const acceptButton = document.getElementById('accept-button');
	const declineButton = document.getElementById('decline-button');

	messageElement.innerText = message;

	acceptButton.onclick = function() {
		modal.style.display = "none";
		onAccept(challenger, 'accept');
	};

	declineButton.onclick = function() {
		modal.style.display = "none";
		onDecline(challenger, 'decline');
	};

	modal.style.display = "block";
}
function customDeclineMsg(message) {
    const modal = document.getElementById('custom-decline');
    const messageElement = document.getElementById('decline-msg');
	console.log(messageElement);
    const closeBtn = document.getElementById('decline-close-button');
  
    messageElement.innerText = message;
  
    closeBtn.onclick = function() {
        modal.style.display = "none";
    };

    modal.style.display = "block";
}

function challengeUser(username) {
	if (!username) {
		showAlert('Invalid way to challenge', 'danger');
		return;
	}
	if (username == currentUserChall) {
		showAlert('You cannot challenge yourself', 'danger');
		return;
	}
	if (challengeSocket && challengeSocket.readyState === WebSocket.OPEN) {
		challengeSocket.send(JSON.stringify({ action: 'send_challenge', username: username }));
	} else {
		showAlert('Failed to initiate challenge, please refresh the page and try again', 'danger');
	}
}

function respondChallenge(username, response) {
	if (challengeSocket && challengeSocket.readyState === WebSocket.OPEN) {
		challengeSocket.send(JSON.stringify({ action: 'respond_challenge', username: username, response: response }));
	} else {
		showAlert('Failed to respond to challenge, please refresh the page and try again', 'danger');
	}
}

initializeChallengeSocket();
