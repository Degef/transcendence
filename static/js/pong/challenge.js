let challengeSocket = null;
let sessionKeyChall = null;
let currentUserChall = '';
let profileimageChall = '';
let challenger = '';
let challenged_username = '';
let challenger_username = '';
let challTabIdTmp = null;
const tabId = Math.random().toString(36).substr(2, 9);

/**
 * Generates the HTML for a decline modal with the provided message.
 * Constructs a modal with a specified message and returns it as a string.
 * 
 * @param {string} message - The message to display in the decline modal.
 * @return {string} - The HTML string for the decline modal.
 */
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


/**
 * Displays a declined modal with the provided message.
 * Appends the modal to the body only if the modal with id 'custom-decline' is not already present,
 * otherwise shows the existing modal.
 * Adds an event listener to hide the modal when the close button is clicked.
 * 
 * @param {string} message - The message to display in the declined modal.
 * @return {void}
 */
function showDeclinedModal(message) {

    const modalHTML = decline_modal(message);
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('custom-decline');
    modal.style.display = 'block';

    const declineButton = document.getElementById('decline-close-button');
    function hideModal(event) {
        event.preventDefault();
        modal.style.display = 'none';
        declineButton.removeEventListener('click', hideModal);
        modal.remove();
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
		if (message_json.type === 'challenge_created') {
			challenger_tabId = message_json.challenger_tabId;
			challTabIdTmp = challenger_tabId;
			username = currentUserChall;
			if (message_json.challenger === currentUserChall) {
				showAlert('Challenge sent successfully', 'success');
			} else {
				addToNotificationsList(`${message_json.challenger} is challenging you to a pong game right now.`);
				customConfirm(message_json.challenger + " is challenging you to pong game right now. Do you accept?", respondChallenge, respondChallenge, challenger_tabId);
			}
		} else if (message_json.type === 'challenge_accepted') {
			challTabIdTmp = null;
			if (message_json.challenger === currentUserChall) {
				if (message_json.challenger_tabId === tabId) { 
					showAlert(message_json.challengee + ' accepted your challenge', 'success');
					type = 'challenge';
					handleRoute('/play_online/');
					start_play_online_challenge(challenged_username, challenger_username, username);
				} else {
					hideChallengeModal();
				}
			} else {
				if (data.tab_id === tabId) {
					showAlert('Starting game with ' + message_json.challenger, 'success');
					type = 'challenge';
					handleRoute('/play_online/');
					start_play_online_challenge(challenged_username, challenger_username, username);
				} else {
					hideChallengeModal();
				}
			}
		} else if (message_json.type === 'challenge_declined') {
			challTabIdTmp = null;
			if (message_json.challenger === currentUserChall) {
				if (message_json.challenger_tabId === tabId) {
					showAlert(message_json.challengee + ' declined your challenge', 'danger');
					showDeclinedModal(message_json.challengee + " declined your challenge!!!");
				}
				return;
			} else { 
				hideChallengeModal();
			}
		}
	};

	challsocket.onclose = function () {
		cleanupWebSocket(challsocket);
		if (!reloading)
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
	// const gameSocket = new WebSocket(`wss://${window.location.host}/ws/challenge/?tab_id=${tabId}`);
	if (sessionKeyChall) {
		// challengeSocket = new WebSocket(`wss://${window.location.host}/ws/challenge/`);
		challengeSocket = new WebSocket(`wss://${window.location.host}/ws/challenge/${tabId}/`);
		handleChallengeSocketEvents(challengeSocket);
	}
}

/**
 * Handles the decline action if the custom confirmation modal is visible
 * when a popstate or page reload event occurs.
 *
 * @param {Function} onDecline - The function to call when declining the challenge.
 */

function handleDeclineOnUnload(onDecline, challTabIdTmp) {
	const modal = document.getElementById('custom-confirm');
	if (modal && modal.style.display === "block") {
		modal.style.display = "none";
		onDecline(challenger, 'decline', challTabIdTmp);
	}
}

function hideChallengeModal() {
	const modal = document.getElementById('custom-confirm');
	if (modal && modal.style.display === "block") {
		modal.style.display = "none";
	}
}

/**
 * Displays a custom confirmation modal with the provided message.
 * Sets the provided message in the modal, and defines actions for accept and decline buttons.
 * When the accept button is clicked, the onAccept callback is triggered and the modal is hidden.
 * When the decline button is clicked, the onDecline callback is triggered and the modal is hidden.
 * 
 * @param {string} message - The message to display in the confirmation modal.
 * @param {function} onAccept - The callback function to execute when the accept button is clicked.
 * @param {function} onDecline - The callback function to execute when the decline button is clicked.
 * @return {void}
 */
function customConfirm(message, onAccept, onDecline, challenger_tabId) {
	const modal = document.getElementById('custom-confirm');
	const messageElement = document.getElementById('challenge-message');
	const acceptButton = document.getElementById('accept-button');
	const declineButton = document.getElementById('decline-button');
	if (window.game_in_progress) {
		if (window.data.playerId != null && window.data.waiting_to_play == true && !window.isOnlineTournament) {
			if (window.data['socket'] && window.data['socket'].readyState === WebSocket.OPEN) {
				hideSpinner();
				window.data['socket'].close()
				window.game_in_progress = false;
			}
		} else {
			onDecline(challenger, 'decline', challenger_tabId);
			return ;
		}
	}

	messageElement.innerText = message;

	acceptButton.onclick = function() {
		modal.style.display = "none";
		onAccept(challenger, 'accept', challenger_tabId);
	};

	declineButton.onclick = function() {
		modal.style.display = "none";
		onDecline(challenger, 'decline', challenger_tabId);
	};

	modal.style.display = "block";
}

/**
 * Displays a custom decline message modal with the provided message.
 * Sets the provided message in the modal, and defines an action for the close button.
 * When the close button is clicked, the modal is hidden.
 * 
 * @param {string} message - The message to display in the decline message modal.
 * @return {void}
 */
function customDeclineMsg(message) {
    const modal = document.getElementById('custom-decline');
    const messageElement = document.getElementById('decline-msg');
    const closeBtn = document.getElementById('decline-close-button');
  
    messageElement.innerText = message;
  
    closeBtn.onclick = function() {
        modal.style.display = "none";
    };

    modal.style.display = "block";
}


/**
 * Sends a challenge to a specified user.
 * Displays an alert if the username is invalid or if the user tries to challenge themselves.
 * Sends a challenge request over a WebSocket connection if it is open.
 * Displays an alert if the WebSocket connection is not open.
 * 
 * @param {string} username - The username of the user to challenge.
 * @return {void}
 */
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

function respondChallenge(username, response, challenger_tabId) {
	if (challengeSocket && challengeSocket.readyState === WebSocket.OPEN) {
		challengeSocket.send(JSON.stringify({ action: 'respond_challenge', username: username, response: response, challenger_tabId: challenger_tabId }));
	} else {
		showAlert('Failed to respond to challenge, please refresh the page and try again', 'danger');
	}
}

initializeChallengeSocket();
