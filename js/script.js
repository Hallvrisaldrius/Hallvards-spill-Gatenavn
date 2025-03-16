import { startRound } from './game.js';
import { updatePointsText } from './utils.js';

// Allow pressing Enter to submit
document.getElementById("street-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        checkAnswer();
    }
});

// Load the first round
startRound();
