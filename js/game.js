// game.js

// Global variable to keep track of the current round and available points
let currentRound = 1;
let availablePoints = 3;
let correctStreet = "";

// Reset the game and start a new round
export function startRound() {
    // Reset available points and increment round
    availablePoints = 3;
    currentRound++;

    // Display the available points message
    updatePointsText(availablePoints);

    // Call the function to load a new random street from the street list
    loadStreetList();

    // Clear previous wrong guesses
    clearWrongGuesses();
}

// Update the points text below the input field
export function updatePointsText(points) {
    const pointsText = document.getElementById("points-text");
    if (points > 0) {
        pointsText.innerText = `${points} points for correct answer`;
        pointsText.style.display = "block";  // Ensure it's visible
    } else {
        pointsText.style.display = "none";  // Hide the points text when 0 points
    }
}

// Function to check the user's guess and update points accordingly
export function checkAnswer() {
    let userInput = document.getElementById("street-input").value;
    if (userInput.toLowerCase() === correctStreet.toLowerCase()) {
        // Correct guess
        document.getElementById("result").innerText = "✅ Correct!";
        // Disable input after correct answer
        document.getElementById("street-input").disabled = true;
    } else {
        // Wrong guess
        addWrongGuess(userInput);
        availablePoints--;

        // Update points text and reset input field
        updatePointsText(availablePoints);

        if (availablePoints === 0) {
            // No more points available, show the correct street name
            document.getElementById("result").innerText = `❌ Correct street: ${correctStreet}`;
            document.getElementById("street-input").disabled = true;
        }
    }
}

// Function to add wrong guesses to the list
function addWrongGuess(guess) {
    const wrongGuessesList = document.getElementById("wrong-guesses");
    let wrongGuessItem = document.createElement("li");
    wrongGuessItem.textContent = `${guess} ❌`;
    wrongGuessesList.appendChild(wrongGuessItem);
}

// Function to clear the list of wrong guesses
function clearWrongGuesses() {
    const wrongGuessesList = document.getElementById("wrong-guesses");
    wrongGuessesList.innerHTML = ""; // Clear the list
}

// Function to set the correct street name after a round starts
export function setCorrectStreet(streetName) {
    correctStreet = streetName;
}
