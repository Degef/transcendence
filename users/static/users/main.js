
function handleButtonClick(event) {
    const buttonFunctions = {
        'about': aboutPage,
        'home': homePage,
        'req_register': req_registration_page,
        'register': register,
        'req_login': req_login_page,
        'login': login,
        'logout': logout,
        'profile': profile,
        'update': update,
        'pre_register': pre_register,
        'loginWith42': authorize42Intra,
        // 'get_users': getUsers,
        'play_online': play_online,
        'game_computer': game_computer,
        'start_play_online': start_play_online,
		'chatLink' : chatPage,
    };
    
    const buttonId = event.target.id;
    if (buttonId != 'id_image') {
        event.preventDefault();
    }
    if (buttonFunctions.hasOwnProperty(buttonId)) {
        buttonFunctions[buttonId](event);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    document.body.addEventListener('click', handleButtonClick);
}
);

window.onpopstate = function (event) {
    if (event.state == null)
        homePage(0);
    else if (event.state['path'] == '/')
        homePage(0);
	else if (event.state['path'] == '/chat/')
		chatPage(0);
    else if (event.state['path'] == '/about/')
        aboutPage(0);
    else if (event.state['path'] == '/profile/')
        profile(0);
    else if (event.state['path'] == '/register/')
        register(0); 
    else if (event.state['path'] == '/login/')
        login(0); 
    else if (event.state['path'] == '/update/') 
        update(0);
    else if (event.state['path'] == '/pre_register/')
        pre_register(0);
    else if (event.state['path'] == '/loginWith42/')
        authorize42Intra(0);
    // else if (event.state['path'] == '/logout/')
    //     logout(0);
    else if (event.state['path'] == '/get_users/')
        getUsers(0);
    else
        homePage(0);
};