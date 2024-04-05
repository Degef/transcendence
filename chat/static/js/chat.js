let currentRecipient = '';
const chatInput = document.getElementById('chat-input');
const chatButton = document.getElementById('btn-send');
let userList = document.getElementById("user-list");
let messageList = document.getElementById("messages");
let miniImage = '';

function updateUserList() {
	fetch('api/user/')
		.then(response => response.json())
	  	.then(data => {
			const userList = document.getElementById('user-list');
			userList.innerHTML = `
				<a href="" class="list-group-item disabled">
					
				</a>`;
			data.forEach(userData => {
				const userItem = document.createElement('a');
				userItem.classList.add('list-group-item', 'user');
				userItem.textContent = userData.username;
				userItem.addEventListener('click', function() {
					const userListChildren = userList.querySelectorAll('.user');
					userListChildren.forEach(child => child.classList.remove('active'));
					userItem.classList.add('active');
					setCurrentRecipient(userData);
				});
				userList.appendChild(userItem);
			});
		})
		.catch(error => {
			console.error('Error fetching user data:', error);
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
			console.log(response)
			console.error('Error fetching conversation:', error);
		});
}


function getMessageById(message) {
	const id = JSON.parse(message).message;
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
		alert('Error! Check console!');
	});
}


function setCurrentRecipient(userData) {
	miniImage = userData.profile.image
	currentRecipient = userData.username;
	const profileLook = `
		<div class="contact-profile">
			<img src=${userData.profile.image} alt="" />
			<p>${currentRecipient}</p>
		</div>`;

	const contactProfileElement = document.querySelector('.contact-profile');
	contactProfileElement.innerHTML = profileLook;
	getConversation(currentRecipient);
	enableInput();
}


function enableInput() {
	chatInput.disabled = false;
	chatButton.disabled = false;
	chatInput.focus();
}


function disableInput() {
	chatInput.disabled = true;
	chatButton.disabled = true;
}


function initializeChat() {
    updateUserList();
    disableInput();

    var socket = new WebSocket(`ws://${window.location.host}/ws?session_key=${sessionKey}/`);

    chatInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter')
            chatButton.click();
    });

    chatButton.addEventListener('click', function () {
        if (chatInput.value.length > 0) {
            sendMessage(currentRecipient, chatInput.value);
            chatInput.value = '';
        }
    });

    socket.addEventListener('message', function (e) {
        getMessageById(e.data);
    });
}

initializeChat();

