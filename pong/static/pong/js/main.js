// function showProfile() {
// 	fetch('/profile')
// 		.then(response => response.json())
// 		.then(data => {
// 			console.log(data);
// 				var display = `
//                 <div class="card mb-3 mt-3">
//                     <div class="card-body">
//                         <h5 class="card-title"> ${data.users[0].fields.username}, ${data.users[0].fields.first_name} ${data.users[0].fields.last_name}</h5>
//                         <p class="card-text">Email: ${data.users[0].fields.email}</p>
//                         <!-- Add more user information as needed -->
//                     </div>
//                 </div>
//             `;
// 			document.querySelector('#content').innerHTML =  display;
// 		})
// 		.catch(error => console.error('Error fetching profile data:', error));
// }

// Fetch user data
function showProfile() {
	fetch('/profile')
		.then(response => response.json())
		.then(data => {
			if (data.users && data.users.length > 0) {
				console.log(data);
				const user = data.users[0];
				const profilePictureUrl = user.image;

				const display = `
					<div class="card mb-3 mt-3">
						<div class="media">
							<img class="rounded-circle account-img" src="${profilePictureUrl}" alt="Profile Picture">
							<div class="media-body mt-4">
								<h2 class="account-heading">${user.username}, ${user.first_name} ${user.last_name}</h2>
								<p class="text-secondary"> ${user.email}</p>
						  	</div>
						</div>
					</div>
				`;

				document.querySelector('#content').innerHTML = display;
			} else {
				console.error('User data not found');
			}
		})
		.catch(error => console.error('Error fetching profile data:', error));
}

function handleButtonClick(event) {
	if (event.target.id === 'profile')
		showProfile();
	else if (event.target.id === 'request_registration')
		create_registration_Form();
	else if (event.target.id === 'register')
		registerUser();
	else if (event.target.id === 'login_request')
		create_login_Form();
	else if (event.target.id === 'login')
		loginUser();
	else if (event.target.id === 'about')
		about_page();
	else if (event.target.id === 'home')
		home_page();
	else if (event.target.id === 'logout')
		logoutUser();
}

document.addEventListener("DOMContentLoaded", function() {
	const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
        // Perform a silent login using the stored token
        silentLogin(storedToken);
    }
    document.body.addEventListener('click', handleButtonClick);
});
