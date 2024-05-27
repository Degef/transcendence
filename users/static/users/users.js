
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

config = {
    'ipaddress': '',
    'client_id': '',
    'redirectUri': '',
    'secret': '',
    // 'status':false,
    // 'socket': null,
};

if (config.ipaddress == '') {
    get_ipaddress();
}

window.addEventListener('unload', function(event) {
    // Perform some actions before the page is unloaded
    console.log('Page is being unloaded...');
});


function get_ipaddress() {
    fetch('/get_ipaddress/')
        .then(response => response.json())
        .then(data => {
            config.ipaddress = data.ip;
            config.client_id = data.client_id;
            config.secret = data.secret;
            config.redirect_uri = data.redirect_uri;
            if (code != null) {
                loginWith42();
            }
        });
}

function loginWith42(back_or_forward = 1) {
    fetch(`http://${config.ipaddress}:8000/exchange_code?code=${code}`, 
        {
            method: 'GET',
            headers: {
                'Content-Type': 'text/html',
            },
        })
        .then(response => response.text())
        .then(htmlContent => {
            updateBody(htmlContent);
            if (back_or_forward == 0)
                return  
            updateURL(`http://${config.ipaddress}:8000/exchange_code?code=${code}`);
        })
        .catch(error => {
            console.error('Error exchanging code for access token:', error);
        });
}

function authorize42Intra() {
    const clientId = config.client_id;
    const redirectUri = config.redirect_uri;
    const authorizationEndpoint = 'https://api.intra.42.fr/oauth/authorize';

    const state = Math.random().toString(36).substring(7); // Generate a random state to include in the authorization request
    const authUrl = `${authorizationEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&response_type=code`; // Construct the authorization URL
    window.location.href = authUrl;// Redirect the user to the 42 authorization page
}

function updateURL(url) {
    window.history.pushState({ path: url }, '', url);
}

function updateContent(htmlContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const newContent = doc.getElementById('content');
    document.getElementById('content').innerHTML = newContent.innerHTML;
}

function updateBody(htmlContent) {
    // if (config.status == false) {
    //     const soc = new WebSocket(`ws://${window.location.host}/ws/my_consumer/`);
    //     soc.onopen = function (event) {
    //         console.log('Connection opened online status');
    //     };
    //     soc.onclose = function (event) {
    //         console.log('Connection closed online status');
    //     }
    //     config.status = true;
    //     config.socket = soc;
    // } else {
    //     const message = {
    //         'type': 'update_status',
    //     };
    //     config.socket.send(JSON.stringify(message));
    // }
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const newBodyContent = doc.body.innerHTML;
    document.body.innerHTML = newBodyContent;
}

// function getUsers(back_or_forward = 1) {
//     fetch('/get_users/', {
//         method: 'GET',
//         headers: {
//             'Content-Type': 'text/html',
//         },
//     })
//     .then(response => response.text())
//     .then(htmlContent => {
//         updateBody(htmlContent);
//         if (back_or_forward == 0)
//             return    
//         updateURL('/get_users/');
//     })
//     .catch(error => {
//         console.error('Error:', error);
//     });
// }

function aboutPage(back_or_forward = 1) {
    fetch('/about/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        updateURL('/about/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function chatPage(back_or_forward = 1) {
	console.log("chatPage");
    fetch('/chat/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        // initializeChat();
        if (back_or_forward == 0)
            return    
        updateURL('/chat/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function homePage(back_or_forward = 1) {
    console.log('homePage');
    fetch('/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        updateURL('/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function tournament(back_or_forward = 1) {
    console.log('pretour');
    fetch('/pretour/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        updateURL('/tournament/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

async function pre_offline(back_or_forward = 1) {
    console.log('preoffline');
    const response = await fetch('/pre_offline/', {
        method: 'GET',
        headers: { 'Content-Type': 'text/html', },
    });
    const htmlContent = await response.text();
    updateBody(htmlContent);
    if(back_or_forward == 0) {
        updateURL('/pre-offline');
    }
}

// async function pre_offline(back_or_forward = 1) {
//     console.log('preoffline');

//     try {
//         const response = await fetch('/pre_offline/', {
//             method: 'GET',
//             headers: { 'Content-Type': 'text/html',},
//         });
//         const htmlContent = await response.text();
//         updateBody(htmlContent);

//         if (back_or_forward == 0) {
//             updateURL('/pre-offline');
//         }
//     } catch (error) {
//         console.error('Fetch error:', error);
//     }
// }




async function pre_online(back_or_forward = 1) {
    console.log('preonline');
    const response = fetch('/pre_online/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    });
    const htmlContent = await response.text();
    updateBody(htmlContent);
    if(back_or_forward == 0) {
        updateURL('/pre-online');
    }
}

function pre_tourn(back_or_forward = 1) {
    console.log('pre_tourn');
    fetch('/pre_tourn/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        updateURL('/pre_tourn/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Function to fetch the user ID from the Django request object
function getUserId() {
    // Check if the user is authenticated
    if (window.user_authenticated) {
        // Access the user ID from the user object
        return window.user_id;
    } else {
        return null; // User is not authenticated
    }
}



function fourPlayers() {

    const socket = new WebSocket(`ws://${window.location.host}/ws/tournament/`);

    socket.onopen = function() {
        console.log('WebSocket connection established.');
        sendMessage({ action: 'join_tournament'});
    };
    // Log messages from the server
    // socket.onmessage = function(event) {
    //     const message = JSON.parse(event.data);
    //     console.log('Message from server:', message);
    // };
    
    socket.onmessage = function(e){
        let data = JSON.parse(e.data)
        console.log('Data:', data)

        if(data.type === 'player_names'){
            // let messages = document.getElementById('messages');
            // messages.innerHTML = '';
            // data.player_names.forEach((player, index) => {
            //     messages.insertAdjacentHTML('beforeend', `<div class="player-entry">
            //         <img src="${player.profile_img}" alt="${player.username}'s profile picture" class="profile-img">
            //         <p>${index + 1}. ${player.username}</p>
            //     </div>`);
            // });
        }
        if (data.type === 'html_content') {
            // let messages = document.getElementById('tourn');
            // Replace the current content with the received HTML

            const newHtmlContent = data.html;
            document.body.innerHTML = newHtmlContent;
            
            // messages.innerHTML = data.html;
        }
    }


    socket.onclose = function(event) {
        console.log('WebSocket connection closed:', event);
    };
    
    // Send messages to the server
    function sendMessage(message) {
        console.log("sending messgesage to server");
        console.log(message);
        socket.send(JSON.stringify(message));
    }

}

// Call the fourPlayers function when the page is loaded
// document.addEventListener('DOMContentLoaded', fourPlayers);


function req_registration_page(back_or_forward = 1) {
    fetch('/register/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        updateURL('/register/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function register(back_or_forward = 1) {
    const form = document.getElementById('registration-form');
    const formData = new FormData(form);

    fetch('/register/', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        // updateURL('/register/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function login(back_or_forward = 1) {
    const form = document.getElementById('login-form');
    const formData = new FormData(form);

    fetch('/login/', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);        
        if (back_or_forward == 0)
            return    
        // updateURL('/login/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function req_login_page(back_or_forward = 1) {
    fetch('/login/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        updateURL('/login/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function logout(back_or_forward = 1) {
    // navigator.sendBeacon('/unload/');
    fetch('/unload/')
      .then(response => {
        if (!response.ok) {
          throw new Error('response was not ok');
        }
        return response.json(); // Assuming the response is in JSON format
      })
      .then(data => {
        console.log(data);
        // Now, execute the second fetch request
        return fetch('/logout/', {
          method: 'GET',
          headers: {
            'Content-Type': 'text/html',
          },
        });
      })
      .then(response => response.text())
      .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0) return updateURL('/logout/');
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }

// function logout(back_or_forward = 1) {
//     // navigator.sendBeacon('/unload/');
//     fetch('/unload/')
//     .then(response => {
//         if (!response.ok) {
//         throw new Error('response was not ok');
//         }
//         return response.json(); // Assuming the response is in JSON format
//     })
//     .then(data => {
//         console.log(data);
//     })
//     .catch(error => {
//         // Handle any errors that occurred during the fetch
//         console.error('Fetch error:', error);
//     });

//     fetch('/logout/', {
//         method: 'GET',
//         headers: {
//             'Content-Type': 'text/html',
//         },
//     })
//     .then(response => response.text())
//     .then(htmlContent => {
//         updateBody(htmlContent);
//         if (back_or_forward == 0)
//             return    
//         updateURL('/logout/');
//     })
//     .catch(error => {
//         console.error('Error:', error);
//     });
// }

function profile(back_or_forward = 1) {
    fetch('/profile/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        updateURL('/profile/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function update(back_or_forward = 1) {
    console.log('update');
    const form = document.getElementById('profile-form');
    const formData = new FormData(form);

    fetch('/profile/', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        // updateURL('/profile/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function pre_register(back_or_forward = 1) {
    fetch('/pre_register/', {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return    
        updateURL('/pre_register/');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function addFriend(name, back_or_forward) {
    fetch(`/add_friend/${name}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return  
        // updateURL(`/add_friend/${name}`);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function removeFriend(name, back_or_forward) {
    fetch(`/remove_friend/${name}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'text/html',
        },
    })
    .then(response => response.text())
    .then(htmlContent => {
        updateBody(htmlContent);
        if (back_or_forward == 0)
            return
        // updateURL(`/remove_friend/${name}`);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

window.addEventListener('unload', function() {
    // navigator.sendBeacon('/user_offline/');
    navigator.sendBeacon('/unload/');
});




let players = [];
let currentPlayerIndex = 0;
let totalPlayers = 0;

function setupTournament(playerCount) {
    console.log('Setting up tournament for the following players:', playerCount);
    players = [];
    currentPlayerIndex = 0;
    totalPlayers = playerCount;
    const tournElement = document.getElementById('tourn');
    tournElement.innerHTML = `
        <div class="center-container">
            <div id="playerFormContainer" class="input-group mb-3 square-box">
                <h2">Enter Player Names <br></h2>
                <form id="playerForm">
                    <div id="playerInputs">
                        <label for="playerName">Player 1:</label>
                        <input type="text" id="playerName" name="playerName" required>
                    </div>
                    <button type="button" id="submitPlayer">Next</button>
                </form>
            </div>
        </div>
    `;
    const playerFormContainer = document.getElementById('playerFormContainer');
    playerFormContainer.style.display = 'block';
    console.log('calling submitPlayerName:', totalPlayers);
    document.getElementById('submitPlayer').addEventListener('click', submitPlayerName);
    document.getElementById('playerName').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
        }
    });

}




function submitPlayerName(event) {
    if (event.type === 'click' || (event.type === 'keypress' && event.key === 'Enter')) {
        event.preventDefault();
        console.log('submitPlayerName:', totalPlayers);
        const playerNameInput = document.getElementById('playerName');
        const playerName = playerNameInput.value.trim();
        playerNameInput.style.display = 'block';

        if (playerName && (!players.includes(playerName))) {
            players.push(playerName);
            currentPlayerIndex++;
            
            if (currentPlayerIndex < totalPlayers) {
                document.getElementById('playerInputs').innerHTML = `
                    <label for="playerName">Player ${currentPlayerIndex + 1}:</label>
                    <input type="text" id="playerName" name="playerName" required>
                `;
            } else {
                organizeTournament(players);
            }
        } else if (players.includes(playerName)) {
            alert('Player name taken.');
        } else {
            alert('Player name cannot be empty.');
        }
    }
}


function organizeTournament(players) {
    console.log('Setting up tournament for the following players:', players);

    // Make a fetch request to the backend endpoint
    const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;
    console.log(players)

    fetch('/off_tour/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ 'players': players })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); // Parse the JSON response
    })
    .then(data => {
        // Handle the JSON data received from the backend
        if (data && data.tournament_bracket) {
            // Assuming the response contains a property 'tournament_bracket'
            // Insert the HTML response into the document
            document.getElementById('tourn').innerHTML = data.tournament_bracket;
            startFirstMatch();
        } else {
            console.error('Invalid response from the backend');
        }
    })
    .catch(error => {
        console.error('Error fetching tournament bracket:', error);
        // Handle any errors
    });

}


function startFirstMatch() {
    console.log("about to start the first game");
    const firstMatchElement = document.querySelector('.round-one .matches .matchup');
    console.log("the folling match is being selected : ", firstMatchElement);
    if (firstMatchElement) {
        const player1 = firstMatchElement.querySelector('.team-top').innerText;
        const player2 = firstMatchElement.querySelector('.team-bottom').innerText;
        const matchId = firstMatchElement.getAttribute('.matchup');
        console.log("p1 : ", player1);
        console.log("p2 : ", player2);
        console.log("mid : ", matchId);

        startMatch(player1, player2, firstMatchElement);
    }
}


function startMatch(player1, player2, matchElement) {
    player1_score = 10;
    player2_score = 6;
    alert(`Match between ${player1} and ${player2} is about to start!`);
    
    setTimeout(() => {
        const winner = player1;
        alert(`Match finished! The winner is ${winner}`);
        updateScores(matchElement, player1_score, player2_score);
        updateBracket(matchElement, winner);
    }, 3000); // Simulate match duration
    // updateNextRound();
}

function updateScores(matchElement, player1_score, player2_score) {
    const player1ScoreInput = matchElement.querySelector('.team-top .score-input');
    const player2ScoreInput = matchElement.querySelector('.team-bottom .score-input');
    player1ScoreInput.value = player1_score;
    player2ScoreInput.value = player2_score;
}


function updateBracket(matchElement, winner) {
    const nextMatchElement = getNextMatchElement(matchElement);
    if (nextMatchElement) {
        const playerSpots = nextMatchElement.querySelectorAll('.team');
        if (!playerSpots[0].innerText.trim()) {
            playerSpots[0].innerText = winner;
        } else if (!playerSpots[1].innerText.trim()) {
            playerSpots[1].innerText = winner;
        }
        startNextMatch(matchElement);
    }
}

function startNextMatch(currentMatchElement) {
    // Find the next match in the same round
    const nextMatchInRound = getNextMatchInSameRound(currentMatchElement);
    console.log("nextmatchinround :" , nextMatchInRound);
    if (nextMatchInRound) {
        const player1 = nextMatchInRound.querySelector('.team-top').innerText.trim();
        const player2 = nextMatchInRound.querySelector('.team-bottom').innerText.trim();
        startMatch(player1, player2, nextMatchInRound);
    } else {
        // Find the first match in the next round or split
        // const nextMatchElement = getNextMatchElement(currentMatchElement);
        // if (nextMatchElement) {
        //     const player1 = nextMatchElement.querySelector('.team-top').innerText.trim();
        //     const player2 = nextMatchElement.querySelector('.team-bottom').innerText.trim();
        //     startMatch(player1, player2, nextMatchElement);
        // }
    }
}

function getNextMatchInSameRound(currentMatchElement) {
    const currentRound = currentMatchElement.closest('.round');
    const allMatchesInRound = currentRound.querySelectorAll('.matchup');
    console.log(allMatchesInRound);
    let foundCurrentMatch = false;

    // Check for next match in the same split
    for (let match of allMatchesInRound) {
        if (foundCurrentMatch) {
            return match;
        }
        if (match === currentMatchElement) {
            foundCurrentMatch = true;
        }
    }

    // If no more matches in the same split, check the other split in the same round
    const currentSplit = currentMatchElement.closest('.split');
    const otherSplit = currentSplit.nextElementSibling || currentSplit.previousElementSibling;
    if (otherSplit) {
        const otherSplitMatches = otherSplit.querySelectorAll('.round-one .matches .matchup');
        if (otherSplitMatches.length > 0) {
            return otherSplitMatches[0];
        }
    }
    return null;
}

function getNextMatchElement(currentMatchElement) {
    // Check if we are in the championship round
    const currentSplit = currentMatchElement.closest('.split');
    let nextMatchElement = null;

    if (currentSplit.nextElementSibling) {
        // Check for the next match in the same split (next round)
        nextMatchElement = currentSplit.nextElementSibling.querySelector('.matches .matchup');
    } else {
        // Move to the championship if there is no next split
        const championshipMatchElement = document.querySelector('.champion .matches .matchup');
        if (championshipMatchElement) {
            nextMatchElement = championshipMatchElement;
        }
    }
    
    return nextMatchElement;
}

// using popup window 
// function setupTournament(playerCount) {
//     console.log('Setting up tournament for the following players:', playerCount);
//     let players = [];
//     let currentPlayerIndex = 0;
//     let totalPlayers = playerCount;

//     function getPlayerName(playerIndex) {
//         const playerName = window.prompt(`Enter name for Player ${playerIndex + 1}:`);
//         return playerName ? playerName.trim() : null;
//     }

//     function addPlayers() {
//         while (currentPlayerIndex < totalPlayers) {
//             const playerName = getPlayerName(currentPlayerIndex);
//             if (playerName) {
//                 players.push(playerName);
//                 currentPlayerIndex++;
//             } else {
//                 alert('Please enter a valid name.');
//             }
//         }
//         alert('All players have been entered: ' + players.join(', '));
//         console.log('Players:', players);
//         // Proceed with the tournament setup using the players array
//     }

//     // Start adding players
//     addPlayers();
// }



