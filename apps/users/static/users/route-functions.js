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
        // updateBody(htmlContent);
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        newBodyContent = doc.body.innerHTML;
        document.body.innerHTML = newBodyContent;
        // console.log(doc.body.innerHTML)
        if (doc.body.innerHTML.includes("To keep connected with us")) {
            // console.log('login page');
            updateURL('/login/');
        }
        else
            updateURL('/');
            // console.log('not login page');
        if (back_or_forward == 0)
            return    
        // updateURL('/login/');
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