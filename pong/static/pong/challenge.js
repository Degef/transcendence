var challengeInterval;
var challengeInterval2;

function check_challenge_response() {
    fetch('/check_challenge_response/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (response.status === 200) {
            response.json().then(data => {
                console.log(data)
                if (data.response === 'accept') {
                    clearInterval(challengeInterval2)
                    console.log('Challenge accepted')
                    play_online();
                    setTimeout(start_play_online, 3000);
                } else if (data.response === 'decline'){
                    console.log('Challenge declined')
                    clearInterval(challengeInterval2)
                } else {
                    console.log('No response yet')
                }
            })
        } else {console.log('Failed to check response')}
    }).catch(error => {
        console.error('Error:', error);
    });
}

function challengeUser(username) {
    fetch(`/challengeUser/${username}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (response.status === 200) {
            response.json().then(data => {
                console.log(data)
                if (data.success) {
                    console.log('Challenge sent')
                    challengeInterval2 = setInterval(function(){
                        check_challenge_response();
                    }, 1000);
                } else {
                    console.log('Failed to send challenge')
                }
            })
        } else {console.log('Failed to send challenge')}
    }).catch(error => {
        console.error('Error:', error);
    }
    );
}

function give_challenged_response(response) {
    if (response === 'accept') {
        play_online();
        setTimeout(start_play_online, 3000);
    }
    fetch(`/give_challenged_response/${response}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (response.status === 200) {
            response.json().then(data => {
                console.log(data)
                if (data.success) {
                    console.log('Challenge response sent')
                } else {
                    console.log('Failed to send challenge response')
                }
            })
        } else {console.log('Failed to send challenge response')}
    }).catch(error => {
        console.error('Error:', error);
    }
    );
}

function is_challenged() {
    fetch('/is_challenged/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (response.status === 200) {
            response.json().then(data => {
                console.log(data)
                if (data.challenged) {
                    console.log('Challenged')
                    clearInterval(challengeInterval)
                    confirm('You have been challenged by ' + data.challenger + '. Do you accept?') ? give_challenged_response("accept") : give_challenged_response("decline")
                    // window.location.href = '/pong/game'
                } else {
                    console.log('Not challenged')
                }
            })
        } else {console.log('Failed to check if challenged')}
    }).catch(error => {
        console.error('Error:', error);
    }
    );
}

function start_challenge_checking() {
    challengeInterval = setInterval(function(){
        is_challenged();
    }, 3000);
}

start_challenge_checking();