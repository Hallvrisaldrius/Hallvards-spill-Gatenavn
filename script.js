// Initialize the map without a fixed center
var map = L.map('map');

// Use a basemap with no labels (Carto Light No Labels)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB, OpenStreetMap contributors'
}).addTo(map);

// Global variables
var streetLayer = L.layerGroup().addTo(map);
let incorrectGuesses = new Set(); // Store wrong guesses uniquely
let attempts = 0; // Track the number of attempts
let points = 3; // Store points (start with 3 points)
let correctStreet = ''; // Store the correct street name

// Load and select a random street
async function loadStreetList() {
    try {
        let response = await fetch('streets.txt');
        let text = await response.text();
        let streets = text.split('\n').map(line => line.trim()).filter(line => line);

        if (streets.length === 0) {
            console.error("⚠️ Street list is empty!");
            return;
        }

        let randomStreet = streets[Math.floor(Math.random() * streets.length)];
        console.log("✅ Selected street:", randomStreet);
        fetchStreetGeometry(randomStreet);
    } catch (error) {
        console.error("❌ Error loading streets:", error);
    }
}

// Query Overpass API to get ALL segments for the street
async function fetchStreetGeometry(streetName) {
    let query = `
        [out:json];
        way["name"="${streetName}"]["highway"](59.7,10.4,60.1,10.9); 
        (._;>;);
        out body;
    `;
    let url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        let response = await fetch(url);
        let data = await response.json();
        console.log("🗺 Overpass API response:", data);

        if (!data.elements.length) {
            console.error("⚠️ Street not found:", streetName);
            return;
        }

        let allCoordinates = extractAllCoordinates(data);
        if (allCoordinates.length) {
            displayStreet(streetName, allCoordinates);
        } else {
            console.error("❌ No valid coordinates found for", streetName);
        }
    } catch (error) {
        console.error("❌ Overpass API error:", error);
    }
}

// Extract coordinates for ALL street segments
function extractAllCoordinates(data) {
    let nodes = {};
    let allCoordinates = [];

    data.elements.forEach(element => {
        if (element.type === "node") {
            nodes[element.id] = [element.lat, element.lon];
        }
    });

    data.elements.forEach(element => {
        if (element.type === "way") {
            let wayCoords = element.nodes.map(nodeId => nodes[nodeId]).filter(coord => coord);
            if (wayCoords.length) {
                allCoordinates.push(wayCoords);
            }
        }
    });

    return allCoordinates;
}

// Display all street segments and center the map
function displayStreet(name, coordinateGroups) {
    console.log(`📌 Displaying all segments of: ${name}`);
    streetLayer.clearLayers();

    let allCoords = coordinateGroups.flat();
    if (allCoords.length === 0) {
        console.error("⚠️ No valid coordinates for centering.");
        return;
    }

    coordinateGroups.forEach(coords => {
        L.polyline(coords, { color: "red", weight: 4 }).addTo(streetLayer);
    });

    // Create bounding box
    let bounds = L.latLngBounds(allCoords);
    let expandedBounds = bounds.pad(0.2); // 20% margin
    map.fitBounds(expandedBounds);

    // Store the correct street name globally
    correctStreet = name;
}

// Update the button text to show current points
function updateButtonText() {
    const submitButton = document.querySelector('button');
    submitButton.innerText = `Submit - ${points} points`;
}

// Check the user's answer
// Function to check the user's answer and update points
function checkAnswer() {
    let userInput = document.getElementById("street-input").value;
    let correctStreet = document.getElementById("street-name").innerText;
    let points = parseInt(document.getElementById("submit-btn").innerText.split(' ')[2]);

    // If the guess is correct
    if (userInput.toLowerCase() === correctStreet.toLowerCase()) {
        document.getElementById("result").innerText = "✅ Correct!";
        document.getElementById("submit-btn").disabled = true; // Disable the button after correct answer
    } else {
        // Deduct points if the guess is wrong
        points--;
        document.getElementById("submit-btn").innerText = `Submit - ${points} points`; // Update button text with remaining points

        if (points === 0) {
            document.getElementById("result").innerText = `❌ The correct street is: ${correctStreet}`;
            document.getElementById("submit-btn").disabled = true; // Disable the button after all attempts
        }
    }
}

// Listen for "Enter" key press in input field
document.getElementById("street-input").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        checkAnswer();
    }
});

// Load a random street when the page loads
loadStreetList();

// Initially set the button text
updateButtonText();
