let currentRecipient = '';
let chatButton = document.getElementById('btn-send');
let userList = document.getElementById("user-list");
let miniImage = '';

function handleUserSelection() {
	const userList = document.getElementById('user-list');
	const userItems = userList.querySelectorAll('a.list-group-item');

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


function initializeChat() {
	
	
	var socket = new WebSocket(`ws://${window.location.host}/ws?session_key=${sessionKey}/`);
	
	socket.onopen = function() {
		console.log("WebSocket Established!")
	};
	
	let chatInput = document.getElementById('chat-input');

	chatButton.addEventListener('click', function () {
		const sanitized_input = sanitizeInput(chatInput.value);
		if (sanitized_input.length > 0) {
			sendMessage(currentRecipient, sanitized_input);
			chatInput.value = '';
		}
	});
	

	socket.addEventListener('message', function (e) {
		getMessageById(e.data);
	});
}

let chatLink = document.getElementById("chatLink");

chatLink.addEventListener('click', function () {
    initializeChat();
	handleUserSelection();
});

document.addEventListener('DOMContentLoaded', function () {
    initializeChat();
    handleUserSelection();
});



function setupSearchFunctionality() {
	const userList = document.getElementById("user-list");
	const searchInput = document.getElementById("search-input");
	const searchButton = document.getElementById("search-button");

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

document.addEventListener("DOMContentLoaded", setupSearchFunctionality);
