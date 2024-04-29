let currentRecipient = '';
let miniImage = '';


function handleUserSelection() {
	setTimeout(function() {
		// console.log(document.body.innerHTML);
		const userList = document.getElementById('user-listt');
		if (userList) {
			const userItems = userList.querySelectorAll('#user-list-link');
			userItems.forEach(userItem => {
				userItem.addEventListener('click', function(event) {
					event.preventDefault();
					userItems.forEach(child => child.classList.remove('active'));
					userItem.classList.add('active');
					const username = userItem.innerText.trim();
					fetch(`api/user/${username}/`)
					.then(response => response.json())
					.then(userProfile => {
						setCurrentRecipient(userProfile);
					})
					.catch(error => {
						console.error('Error fetching user profile:', error);
					});
				});
			});
		} else {
			console.log("Yes it coming here")
		}
	}, 1000);
}


function drawMessage(message) {
	let position = 'sent';
	const date = new Date(message.timestamp);
	if (message.user === currentUser) position = 'replies';

	miniProfileImage = miniImage;
	if (message.user === currentUser) miniProfileImage = profileimage
	

	const messageItem = 
		`<li class="${position}">
			<img src="${miniProfileImage}" alt="" />
			<p>${message.body}</p>
		</li>`;
	
	document.getElementById('messages').innerHTML += messageItem;
}


function getConversation(recipient) {
	document.getElementById("messages").innerHTML = "";
	let messageList = document.getElementById("messages");
	fetch(`api/message/?target=${recipient}`)
		.then(response => response.json())
		.then(data => {
			while (messageList.firstChild) {
				messageList.removeChild(messageList.firstChild);
			}
			data.results.reverse().forEach(message => {
				drawMessage(message);
			});
			messageList.scrollTop = messageList.scrollHeight;
		})
		.catch(error => {
			console.log(data)
			console.error('Error fetching conversation:', error);
		});
}


function getMessageById(message) {
	const id = JSON.parse(message).message;
	let messageList = document.getElementById("messages");
	fetch(`api/message/${id}/`)
		.then(response => response.json())
		.then(data => {
			if (data.user === currentRecipient || 
				(data.recipient === currentRecipient && data.user === currentUser)) {
				drawMessage(data);
			}
			messageList.scrollTop = messageList.scrollHeight;
		})
		.catch(error => {
			console.error('Error fetching message:', error);
		});
}


function sendMessage(recipient, body) {
	fetch('api/message/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			recipient: recipient,
			body: body
		})
	})
	.then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
	})
	.catch(error => {
		console.error('Error:', error);
	});
}


function setCurrentRecipient(userData) {
	const chatDisplay = document.getElementById('chat-display');
	chatDisplay.style.display = 'block';
	miniImage = userData.profile.image;
	currentRecipient = userData.username;

	const profileImageElement = document.getElementById('profile-image');
	profileImageElement.src = userData.profile.image;
	
	const recipientNameElement = document.getElementById('recipient-name');
	recipientNameElement.textContent = currentRecipient;

	
	getConversation(currentRecipient);
}


function sanitizeInput(input) {
	return input.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&#x27;")
				.replace(/\//g, "&#x2F;");
}

let socket = null;

function initializeChat() {

	if (socket)
		socket.close();
	
	if (!socket || socket.readyState !== WebSocket.OPEN) {
		socket = new WebSocket(`ws://${window.location.host}/ws?session_key=${sessionKey}/`);

		socket.onopen = function(event) {
			console.log('WebSocket connection established');
		};

		socket.onmessage = function(event) {
			getMessageById(event.data);
			console.log('Message received:', event.data);
		};

		socket.onerror = function(event) {
			console.error('WebSocket error:', event);
		};

		socket.onclose = function(event) {
			console.log('WebSocket connection closed');
		};
	} else {
		console.log("WebSocket Connection Already Established!");
	}

	
	let chatInput = document.getElementById('chat-input');
	
	let chatButton = document.getElementById('btn-send');
	if (chatButton) {
		chatButton.addEventListener('click', function () {
			const sanitized_input = sanitizeInput(chatInput.value);
			if (sanitized_input.length > 0) {
				sendMessage(currentRecipient, sanitized_input);
				chatInput.value = '';
			}
		});
	}

	handleUserSelection();
	setupSearchFunctionality();
}


window.addEventListener('DOMContentLoaded', function(event) {
	if (window.location.pathname === '/chat/') {
		initializeChat();
	}
});


function setupSearchFunctionality() {
	console.info("Setting up search functionality");
	const userList = document.getElementById("user-list");
	const searchInput = document.getElementById("search-input");
	const searchButton = document.getElementById("search-button");

	if (userList) {
		const originalUserNames = Array.from(userList.children).map(function (user) {
			return user.textContent.trim();
		});

		searchButton.addEventListener("click", function () {
			const searchText = searchInput.value.toLowerCase();
			filterUsers(searchText);
		});
	
		searchInput.addEventListener("input", function () {
			const searchText = searchInput.value.toLowerCase();
			filterUsers(searchText);
		});
	
		function filterUsers(searchText) {
			const filteredUserNames = originalUserNames.filter(function (userName) {
				return userName && userName.toLowerCase().includes(searchText);
			});
			displayFilteredUsers(filteredUserNames);
		}
	}


	function displayFilteredUsers(filteredUserNames) {
		userList.innerHTML = "";
		filteredUserNames.forEach(function (userName) {
			const listItem = document.createElement("a");
			listItem.classList.add("list-group-item");
			listItem.textContent = userName;
	
			listItem.addEventListener("click", function () {
				fetch(`api/user/${userName}/`)
				.then(response => response.json())
				.then(userProfile => {
					setCurrentRecipient(userProfile);
				})
				.catch(error => {
					console.error('Error fetching user profile:', error);
				});
			});
	
			userList.appendChild(listItem);
		});
	}
	
}

