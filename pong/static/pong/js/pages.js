
function create_registration_Form() {
	document.querySelector('#content').innerHTML = `
	<form class="form-signin">
    <h1 class="h3 mb-3 pb-2 font-weight-normal border-bottom">Join Today</h1>

	<!-- top alert -->
	<div class="alert " role="alert" id="topAlert"> </div>

    <!-- Username input -->
    <label for="inputUsername" class="">Username*</label>
    <input type="text" id="inputUsername" name="username" class="form-control" required autofocus>
    <div id="usernameFeedback" class="myAlert"></div>

    <!-- Email input -->
    <label for="inputEmail" class="">Email*</label>
    <input type="email" id="inputEmail" name="email" class="form-control" required>
    <div id="emailFeedback" class="myAlert"></div>

    <!-- Password1 input -->
    <label for="inputPassword1" class="">Password*</label>
    <input type="password" id="inputPassword1" name="password1" class="form-control" required>
    <div id="password1Feedback" class="myAlert"></div>

    <!-- Password2 input -->
    <label for="inputPassword2" class="">Confirm Password*</label>
    <input type="password" id="inputPassword2" name="password2" class="form-control" required>
    <div id="password2Feedback" class="myAlert"></div>

    <button id="register" class="btn btn-outline-info mt-3" type="button">Sign Up</button>
	</form>

	<!-- Login link -->
	<div class="border-top pt-3">
		<small class="text-muted">
			Already have an account? <a id="login_request" href="#">Login</a>
		</small>
	</div>

	`;
}

function about_page() {
	document.querySelector('#content').innerHTML = `
	<div class="jumbotron">
	<p> <strong> Welcome to the Ping Pong Tournament App!</strong> This app is crafted for Ping Pong enthusiasts to experience the excitement of tournaments online.</p>
		<h2>Features:</h2>
		<ul class="list-container">
			<li>Participate in online multiplayer Ping Pong tournaments</li>
			<li>Intuitive and user-friendly interface</li>
			<li>Real-time scoring and detailed game statistics</li>
		</ul>
		
		<p>Our mission is to create a vibrant and competitive platform for Ping Pong enthusiasts worldwide. Dive into the app, compete in tournaments, and enjoy the thrill of the game!</p>
	</div>
	`;
}

function home_page() {
	if (localStorage.getItem('authToken') === null) {
		document.querySelector('#content').innerHTML = `
		<div class="jumbotron">
		
			<h1 class="">Welcome to <strong>Pong</strong></h1>
			<p class="lead">The mighty Pong contest is here for you!</p>
			<p>Get ready to embark on an exhilarating journey into the world of online ping pong with <strong>Pong</strong>! Whether you're a seasoned player or a newbie eager to experience the thrill of the game, we've crafted an immersive platform just for you.</p>
			<p>Challenge opponents from around the globe, showcase your paddle prowess, and climb the ranks to become the ultimate <strong>Pong</strong> champion. With state-of-the-art features and a seamless user interface, <strong>PongPal</strong> guarantees a smashing good time for players of all levels.</p>
			<p>Join the fun, feel the spin, and let the matches begin! Are you ready to elevate your ping pong experience? Let's rally!</p>
			<!-- Registration link -->
			<div class="border-top pt-3">
				<button onclick="authorize42Intra()" id="login42" class="btn btn-primary mt-3" type="button">Sign in with 42</button>
				<button id="request_registration" class="btn btn-primary mt-3" type="button">Sign up with email</button>
			</div>
		</div>
		`;
	} else {
		loginPage();
	}
}

function loginPage() {
	//page after loging in
	document.querySelector('#content').innerHTML = `
	<div class="jumbotron">
		<h1 class="display-4">Welcome to Ping Pong Tournament App!</h1>
		<p class="lead">This is a simple web application that allows you to create and participate in Ping Pong tournaments online.</p>
		<hr class="my-4">
		<p>You are logged in!</p>
	</div>
	`;
}

function login_Form() {
	document.querySelector('#content').innerHTML = `
	<form class="form-signin">
		<h1 class="h3 mb-3 pb-2 font-weight-normal border-bottom">Login</h1>

		<!-- top alert -->
		<div class="alert " role="alert" id="topAlert"> </div>
		<!-- Username input -->
		<label for="inputUsername" class="">Username*</label>
		<input type="text" id="inputUsername" name="username" class="form-control"  required autofocus>
		<div id="usernameFeedback" class=""></div>
		
		<!-- Password input -->
		<label for="inputPassword" class="">Password*</label>
		<input type="password" id="inputPassword" name="password" class="form-control"  required>
		<div id="passwordFeedback" class=""></div>

		<button id="login" class="btn btn-outline-info mt-3" type="button">Login</button>
	</form>
	<!-- Registration link -->
	<div class="border-top pt-3">
		<small class="text-muted">
			Don't have an account? <a id="request_registration" href="#">Register</a>
		</small>
	</div>

	`;
}

function update_nav(i) {
	if (i === 1) {
		document.querySelector('#logout').innerText = 'Logout';
		document.querySelector('#profile').innerText = 'Profile';
		document.querySelector('#login_request').innerText = '';
		// document.querySelector('#request_registration').innerText = '';
	} else {
		document.querySelector('#logout').innerText = '';
		document.querySelector('#profile').innerText = '';
		document.querySelector('#login_request').innerText = 'Login';
		// document.querySelector('#request_registration').innerText = 'Register';
	}
}
