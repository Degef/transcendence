function addRoundedPillOnLargerScreens() {
	if (window.innerWidth >= 992) {
		const navBar = document.getElementById('navbarNav');
		navBar.classList.add('rounded-pill');
	}
}

window.addEventListener('resize', function() {
	if (window.innerWidth < 992) {
		const navBar = document.getElementById('navbarNav');
		navBar.classList.remove('rounded-pill');
	}
	addRoundedPillOnLargerScreens();
});

window.addEventListener("load", (event) => {
	addRoundedPillOnLargerScreens();
})
