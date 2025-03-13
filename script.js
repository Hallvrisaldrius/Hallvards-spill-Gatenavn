// Initialize the map (only once)
var map = L.map('map').setView([59.9139, 10.7522], 14); // Center on Oslo

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Function to load the street list from the txt file
async function loadStreetList() {
    try {
        let response = await fetch('streets.txt'); // Load the file
        let text = await response.text();
        let lines = text.split('\n').map(line => line.trim()).filter(line => line); // Clean up lines

        // Choose a random street
        let randomStreet = lines[Math.floor(Math.random() * lines.length)];
        let [name, lat, lng] = randomStreet.split(','); // Extract name & coordinates

        displayStreet(name, parseFloat(lat), parseFloat(lng)); // Display the chosen street
    } catch (error) {
        console.error("Error loading streets:", error);
    }
}

// Function to display the street on the map
function displayStreet(name, lat, lng) {
    // Set map view to the chosen street
    map.setView([lat, lng], 16);

    // Place a marker on the street
    L.marker([lat, lng]).addTo(map)
        .bindPopup(`Guess this street: ${name}`).openPopup();

    // Display the street name below the map
    document.getElementById("street-name").innerText = `Random Street: ${name}`;
}

// Function to check the user's guess
function checkAnswer() {
    let userInput = document.getElementById("street-input").value;
    let correctStreet = document.getElementById("street-name").innerText.replace('Random Street: ', '');

    if (userInput.toLowerCase() === correctStreet.toLowerCase()) {
        document.getElementById("result").innerText = "Correct!";
    } else {
        document.getElementById("result").innerText = "Try again!";
    }
}

// Load the street list when the page loads
loadStreetList();
