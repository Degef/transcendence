var challengeInterval = null;
var challengeInterval2 = null;

function check_challenge_response(check_response_count) {
    fetch('/check_challenge_response/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (response.status === 200) {
            response.json().then(data => {
                // console.log(data)
                if (data.response === 'accept') {
                    clearInterval(challengeInterval2)
                    clearInterval(challengeInterval)
                    challengeInterval = null;
                    console.log('Challenge accepted')
                    play_online();
                    setTimeout(start_play_online, 2000);
                } else if (data.response === 'decline'){
                    console.log('Challenge declined')
                    clearInterval(challengeInterval2)
                    start_challenge_checking();
                } else if (check_response_count > 15) {
                    console.log('No response, challenge expired')
                    clearInterval(challengeInterval2)
                    start_challenge_checking();
                }
                else {
                    console.log('Waiting for response...')
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
                    let check_response_count = 0;
                    challengeInterval2 = setInterval(function(){
                        check_challenge_response(check_response_count);
                        check_response_count++;                        
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
        setTimeout(start_play_online, 2000);
    } else {
        start_challenge_checking();
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

function customConfirm(message, onAccept, onDecline) {
    var modal = document.getElementById('custom-confirm');
    var messageElement = document.getElementById('challenge-message');
    var acceptButton = document.getElementById('accept-button');
    var declineButton = document.getElementById('decline-button');
  
    messageElement.innerText = message;
  
    acceptButton.onclick = function() {
      modal.style.display = "none";
      onAccept();
    }
  
    declineButton.onclick = function() {
      modal.style.display = "none";
      onDecline();
    }
  
    modal.style.display = "block";
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
                if (data.success && data.challenged) {
                    console.log('Challenged')
                    clearInterval(challengeInterval)
                    challengeInterval = null;
                    // confirm('You have been challenged by ' + data.challenger + '. Do you accept?') ? give_challenged_response("accept") : give_challenged_response("decline")
                    customConfirm(data.challenger + " is challenging you to pong game rightnow " + '. Do you accept?', function() {
                        give_challenged_response("accept");
                      }, function() {
                        give_challenged_response("decline");
                      });
                }
                // else {
                //     console.log('Not challenged')
                // }
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

// start_challenge_checking();