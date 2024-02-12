

function handleButtonClick(event) {
    const buttonId = event.target.id;
    event.preventDefault();

    if (buttonFunctions.hasOwnProperty(buttonId)) {
        buttonFunctions[buttonId](event);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    document.body.addEventListener('click', handleButtonClick);
}
);