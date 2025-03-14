// Initialize the map (centered on Oslo)
var map = L.map('map').setView([59.9139, 10.7522], 14);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Global marker variable
var streetMarker = null;

// Function to load the street list from the file
async function loadStreetList() {
    try {
        let response = await fetch('streets.txt'); // Load the file
        let text = await response.text();
        let lines = text.split('\n').map(line => line.trim()).filter(line => line); // Clean up lines

        if (lines.length === 0) {
            console.error("Street list is empty!");
            return;
        }

        // Choose a random street
        let randomStreet = lines[Math.floor(Math.random() * lines.length)];
        let [name, lat, lng] = randomStreet.split(','); // Extract name & coordinates

        if (!name || isNaN(lat) || isNaN(lng)) {
            console.error("Invalid street data:", randomStreet);
            return;
        }

        displayStreet(name, parseFloat(lat), parseFloat(lng));
    } catch (error) {
        console.error("Error loading streets:", error);
    }
}

// Function to display the selected street
function displayStreet(name, lat, lng) {
    // Set the map view to the chosen street's location
    map.setView([lat, lng], 16);

    // Remove previous marker if it exists
    if (streetMarker) {
        map.removeLayer(streetMarker);
    }

    // Add a new marker at the chosen street's location
    streetMarker = L.marker([lat, lng]).addTo(map)
        .bindPopup(`Guess this street!`).openPopup();

    // Store the correct street name in the hidden <p> tag
    document.getElementById("street-name").innerText = name;

    console.log("Displayed street:", name, "at", lat, lng); // Debugging log
}

// Function to check the user's guess
function checkAnswer() {
    let userInput = document.getElementById("street-input").value;
    let correctStreet = document.getElementById("street-name").innerText;

    if (userInput.toLowerCase() === correctStreet.toLowerCase()) {
        document.getElementById("result").innerText = "Correct!";
    } else {
        document.getElementById("result").innerText = "Try again!";
    }
}

// Load the street list when the page loads
loadStreetList();
