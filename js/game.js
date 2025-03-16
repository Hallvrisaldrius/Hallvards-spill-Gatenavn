// game.js

import { loadStreetList } from './street.js';

// Store the correct street name and attempt counter
let correctStreet = '';
let attemptCount = 0;

// Function to start a new round
async function startRound() {
    correctStreet = await loadStreetList();  // Get the correct street name
    if (correctStreet) {
        attemptCount = 0; // Reset attempt count
        document.getElementById("street-input").value = ""; // Clear input field
        document.getElementById("result").innerText = ""; // Clear result message
        document.getElementById("wrong-guesses").innerHTML = ""; // Clear wrong guesses list
        document.getElementById("points-text").innerText = "3 points for correct answer"; // Set initial points text
        document.getElementById("street-name").style.display = "none"; // Hide the street name until the end
    }
}

// Function to check the user's guess
function checkAnswer() {
    let userInput = document.getElementById("street-input").value.trim();
    if (!userInput) return; // Avoid empty guesses

    console.log(`Checking guess: ${userInput}`); // Log user input for debugging

    let points = 3 - attemptCount;
    attemptCount++;

    if (userInput.toLowerCase() === correctStreet.toLowerCase()) {
        // Correct guess
        document.getElementById("result").innerText = `✅ Correct! You earned ${points} point(s).`;
        document.getElementById("street-name").innerText = correctStreet; // Display correct street name
        document.getElementById("street-name").style.display = "block"; // Show the street name
        document.getElementById("points-text").style.display = "none"; // Hide points after correct guess
    } else {
        // Wrong guess
        let wrongList = document.getElementById("wrong-guesses");
        let li = document.createElement("li");
        li.innerText = userInput;
        li.style.color = "red"; // Add red color for wrong answers
        wrongList.appendChild(li);

        // Update points and display message
        if (attemptCount === 1) {
            document.getElementById("points-text").innerText = "2 points for correct answer";
        } else if (attemptCount === 2) {
            document.getElementById("points-text").innerText = "1 point for correct answer";
        } else if (attemptCount >= 3) {
            // After 3 wrong attempts, show the correct answer
            document.getElementById("result").innerText = `❌ No more attempts. The correct answer was: ${correctStreet}`;
            document.getElementById("street-name").innerText = correctStreet; // Display the correct street name
            document.getElementById("street-name").style.display = "block"; // Show the street name
            document.getElementById("points-text").style.display = "none"; // Hide points text
        }
    }
}

// Function to submit the answer when "enter" is pressed
document.getElementById("street-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        checkAnswer();
    }
});

// Start the game when the page loads
startRound();
