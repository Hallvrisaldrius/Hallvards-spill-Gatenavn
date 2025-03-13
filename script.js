function checkAnswer() {
    let userInput = document.getElementById("street-input").value;
    let correctStreet = "Example Street";  // Placeholder for now

    if (userInput.toLowerCase() === correctStreet.toLowerCase()) {
        document.getElementById("result").innerText = "Correct!";
    } else {
        document.getElementById("result").innerText = "Try again!";
    }
}
