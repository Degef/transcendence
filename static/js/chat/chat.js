let currentRecipient = '';
let miniImage = '';
let sessionKey = '';
let currentUser = '';
let profileimage = '';

let gamepadLink = null;

function get_current_user() {
	fetch('get_current_user/')
	.then(response => response.json())
	.then(data => {
		currentUser = data.currentUser;
		profileimage = data.currentUserImage;
		sessionKey = data.sessionKey;
	})
	.catch(error => {
		console.error('Error fetching user:', error);
	});
}

// document.addEventListener('contextmenu', event => event.preventDefault());


function handleUserSelection() {
	const userList = document.getElementById('user-listt');
	const contextMenu = document.getElementById('context-menu');


	function hideContextMenu() {
        contextMenu.style.display = 'none';
    }

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

            userItem.addEventListener('contextmenu', function(event) {
                event.preventDefault();
                userItems.forEach(child => child.classList.remove('active'));
                userItem.classList.add('active');
                const username = userItem.innerText.trim();
                contextMenu.style.display = 'block';
                contextMenu.style.left = `${event.pageX}px`;
                contextMenu.style.top = `${event.pageY}px`;

            //     document.getElementById('view-profile').onclick = function() {
            //         fetch(`api/user/${username}/`)
            //         .then(response => response.json())
            //         .then(userProfile => {
            //             viewUserProfile(userProfile); // Define this function to handle profile viewing
            //         })
            //         .catch(error => {
            //             console.error('Error fetching user profile:', error);
            //         });
            //         hideContextMenu();
            //     };
			//
                document.getElementById('block-user').onclick = function() {
                    blockUser(username);
                    hideContextMenu();
                };
			//
            //     document.getElementById('invite-to-game').onclick = function() {
            //         inviteToGame(username); // Define this function to handle inviting the user to a game
            //         hideContextMenu();
            //     };
            // });
        // });

        document.addEventListener('click', function(event) {
            if (!contextMenu.contains(event.target)) {
                hideContextMenu();
            }
        });
    });

})}}



function blockUser(username) {
    fetch('block_unblock/', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({'username': username})
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            return response.json().then(data => {
                throw new Error(data.Error);
            });
        }
    })
    .then(data => {
        console.log(data.Success);
    })
    .catch(error => {
        console.error(error.message);
        if (error.message.includes('Cannot block yourself')) {
            console.error('You cannot block yourself');
        } else if (error.message.includes('User is already blocked')) {
            console.error('User is already blocked');
        } else if (error.message.includes('Invalid request data')) {
            console.error('Invalid request data');
        } else if (error.message.includes('Invalid request method')) {
            console.error('Invalid request method');
        } else {
            console.error('An unknown error occurred');
        }
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

	const messageList = document.getElementById('messages');
	messageList.innerHTML += messageItem;
	messageList.scrollTop = messageList.scrollHeight;

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
				setTimeout(drawMessage(message), 500);
			});
			messageList.scrollTop = messageList.scrollHeight;
		})
		.catch(error => {
			console.log(data)
			console.error('Error fetching conversation:', error);
		})
		.finally(() => {
			messageList.scrollTop = messageList.scrollHeight;
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
	gamepadLink = document.getElementById('gamepad')
	gamepadLink.addEventListener('click', function(event) {
		event.preventDefault();
		challengeUser(currentRecipient);
	});

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
	get_current_user();
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
		setTimeout(initializeChat, 1000);
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

