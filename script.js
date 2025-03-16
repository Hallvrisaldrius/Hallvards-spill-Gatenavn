var currentRound = 1;
var totalPoints = 0;
var attempts = 0;
var correctStreet = "";

// Initialize the map (centered on Oslo)
var map = L.map('map').setView([59.9139, 10.7522], 14);

// Use a basemap with no labels (Carto Light No Labels)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB, OpenStreetMap contributors'
}).addTo(map);

// Global variables for street polylines
var streetLayer = L.layerGroup().addTo(map);

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

        // Choose a random street
        correctStreet = streets[Math.floor(Math.random() * streets.length)];
        console.log("✅ Selected street:", correctStreet);

        fetchStreetGeometry(correctStreet); // Get all segments for the street
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
            displayStreet(allCoordinates);
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

    // Store all nodes with their coordinates
    data.elements.forEach(element => {
        if (element.type === "node") {
            nodes[element.id] = [element.lat, element.lon];
        }
    });

    // Extract all ways (street segments)
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

// Display all street segments as multiple polylines and center the map
function displayStreet(coordinateGroups) {
    console.log(`📌 Displaying all segments of: ${correctStreet}`);

    // Clear previous street polylines
    streetLayer.clearLayers();

    let allCoords = coordinateGroups.flat(); // Flatten coordinate groups
    if (allCoords.length === 0) {
        console.error("⚠️ No valid coordinates for centering.");
        return;
    }

    // Add each segment as a polyline
    coordinateGroups.forEach(coords => {
        L.polyline(coords, { color: "red", weight: 4 }).addTo(streetLayer);
    });

    // Calculate center of the street
    let centerLat = allCoords.reduce((sum, coord) => sum + coord[0], 0) / allCoords.length;
    let centerLng = allCoords.reduce((sum, coord) => sum + coord[1], 0) / allCoords.length;
    let streetCenter = [centerLat, centerLng];

    // Center the map on the street
    map.setView(streetCenter, 16); // Zoom level 16 keeps it visible
}

// Start a new round and update the round number
function startRound() {
    if (currentRound > 3) {
        alert(`Game Over! Your total score is: ${totalPoints}`);
        return; // End the game after 3 rounds
    }

    // Safely update round number
    let roundNumberElement = document.getElementById("round-number");
    if (roundNumberElement) {
        roundNumberElement.innerText = `Round: ${currentRound}`;
    }

    // Reset guess data for a new round
    attempts = 0;
    document.getElementById("street-input").value = "";
    document.getElementById("wrong-guesses").innerHTML = "";
    document.getElementById("points-text").innerText = "3 points for a correct answer";
    document.getElementById("result").innerText = "";

    // Load a random street for this round
    loadStreetList();
}

// Check the user's answer
function checkAnswer() {
    let userInput = document.getElementById("street-input").value;
    let pointsText = document.getElementById("points-text");

    // Ensure the correct street name is available
    if (!correctStreet) {
        console.error("❌ Street name is not available for comparison.");
        return;
    }

    if (userInput.toLowerCase() === correctStreet.toLowerCase()) {
        totalPoints += parseInt(pointsText.innerText.split(" ")[0]); // Add the points for the correct guess
        document.getElementById("round-result").innerText = `Correct! Points: ${totalPoints}`;
        document.getElementById("total-points").innerText = `Total Points: ${totalPoints}`; // Update total points
        currentRound++; // Move to the next round
        startRound(); // Start a new round
    } else {
        let points = parseInt(pointsText.innerText.split(" ")[0]) - 1;
        pointsText.innerText = points > 0 ? `${points} points for a correct answer` : "0 points";
        document.getElementById("wrong-guesses").innerHTML += `<li>${userInput} ❌</li>`;
    }
}

// Listen for Enter key press to submit guess
document.getElementById("street-input").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        checkAnswer();
    }
});

// Start the first round when the page loads
startRound();
