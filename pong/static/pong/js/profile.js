function showProfile(i) {
	fetch('/profile')
		.then(response => response.json())
		.then(data => {
			console.log(data);
			profilePage(data);
			if (i === 1) {
				topAlert("update successful!", 'success');
			}

		})
		.catch(error => console.error('Error fetching profile data:', error));
}

function updateProfile() {
	const formData = new FormData();
	formData.append('username', document.querySelector('#updateUsername').value);
	formData.append('email', document.querySelector('#updateEmail').value);
	formData.append('image', document.querySelector('#updateImage').files[0]);

	fetch('/update_profile/', {
		method: 'POST',
		body: formData,
	})
	.then(response => response.json())
	.then(data => {
		console.log(data);
		if (data.success) {
			showProfile(1);
		} else if (data.message == 'No changes detected'){
			topAlert(data.message, 'info');
		} 
		else {
			if (data.errors.username)
				showAlert(data.errors.username, 'invalid', '#updateUsername', '#updateFeedback1');
			else
				showAlert("looks good", 'valid', '#updateUsername', '#updateFeedback1');
			if (data.errors.email)
				showAlert(data.errors.email, 'invalid', '#updateEmail', '#updateFeedback2');
			else
				showAlert("looks good", 'valid', '#updateEmail', '#updateFeedback2');
			if (data.errors.image)
				showAlert(data.errors.image, 'invalid', '#updateImage', '#updateFeedback3');
			else
				showAlert("looks good", 'valid', '#updateImage', '#updateFeedback3');
		}
	})
	.catch(error => {
		console.error('Error:', error);
	});
}

function profilePage(user) {
	const display = `
	<!-- top alert -->
	<div class="alert " role="alert" id="topAlert"> </div>
		<div class="content-section">
			<div class="media">
				<img class="rounded-circle account-img" src="${user.image_url}" alt="Profile Picture">
				<div class="media-body mt-4">
					<h2 class="account-heading">${user.username}, ${user.first_name} ${user.last_name}</h2>
					<p class="text-secondary"> ${user.email}</p>
				</div>
			</div>
				<form class="form-signin">
				<h1 class="h3 mb-3 pb-2 font-weight-normal border-bottom">Profile Info</h1>
				
				<!-- Username input -->
				<label for="updateUsername" class="">Username</label>
				<input type="text" id="updateUsername" name="username" class="form-control" value="${user.username}">
				<div id="updateFeedback1" class=""></div>
				
				<!-- Password input -->
				<label for="updateEmail" class="">Email</label>
				<input type="text" id="updateEmail" name="email" class="form-control" value="${user.email}">
				<div id="updateFeedback2" class=""></div>
				
				<!-- Current Image -->
				<p class = "mt-3"> Current Image: <a href="${user.image_url}">${user.image_url}</a></p>
				<!-- Image file input -->
				<p class="">New Image</p>
				<input type="file" id="updateImage" name="image" class="form-control-file">
				<div id="updateFeedback3" class=""></div>
				
				<button id="update" class="btn btn-outline-info mt-3" type="button">Update</button>
				</form>
		</div>
	`;
	
	document.querySelector('#content').innerHTML = display;
}