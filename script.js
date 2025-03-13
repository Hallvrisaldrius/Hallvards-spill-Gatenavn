// Initialize the map
var map = L.map('map').setView([51.505, -0.09], 13); // Set default center and zoom level

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Example: Highlight a random street (placeholder for now)
var streetMarker = L.marker([51.505, -0.09]).addTo(map)
    .bindPopup("Guess this street!").openPopup();


function checkAnswer() {
    let userInput = document.getElementById("street-input").value;
    let correctStreet = "Example Street";  // Placeholder for now

    if (userInput.toLowerCase() === correctStreet.toLowerCase()) {
        document.getElementById("result").innerText = "Correct!";
    } else {
        document.getElementById("result").innerText = "Try again!";
    }
}

