// Initialize the map (no default center)
var map = L.map('map');

// Use a basemap with no labels
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB, OpenStreetMap contributors'
}).addTo(map);

// Global variables
var streetLayer = L.layerGroup().addTo(map);
var correctStreet = "";
var availablePoints = 3;
var wrongGuesses = [];

// Load and start a new round
async function startRound() {
    try {
        let response = await fetch('streets.txt');
        let text = await response.text();
        let streets = text.split('\n').map(line => line.trim()).filter(line => line);

        if (streets.length === 0) {
            console.error("⚠️ Street list is empty!");
            return;
        }

        correctStreet = streets[Math.floor(Math.random() * streets.length)];
        console.log("✅ Selected street:", correctStreet);

        wrongGuesses = [];
        availablePoints = 3;
        updatePointsText();
        document.getElementById("wrong-guesses").innerHTML = "";
        document.getElementById("result").innerText = "";
        document.getElementById("street-input").value = "";

        fetchStreetGeometry(correctStreet);
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

// Display street segments and center the map
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

    let bounds = L.latLngBounds(allCoords);
    map.fitBounds(bounds.pad(0.2));
}

// Check user input
function checkAnswer() {
    let userInput = document.getElementById("street-input").value.trim();

    if (userInput.toLowerCase() === correctStreet.toLowerCase()) {
        document.getElementById("result").innerText = `✅ Correct! You earned ${availablePoints} points!`;
        startRound();
    } else {
        wrongGuesses.push(userInput);
        updateWrongGuesses();

        if (availablePoints > 1) {
            availablePoints--;
            updatePointsText();
        } else {
            availablePoints = 0;
            updatePointsText();
            document.getElementById("result").innerText = `❌ The correct street was: ${correctStreet}`;
            startRound();
        }
    }
}

// Update wrong guesses list
function updateWrongGuesses() {
    let list = document.getElementById("wrong-guesses");
    list.innerHTML = "";
    wrongGuesses.forEach(guess => {
        let item = document.createElement("li");
        item.innerHTML = `❌ ${guess}`;
        list.appendChild(item);
    });
}

// Update points display
function updatePointsText() {
    let pointsText = document.getElementById("points-text");
    if (availablePoints > 0) {
        pointsText.innerText = `${availablePoints} points for correct answer`;
    } else {
        pointsText.innerText = "";
    }
}

// Submit on Enter key
document.getElementById("street-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        checkAnswer();
    }
});

// Start the first round
startRound();
