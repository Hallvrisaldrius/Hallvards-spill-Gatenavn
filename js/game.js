import { loadStreetList, currentStreet } from './street.js';
import { updatePointsText, displayWrongGuesses } from './utils.js';

// Global variables for the game
var remainingPoints = 3;
var wrongGuesses = [];

// Check the user's answer
function checkAnswer() {
    let userInput = document.getElementById("street-input").value.trim();
    
    if (!userInput) return; // Ignore empty input

    if (userInput.toLowerCase() === currentStreet.toLowerCase()) {
        document.getElementById("result").innerText = `✅ Correct! You earned ${remainingPoints} points!`;
        document.getElementById("points-text").style.display = "none";
    } else {
        wrongGuesses.push(userInput);
        displayWrongGuesses(wrongGuesses);
        
        remainingPoints = Math.max(0, remainingPoints - 1); // Decrease but never below 0
        updatePointsText(remainingPoints);

        if (remainingPoints === 0) {
            document.getElementById("result").innerText = `❌ No more attempts. The correct answer was: ${currentStreet}`;
        }
    }

    document.getElementById("street-input").value = ""; // Clear input field
}

// Start a new round
function startRound() {
    remainingPoints = 3;
    wrongGuesses = [];
    document.getElementById("wrong-guesses").innerHTML = "";
    document.getElementById("result").innerText = "";
    document.getElementById("points-text").innerText = "3 points for a correct answer";
    document.getElementById("points-text").style.display = "block";

    loadStreetList();
}

// Expose game-related functions
export { startRound, checkAnswer };
