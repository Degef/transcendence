function drawNet(data) {
    data.ctx.beginPath();
    data.ctx.setLineDash([5, 15]);
    data.ctx.moveTo(data.canvas.width / 2, 0);
    data.ctx.lineTo(data.canvas.width / 2, data.canvas.height);
    data.ctx.strokeStyle = '#fff';
    data.ctx.stroke();
}

function drawPaddlesBall(data) {
    data.ctx.fillStyle = '#fff';
    data.ctx.fillRect(data.paddle1.x, data.paddle1.y, data.paddleWidth, data.paddleHeight);
    data.ctx.fillRect(data.paddle2.x, data.paddle2.y, data.paddleWidth, data.paddleHeight);
    data.ctx.beginPath();
    data.ctx.arc(data.ball.x, data.ball.y, data.ballRadius, 0, Math.PI * 2);
    data.ctx.fill();
}

function bounceOffPaddles(data) {
    if (
        data.ball.x - data.ballRadius < data.paddle1.x + data.paddleWidth &&
        data.ball.y + data.ballRadius > data.paddle1.y &&
        data.ball.y - data.ballRadius < data.paddle1.y + data.paddleHeight && 
        data.ball.dir == -1) {
        data.ball.speedX *= -1;
        data.ball.dir = 1;
    }

    if (data.ball.x + data.ballRadius > data.paddle2.x &&
        data.ball.y + data.ballRadius > data.paddle2.y &&
        data.ball.y - data.ballRadius < data.paddle2.y + data.paddleHeight && data.ball.dir == 1) 
        {
            data.ball.speedX *= -1;
            data.ball.dir = -1;
        }
}

function bounceOffBorders(data) {
    if (data.ball.y + data.ballRadius >= data.canvas.height || data.ball.y - data.ballRadius <= 0) {
        data.ball.speedY *= -1;
    }
}

function resetBall(data) {
    if (data.ball.x + data.ballRadius < 0 || data.ball.x - data.ballRadius > data.canvas.width) {
        if (data.ball.x + data.ballRadius < 0) {
            data.score2.textContent = parseInt(data.score2.textContent) + 1;
        } else {
            data.score1.textContent = parseInt(data.score1.textContent) + 1;
        }
        data.ball.x = data.canvas.width / 2;
        data.ball.y = data.canvas.height / 2;
    }
}

function Draw(data) {
    drawNet(data);
    if (!data.paused && data.started) {
        data.ctx.clearRect(0, 0, data.canvas.width, data.canvas.height);
        drawNet(data);
        drawPaddlesBall(data);
        data.ball.x += data.ball.speedX;
        data.ball.y += data.ball.speedY;
        bounceOffPaddles(data); // Bounce off paddles
        bounceOffBorders(data); // Bounce off top and bottom
        resetBall(data); // Reset ball if it goes off screen

        // Update paddle positions
        data.paddle1.y += data.paddle1.speedY;
        data.paddle2.y += data.paddle2.speedY;

        // Keep paddles within the canvas
        data.paddle1.y = Math.max(0, Math.min(data.canvas.height - data.paddleHeight, data.paddle1.y));
        data.paddle2.y = Math.max(0, Math.min(data.canvas.height - data.paddleHeight, data.paddle2.y));
    }
    // Request the next animation frame
    requestAnimationFrame(() => Draw(data));
}

function startGame() {
    let url  = `ws://${window.location.host}/ws/socket-server/`;
    const socket = new WebSocket(url);
    // console.log(socket);
    socket.onmessage = function(e) {
        let data = JSON.parse(e.data);
        console.log('Data: ', data);
    }
    // const data = {
    //     'canvas': document.querySelector('canvas'),
    //     'ctx': canvas.getContext('2d'),
    //     'score1': document.querySelector('#score1'),
    //     'score2': document.querySelector('#score2'),
    //     'pause': document.querySelector('#pause'),
    //     'reset': document.querySelector('#reset'),
    //     'start': document.querySelector('#start'),
    //     'paddleWidth': 10,
    //     'paddleHeight': 90,
    //     'ballRadius': 10,
    //     'paused': false,
    //     'started': false,
    // };
    // data.paddle1 = { x: 0, y: data.canvas.height / 2 - data.paddleHeight / 2, speedY: 0 };
    // data.paddle2 = { x: data.canvas.width - data.paddleWidth, y: data.canvas.height / 2 - data.paddleHeight / 2, speedY: 0 };
    // data.ball = { x: data.canvas.width / 2, y: data.canvas.height / 2, speedX: 5, speedY: 5 , dir: 1};
    // // console.log(data);
    
    // data.pause.addEventListener('click', () => {
    //     data.paused = !data.paused;
    //     if (data.paused) {
    //         data.pause.textContent = 'Resume';
    //     } else {
    //         data.pause.textContent = 'Pause';
    //     }
    // });

    // data.start.addEventListener('click', () => {
    //     data.started = true;
    //     data.start.style.display = 'none';
    //     data.reset.style.display = 'block';
    // });
    
    // window.addEventListener('keydown', (e) => {
    //     if (e.key === 'w') {
    //         data.paddle1.speedY = -10;
    //     } else if (e.key === 's') {
    //         data.paddle1.speedY = 10;
    //     }
        
    //     if (e.key === 'ArrowUp') {
    //         data.paddle2.speedY = -10;
    //     } else if (e.key === 'ArrowDown') {
    //         data.paddle2.speedY = 10;
    //     }

    //     if (e.key === ' ' && data.started) {
    //         data.paused = !data.paused;
    //         if (data.paused) {
    //             data.pause.textContent = 'Resume';
    //         } else {
    //             data.pause.textContent = 'Pause';
    //         }
    //     }
    // });
    
    // window.addEventListener('keyup', (e) => {
    //     if (e.key === 'w' || e.key === 's') {
    //         data.paddle1.speedY = 0;
    //     }
        
    //     if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    //         data.paddle2.speedY = 0;
    //     }
    // });

    // Draw(data);
}
