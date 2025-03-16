// script.js
import { initializeMap } from './map.js';
import { loadStreetList } from './street.js';
import { checkAnswer, startRound } from './game.js';

// Initialize map
initializeMap();

// Start the first round
startRound();

// Allow pressing Enter to submit
document.getElementById("street-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        checkAnswer();
    }
});
