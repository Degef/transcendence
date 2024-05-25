let currentRecipient = '';
let miniImage = '';
let sessionKey = '';
let currentUser = '';
let profileimage = '';
let socket = null;

const api = {
	fetchCurrentUser: () => fetch('get_current_user/').then(response => response.json()),
	fetchUserProfile: username => fetch(`api/user/${username}/`).then(response => response.json()),
	fetchMessages: recipient => fetch(`api/message/?target=${recipient}`).then(response => response.json()),
	fetchMessageById: id => fetch(`api/message/${id}/`).then(response => response.json()),
	sendMessage: message => fetch('api/message/', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(message)
	}),
	blockUser: username => fetch('block_unblock/', {
		method: "POST",
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ 'username': username })
	}).then(response => {
		if (!response.ok) return response.json().then(data => { throw new Error(data.Error); });
		return response.json();
	})
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
	getCurrentUser().then(() => setupWebSocket());

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
		api.sendMessage(message)
			.then(() => {
				chatInput.value = '';
				drawMessage(message); // Draw the message immediately after sending
			})
			.catch(utils.logError);
	}
}

function handleChatInputKeydown(event, chatForm) {
	if (event.key === 'Enter') {
		event.preventDefault();
		chatForm.dispatchEvent(new Event('submit'));
	}
}

function setupWebSocket() {
	if (socket && socket.readyState === WebSocket.OPEN) return;

	socket = new WebSocket(`ws://${window.location.host}/ws?session_key=${sessionKey}/`);
	socket.onopen = () => console.log('WebSocket connection established');
	socket.onmessage = event => {
		getMessageById(event.data);
		console.log('Message received:', event.data);
	};
	socket.onerror = event => console.error('WebSocket error:', event);
	socket.onclose = () => console.log('WebSocket connection closed');
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
	if (!dropdownMenu.contains(event.target)) {
		dropdownMenu.classList.remove('show');
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
	document.getElementById('invite-to-game').onclick = () => inviteToGame(username);
}

function viewUserProfile(username) {
	api.fetchUserProfile(username)
		.then(userProfile => viewUserProfile(userProfile))
		.catch(utils.logError);
	document.getElementById('dropdownMenu').classList.remove('show');
}

function blockUser(username) {
	api.blockUser(username)
		.then(data => console.log(data.Success))
		.catch(handleBlockUserError);
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
	console.error(messages[errorMessage] || 'An unknown error occurred');
}

function drawMessage(message) {
	const isSent = message.user === currentUser;
	const position = isSent ? 'sent-message' : 'received-message';
	const miniProfileImage = isSent ? profileimage : miniImage;

	const messageItem = `
		<div class="message-container ${position}">
			${!isSent ? `<img src="${miniProfileImage}" class="message-avatar" alt="" />` : ''}
			<div class="message-content">
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
	const id = JSON.parse(message).message;
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
	console.info("Setting up search functionality");
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
									<div class="contact-info">
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

window.addEventListener('DOMContentLoaded', function (event) {
	if (window.location.pathname === '/chat/') {
		setTimeout(initializeChat, 1000);
	}
});
