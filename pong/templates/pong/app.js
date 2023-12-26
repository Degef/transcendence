            //  This function communicates with django (backend)
function showProfile() {
	fetch('/profile')
		.then(response => response.json())  // Assuming the response is JSON
		.then(data => {
			console.log(data);
			// Update the content container with the profile data
			document.querySelector('#content').innerHTML = `
				<h2>${data.username}'s Profile</h2>
				<p>Email: ${data.email}</p>
				<!-- Add more profile details as needed -->
			`;
		})
		.catch(error => console.error('Error fetching profile data:', error));
}
function showSection(section) {   
	fetch(`/sections/${section}`)
	.then(response => response.text())
	.then(text => {
		console.log(text);
		document.querySelector('#content').innerHTML = text;
	});
	
}

document.addEventListener("DOMContentLoaded", function() {
	document.querySelector('[data-section="profile"]').onclick = function() {
		showProfile();
	}
});