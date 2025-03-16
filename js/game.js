// Declare global variables
let correctStreet = ""; // Store the correct street name
let attemptCount = 0; // Track the number of attempts

// Function to load the street list and select a random street
async function loadStreetList() {
    try {
        let response = await fetch('streets.txt'); // Load the file
        let text = await response.text();
        let streets = text.split('\n').map(line => line.trim()).filter(line => line); // Clean up

        if (streets.length === 0) {
            console.error("⚠️ Street list is empty!");
            return;
        }

        // Choose a random street
        correctStreet = streets[Math.floor(Math.random() * streets.length)];
        console.log("✅ Selected street:", correctStreet);

        startRound(); // Start the round after loading the street
    } catch (error) {
        console.error("❌ Error loading streets:", error);
    }
}

// Function to start a new round
function startRound() {
    attemptCount = 0; // Reset attempt count
    document.getElementById("street-input").value = ""; // Clear input field
    document.getElementById("result").innerText = ""; // Clear result message
    document.getElementById("wrong-guesses").innerHTML = ""; // Clear wrong guesses list
    document.getElementById("points-text").innerText = "3 points for correct answer"; // Set initial points text
    document.getElementById("street-name").style.display = "none"; // Hide the street name until the end
}

// Function to check the user's guess
function checkAnswer() {
    let userInput = document.getElementById("street-input").value.trim();
    if (!userInput) return; // Avoid empty guesses

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
loadStreetList();
