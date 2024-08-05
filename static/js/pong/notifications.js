const notificationsList = [];

let notificationIconBadge;
let notificationButton;
let notificationsContainer;

function addToNotificationsList(notification) {
	notificationIconBadge = document.getElementById('notificationBadge');
	if (!notificationIconBadge) {
		return;
	}
	notificationsList.push(notification);
	updateNotificationBadge();
}

function updateNotificationBadge() {
	if (notificationIconBadge) {
		notificationIconBadge.textContent = notificationsList.length;
	}
}

function showNotifications() {
	notificationsContainer = document.getElementById('notifications-list');
	if (!notificationsContainer) {
		return;
	}
	
	
	notificationsContainer.classList.toggle('d-none');
	
	if (!notificationsContainer.classList.contains('d-none')) {
		renderNotifications();
	}
}

function renderNotifications() {
	notificationsContainer.innerHTML = '';
	const listGroup = document.createElement('div');
	listGroup.className = 'list-group';

	for (let i = notificationsList.length - 1; i >= 0; i--) {
		const notification = notificationsList[i];
		const listItem = document.createElement('a');
		listItem.href = "#";
		listItem.className = 'list-group-item list-group-item-action';
		listItem.textContent = notification;
		listGroup.appendChild(listItem);
	}
	
	if (notificationsList.length === 0) {
		const emptyMessage = document.createElement('div');
		emptyMessage.className = 'list-group-item';
		emptyMessage.textContent = 'No notifications';
		listGroup.appendChild(emptyMessage);
	}
	notificationsContainer.appendChild(listGroup);
}


document.addEventListener('click', (event) => {
	if (!notificationsContainer || notificationsContainer.classList.contains('d-none')) {
		return;
	}
	
	if (!notificationsContainer.contains(event.target) && event.target.id !== 'notificationBell') {
		notificationsList.length = 0;
		updateNotificationBadge();
		notificationsContainer.classList.add('d-none');
	}
});