// game.js

import { loadStreetList } from './street.js';

// Store the correct street name and attempt counter
let correctStreet = '';
let attemptCounter = 0;

// Initialize the game round
function startRound(streetName) {
    correctStreet = streetName;  // Set the correct street name
    attemptCounter = 0;  // Reset attempt counter
    document.getElementById("wrong-guesses").innerHTML = "";  // Clear wrong guesses

    // Set the points text based on available attempts
    updatePointsText(3);
}

// Function to update points text based on remaining attempts
function updatePointsText(points) {
    let pointsText = document.getElementById("points-text");
    if (points > 0) {
        pointsText.innerText = `${points} points for correct answer`;
    } else {
        pointsText.innerText = "";  // Hide when no points left
    }
}

// Function to check the user's guess
function checkAnswer() {
    const userInput = document.getElementById("street-input").value;
    
    // If the user guesses correctly
    if (userInput.toLowerCase() === correctStreet.toLowerCase()) {
        document.getElementById("result").innerText = "✅ Correct!";
        document.getElementById("wrong-guesses").innerHTML = "";  // Clear wrong guesses
        return;
    }
    
    // Handle wrong guesses
    if (attemptCounter < 3) {
        attemptCounter++;
        updatePointsText(3 - attemptCounter); // Update points text
        
        // Add the wrong guess to the list
        const wrongGuessItem = document.createElement("li");
        wrongGuessItem.innerText = `${userInput} ❌`;
        document.getElementById("wrong-guesses").appendChild(wrongGuessItem);
    }
    
    // After 3 wrong attempts, show the correct answer
    if (attemptCounter === 3) {
        document.getElementById("result").innerText = `❌ No more attempts. The correct answer was: ${correctStreet}`;
    }
}

// Start a new round when the page loads
loadStreetList();

// Add event listener for "Enter" key to submit the guess
document.getElementById("street-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        checkAnswer();
    }
});
