const notificationsList = [
	
];

let notificationIconBadge;
let notificationButton;
let notificationsContainer;


function addToNotificationsList(notification) {
	if (!notificationIconBadge) {
		return ;
	}
	notificationsList.push(notification);
	notificationIconBadge.textContent = notificationsList.length;
}


function initializeNotifications() {
	notificationIconBadge = document.getElementById('notificationBadge');
	notificationButton = document.getElementById('notifications');
	notificationsContainer = document.getElementById('notifications-list');

	if (notificationButton) {
		notificationButton.addEventListener('click', () => {
			notificationsContainer.classList.toggle('d-none');
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
			
			notificationsContainer.appendChild(listGroup);
		});
	}	
}
