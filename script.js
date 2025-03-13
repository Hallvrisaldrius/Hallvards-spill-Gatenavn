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

async function loadStreetList() {
    try {
        let response = await fetch('streets.txt'); // Load the file
        let text = await response.text();
        let lines = text.split('\n').map(line => line.trim()).filter(line => line); // Clean up lines

        // Choose a random street
        let randomStreet = lines[Math.floor(Math.random() * lines.length)];
        let [name, lat, lng] = randomStreet.split(','); // Extract name & coordinates

        displayStreet(name, parseFloat(lat), parseFloat(lng));
    } catch (error) {
        console.error("Error loading streets:", error);
    }
}

function displayStreet(name, lat, lng) {
    // Set map view to the chosen street
    map.setView([lat, lng], 16);

    // Place a marker on the street
    L.marker([lat, lng]).addTo(map)
        .bindPopup(`Guess this street: ${name}`).openPopup();
}

// Initialize the map
var map = L.map('map').setView([59.9139, 10.7522], 14); // Center on Oslo
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Load the street list when the page loads
loadStreetList();
