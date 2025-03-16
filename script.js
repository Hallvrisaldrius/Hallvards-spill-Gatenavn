// Global variables
var streetLayer = L.layerGroup().addTo(map);
var correctStreet = "";
var availablePoints = 3;
var wrongGuesses = []; // ✅ Ensure wrongGuesses is globally defined

// Check user input
function checkAnswer() {
    let userInput = document.getElementById("street-input").value.trim();

    if (userInput.toLowerCase() === correctStreet.toLowerCase()) {
        document.getElementById("result").innerText = `✅ Correct! You earned ${availablePoints} points!`;
        startRound();
    } else {
        wrongGuesses.push(userInput); // ✅ Add wrong guess to the global array
        updateWrongGuesses();

        if (availablePoints > 1) {
            availablePoints--;
            updatePointsText();
        } else {
            availablePoints = 0;
            updatePointsText();
            document.getElementById("result").innerText = `❌ The correct street was: ${correctStreet}`;
            startRound();
        }
    }
}

// Update wrong guesses list
function updateWrongGuesses() {
    let list = document.getElementById("wrong-guesses");
    list.innerHTML = "";
    wrongGuesses.forEach(guess => {
        let item = document.createElement("li");
        item.innerHTML = `❌ ${guess}`;
        list.appendChild(item);
    });
}
