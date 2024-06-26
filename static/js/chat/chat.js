let currentRecipient = '';
let miniImage = '';
let sessionKey = '';
let currentUser = '';
let profileimage = '';
let chatsocket = null;

const api = {
	fetchCurrentUser: () => fetch('/get_current_user/').then(response => response.json()),
	fetchUserProfile: username => fetch(`/api/user/${username}/`).then(response => response.json()),
	fetchMessages: recipient => fetch(`/api/message/?target=${recipient}`).then(response => response.json()),
	fetchMessageById: id => fetch(`/api/message/${id}/`).then(response => response.json()),
	fetchUserProfilePage: username => handleRoute(`/profile/${username}`, true),
	blockUser: username => fetch('/block_unblock/', {
		method: "POST",
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ 'username': username })
	}).then(response => {
		if (!response.ok) return response.json().then(data => { throw new Error(data.Error); });
		return response.json();
	}),
	unblockUser: username => fetch('/block_unblock/', {
		method: "DELETE",
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ 'username': username })
	}).then(response => {
		if (!response.ok) return response.json().then(data => { throw new Error(data.Error); });
		return response.json();
	})
};

const showAlert = (message, type) => {
	const responseMessageDiv = document.querySelector('.response__message');
	const responseAlert = document.getElementById('responseAlert');
	responseMessageDiv.innerHTML = message;
	responseAlert.classList.remove('d-none', 'alert-success', 'alert-danger', 'show');
	responseAlert.classList.add(`alert-${type}`, 'show');
	setTimeout(() => {
		responseAlert.classList.remove('show');
		setTimeout(() => responseAlert.classList.add('d-none'), 500);
	}, 5000);
};

const utils = {
	sanitizeInput: input => input.replace(/&/g, "&amp;")
								.replace(/</g, "&lt;")
								.replace(/>/g, "&gt;")
								.replace(/"/g, "&quot;")
								.replace(/'/g, "&#x27;")
								.replace(/\//g, "&#x2F;"),
	logError: error => console.error('Error:', error),
};

function initializeChat() {
	getCurrentUser().then(() => setupWebSocket()).catch(utils.logError);

	const chatForm = document.querySelector('.input-wrapper');
	if (chatForm) {
		const chatInput = document.querySelector('.message-input');
		chatForm.addEventListener('submit', event => handleChatFormSubmit(event, chatInput, chatForm));
		chatInput.addEventListener('keydown', event => handleChatInputKeydown(event, chatForm));
	}

	handleUserSelection();
	setupSearchFunctionality();
}

function getCurrentUser() {
	return api.fetchCurrentUser()
		.then(data => {
			currentUser = data.currentUser;
			profileimage = data.currentUserImage;
			sessionKey = data.sessionKey;
		})
		.catch(utils.logError);
}

function handleChatFormSubmit(event, chatInput, chatForm) {
	event.preventDefault();
	const sanitizedInput = utils.sanitizeInput(chatInput.value);
	if (sanitizedInput.length > 0) {
		const message = { recipient: currentRecipient, body: sanitizedInput, user: currentUser };
		chatsocket.send(JSON.stringify(message));
		chatInput.value = '';
	}
}


function handleChatInputKeydown(event, chatForm) {
	if (event.key === 'Enter') {
		event.preventDefault();
		chatForm.dispatchEvent(new Event('submit'));
	}
}

function setupWebSocket() {
	if (chatsocket && chatsocket.readyState === WebSocket.OPEN) chatsocket.close();

	chatsocket = new WebSocket(`wss://${window.location.host}/ws/chat/`);
	chatsocket.onmessage = event => {
		getMessageById(event.data);
	};
	chatsocket.onerror = event => console.error('WebSocket error:', event);
	chatsocket.onclose = () => cleanupWebSocket(chatsocket);
}

function handleUserSelection() {
	const userList = document.getElementById('user-listt');
	if (!userList) return;

	const userItems = userList.querySelectorAll('#user-list-link');
	userItems.forEach(userItem => {
		userItem.addEventListener('click', event => handleUserItemClick(event, userItem, userItems));
		const contactAction = userItem.querySelector('.contact-action');
		contactAction.addEventListener('click', event => handleContactActionClick(event, contactAction));
	});

	document.addEventListener('click', event => handleDocumentClick(event));
}

function handleUserItemClick(event, userItem, userItems) {
	event.preventDefault();
	userItems.forEach(child => child.classList.remove('active'));
	userItem.classList.add('active');
	const username = userItem.querySelector('.contact-name').innerText.trim();

	api.fetchUserProfile(username)
		.then(userProfile => setCurrentRecipient(userProfile))
		.catch(utils.logError);
}

function handleContactActionClick(event, contactAction) {
	event.preventDefault();
	event.stopPropagation();
	const username = contactAction.getAttribute('data-username');
	showDropdownMenu(contactAction, username);
}

function handleDocumentClick(event) {
	const dropdownMenu = document.getElementById('dropdownMenu');
	if (dropdownMenu) {
		if (!dropdownMenu.contains(event.target)) {
			dropdownMenu.classList.remove('show');
		}
	}
}

function showDropdownMenu(target, username) {
	const dropdownMenu = document.getElementById('dropdownMenu');
	const rect = target.getBoundingClientRect();

	dropdownMenu.style.top = `${rect.bottom + window.scrollY}px`;
	dropdownMenu.style.left = `${rect.left + window.scrollX - dropdownMenu.offsetWidth + rect.width}px`;
	dropdownMenu.classList.add('show');

	document.getElementById('view-profile').onclick = () => viewUserProfile(username);
	document.getElementById('block-user').onclick = () => blockUser(username);
	document.getElementById('unblock-user').onclick = () => unblockUser(username);
	document.getElementById('invite-to-game').onclick = () => challengeUser(username);
}

function viewUserProfile(username) {
	api.fetchUserProfilePage(username);
	document.getElementById('dropdownMenu').classList.remove('show');
}

function blockUser(username) {
	api.blockUser(username)
		.then(data => showAlert(data.Success, 'success'))
		.catch(error => showAlert(error.message, 'danger'));
	document.getElementById('dropdownMenu').classList.remove('show');
}

function unblockUser(username) {
	api.unblockUser(username)
		.then(data => showAlert(data.Success, 'success'))
		.catch(error => showAlert(error.message, 'danger'));
	document.getElementById('dropdownMenu').classList.remove('show');
}

function handleBlockUserError(error) {
	const errorMessage = error.message;
	console.error(errorMessage);
	const messages = {
		'Cannot block yourself': 'You cannot block yourself',
		'User is already blocked': 'User is already blocked',
		'Invalid request data': 'Invalid request data',
		'Invalid request method': 'Invalid request method',
	};
	// console.error(messages[errorMessage] || 'An unknown error occurred');
}

function drawMessage(message) {
	const isSent = message.user === currentUser;
	const position = isSent ? 'sent-message' : 'received-message';
	const miniProfileImage = isSent ? profileimage : miniImage;

	const messageItem = `
		<div class="message-container ${position} d-flex align-items-center">
			${!isSent ? `<img src="${miniProfileImage}" class="message-avatar" alt="" />` : ''}
			<div class="message-content d-flex flex-column">
				<div class="message-author">${message.user}</div>
				<div class="message-text">${message.body}</div>
			</div>
			${isSent ? `<img src="${miniProfileImage}" class="message-avatar" alt="" />` : ''}
		</div>`;

	const messageList = document.querySelector('.chat');
	messageList.innerHTML += messageItem;
	messageList.scrollTop = messageList.scrollHeight;
}

function getConversation(recipient) {
	const messageList = document.querySelector('.chat');
	messageList.innerHTML = "";

	api.fetchMessages(recipient)
		.then(data => {
			messageList.innerHTML = "";
			data.results.reverse().forEach(message => drawMessage(message));
			messageList.scrollTop = messageList.scrollHeight;
		})
		.catch(utils.logError)
		.finally(() => messageList.scrollTop = messageList.scrollHeight);
}

function getMessageById(message) {
	if (JSON.parse(message).error) {
		showAlert(JSON.parse(message).error, 'danger');
		return;
	}
	const id = JSON.parse(message).message.id;
	if (!id) return;
	const messageList = document.querySelector('.chat');

	api.fetchMessageById(id)
		.then(data => {
			if (data.user === currentRecipient || (data.recipient === currentRecipient && data.user === currentUser)) {
				drawMessage(data);
			}
			messageList.scrollTop = messageList.scrollHeight;
		})
		.catch(utils.logError);
}

function setCurrentRecipient(userData) {
	const chatHeader = document.querySelector('.chat-header');
	const messageList = document.querySelector('.chat');
	miniImage = userData.profile.image;
	currentRecipient = userData.username;

	chatHeader.textContent = `Chat with ${currentRecipient}`;
	messageList.innerHTML = "";

	getConversation(currentRecipient);
}

function setupSearchFunctionality() {
	const userList = document.getElementById("user-listt");
	const searchInput = document.querySelector(".search-input");

	if (!userList) return;

	const originalUserNames = Array.from(userList.children).map(user => user.querySelector('.contact-name').textContent.trim());

	searchInput.addEventListener("input", function () {
		const searchText = searchInput.value.toLowerCase();
		filterUsers(searchText);
	});

	function filterUsers(searchText) {
		const filteredUserNames = originalUserNames.filter(userName => userName.toLowerCase().includes(searchText));
		displayFilteredUsers(filteredUserNames);
	}

	function displayFilteredUsers(filteredUserNames) {
		userList.innerHTML = "";
		filteredUserNames.forEach(userName => {
			const listItem = document.createElement("a");
			listItem.classList.add("list-group-item");
			listItem.innerHTML = `<div class="contact-details">
									<img src="" alt="${userName}" class="contact-profile-image">
									<div class="contact-info d-flex flex-column justify-content-center">
										<div class="contact-name">${userName}</div>
									</div>
									<i class="fas fa-ellipsis-v contact-action" data-username="${userName}"></i>
								</div>`;
			listItem.addEventListener("click", () => fetchUserProfileAndSetRecipient(userName));
			userList.appendChild(listItem);
		});
	}
}

function fetchUserProfileAndSetRecipient(userName) {
	api.fetchUserProfile(userName)
		.then(userProfile => setCurrentRecipient(userProfile))
		.catch(utils.logError);
}
