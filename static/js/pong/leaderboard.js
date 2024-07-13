// document.addEventListener('DOMContentLoaded', function () {
//     if (window.location.pathname.includes('/leaderboard/')) {
//         init_leaderboard();
//     }
// });

function init_leaderboard() {
	const tabs = [
		{ tabId: 'all_time_leaderboard_tab', sectionId: 'all_time_leaderboard' },
		{ tabId: 'weekly_leaderboard_tab', sectionId: 'weekly_leaderboard' },
		{ tabId: 'monthly_leaderboard_tab', sectionId: 'monthly_leaderboard' }
	];

	tabs.forEach(({ tabId, sectionId }) => {
		const tabElement = document.getElementById(tabId);
		if (tabElement) {
			tabElement.addEventListener('click', () => {
				showLeaderboardSection(tabId, sectionId);
			});
		}
	});
}

function showLeaderboardSection(activeTabId, activeSectionId) {
	const sections = ['all_time_leaderboard', 'weekly_leaderboard', 'monthly_leaderboard'];
	const tabs = ['all_time_leaderboard_tab', 'weekly_leaderboard_tab', 'monthly_leaderboard_tab'];

	sections.forEach(section => document.getElementById(section).classList.add('d-none'));
	tabs.forEach(tab => document.getElementById(tab).classList.remove('active'));

	document.getElementById(activeSectionId).classList.remove('d-none');
	document.getElementById(activeTabId).classList.add('active');
}
