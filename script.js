// Initialize the map (centered on Oslo)
var map = L.map('map').setView([59.9139, 10.7522], 14);

// Use a basemap with no labels (Carto Light No Labels)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB, OpenStreetMap contributors'
}).addTo(map);

// Global variables for street polylines and game state
var streetLayer = L.layerGroup().addTo(map);
var correctStreet = "";
var points = 3;
var incorrectGuesses = new Set();

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

    // Fit the map to the street bounds with a 20% margin
    let bounds = L.latLngBounds(allCoords);
    map.fitBounds(bounds.pad(0.2));
}

// Check the user's answer
function checkAnswer() {
    let userInput = document.getElementById("street-input").value.trim();
    let correctStreet = document.getElementById("street-name").innerText;

    if (userInput.toLowerCase() === correctStreet.toLowerCase()) {
        document.getElementById("result").innerText = `✅ Correct! You got ${points} points.`;
        startRound(); // Start a new round
    } else {
        wrongGuesses.push(userInput);

        // Display wrong guesses with a red X (insert at the top)
        let wrongGuessesList = document.getElementById("wrong-guesses");
        let listItem = document.createElement("li");
        listItem.innerHTML = `<span style="color: red;">❌ ${userInput}</span>`;
        
        // Insert at the beginning of the list
        wrongGuessesList.prepend(listItem);

        // Decrease points and update display
        points--;
        updatePointsDisplay();

        // After the third wrong guess, reveal the correct answer but still display the guess
        if (wrongGuesses.length >= 3) {
            document.getElementById("result").innerText = `❌ The correct answer was: ${correctStreet}`;
            startRound(); // Start a new round
        }
    }
}

    // Clear input field
    document.getElementById("street-input").value = "";

    // After 3 failed attempts, reveal the correct answer
    if (points === 0) {
        resultDiv.innerText = `❌ The correct street was: ${correctStreet}`;
        resultDiv.style.color = "red";
    }
}

// Update the points message based on remaining points
function updatePointsText() {
    let pointsText = document.getElementById("points-text");
    if (points > 0) {
        pointsText.innerText = `${points} points for correct answer`;
    } else {
        pointsText.innerText = ""; // Hide the text when points reach 0
    }
}

// Initialize points at the start of a new round
function startRound() {
    points = 3; // Reset points to 3 at the start
    incorrectGuesses.clear();
    document.getElementById("wrong-guesses").innerHTML = ""; // Clear previous wrong guesses
    updatePointsText();
    loadStreetList();
}

document.getElementById("street-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        checkAnswer();
    }
});

// Load a random street when the page loads
startRound();
