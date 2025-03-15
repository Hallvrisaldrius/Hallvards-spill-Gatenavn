// Initialize variables
var points = 3;
var attempts = 0;
var maxAttempts = 3;
var correctStreet = "";
var gameEnded = false;

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
        let randomStreet = streets[Math.floor(Math.random() * streets.length)];
        console.log("✅ Selected street:", randomStreet);

        fetchStreetGeometry(randomStreet); // Get all segments for the street
        correctStreet = randomStreet; // Store the correct street name
        gameEnded = false; // Reset the game state

        // Reset points and attempts
        points = 3;
        attempts = 0;
        updatePointsText();
        document.getElementById("wrong-guesses").innerHTML = ""; // Clear previous wrong guesses
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
function displayStreet(name, coordinateGroups) {
    console.log(`📌 Displaying all segments of: ${name}`);

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

    // Store the correct street name
    document.getElementById("street-name").innerText = name;
}

// Check the user's answer
function checkAnswer() {
    if (gameEnded) return; // Prevent further guesses after the game ends

    let userInput = document.getElementById("street-input").value.trim();
    let correctStreetName = document.getElementById("street-name").innerText;

    // If the guess is correct
    if (userInput.toLowerCase() === correctStreetName.toLowerCase()) {
        points = points > 0 ? points : 0; // Ensure no negative points
        document.getElementById("result").innerText = `✅ Correct! You scored ${points} point(s).`;
        gameEnded = true;
        document.getElementById("points-text").style.display = "none"; // Hide points text
        setTimeout(loadStreetList, 3000); // Restart the game after 3 seconds
    } else {
        // If the guess is wrong
        attempts++;
        points = Math.max(0, points - 1); // Deduct 1 point per wrong attempt
        updatePointsText(); // Update the points text

        // Add the wrong guess to the list
        
