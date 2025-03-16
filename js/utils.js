// Update points text based on remaining points
function updatePointsText(points) {
    let pointsText = document.getElementById("points-text");
    if (points > 0) {
        pointsText.innerText = `${points} points for a correct answer`;
    } else {
        pointsText.style.display = "none"; // Hide when no points left
    }
}

// Display wrong guesses under the input field
function displayWrongGuesses(wrongGuesses) {
    let wrongList = document.getElementById("wrong-guesses");
    wrongList.innerHTML = ""; // Clear previous list

    wrongGuesses.forEach(guess => {
        let li = document.createElement("li");
        li.innerHTML = `<span style="color: red;">❌ ${guess}</span>`;
        wrongList.appendChild(li);
    });
}

// Expose utility functions
export { updatePointsText, displayWrongGuesses };
