import { loadStreetList } from './script.js'; 

// game.js
let remainingPoints = 3;
let wrongGuesses = [];
let currentStreet = "";

function checkAnswer() {
    let userInput = document.getElementById("street-input").value.trim();
    
    if (!userInput) return;

    if (userInput.toLowerCase() === currentStreet.toLowerCase()) {
        document.getElementById("result").innerText = `✅ Correct! You earned ${remainingPoints} points!`;
        document.getElementById("points-text").style.display = "none";
    } else {
        wrongGuesses.push(userInput);
        displayWrongGuesses();
        
        remainingPoints = Math.max(0, remainingPoints - 1); // Decrease but never below 0
        updatePointsText();

        if (remainingPoints === 0) {
            document.getElementById("result").innerText = `❌ No more attempts. The correct answer was: ${currentStreet}`;
        }
    }

    document.getElementById("street-input").value = ""; // Clear input field
}

function displayWrongGuesses() {
    let wrongList = document.getElementById("wrong-guesses");
    wrongList.innerHTML = ""; // Clear previous list

    wrongGuesses.forEach(guess => {
        let li = document.createElement("li");
        li.innerHTML = `<span style="color: red;">❌ ${guess}</span>`;
        wrongList.appendChild(li);
    });
}

function updatePointsText() {
    let pointsText = document.getElementById("points-text");
    if (remainingPoints > 0) {
        pointsText.innerText = `${remainingPoints} points for a correct answer`;
    } else {
        pointsText.style.display = "none"; // Hide when no points left
    }
}

function startRound() {
    remainingPoints = 3;
    wrongGuesses = [];
    document.getElementById("wrong-guesses").innerHTML = "";
    document.getElementById("result").innerText = "";
    document.getElementById("points-text").innerText = "3 points for a correct answer";
    document.getElementById("points-text").style.display = "block";
    loadStreetList(); // Assuming loadStreetList is imported from street.js
}

export { checkAnswer, startRound };
