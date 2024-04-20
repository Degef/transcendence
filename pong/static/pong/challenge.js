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
