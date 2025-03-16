// Initialize the map (no default center to avoid unnecessary movement)
var map = L.map('map');

// Use a basemap with no labels
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB, OpenStreetMap contributors'
}).addTo(map);

// Global variables
var streetLayer = L.layerGroup().addTo(map);
var correctStreet = "";
var availablePoints = 3;
var wrongGuesses = []; // ✅ Declared globally

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

        fetchStreetGeometry(randomStreet);
    } catch (error) {
        console.error("❌ Error loading streets:", error);
    }
}

// Query Overpass API to get street geometry
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

        if (!data.elements.length) {
            console.error("⚠️ Street not found:", streetName);
            return;
        }

        let allCoordinates = extractAllCoordinates(data);
        if (allCoordinates.length) {
            startRound(streetName, allCoordinates);
        } else {
            console.error("❌ No valid coordinates found for", streetName);
        }
    } catch (error) {
        console.error("❌ Overpass API error:", error);
    }
}

// Extract coordinates for all street segments
function extractAllCoordinates(data) {
    let nodes = {};
    let allCoordinates = [];

    // Store nodes with coordinates
    data.elements.forEach(element => {
        if (element.type === "node") {
            nodes[element.id] = [element.lat, element.lon];
        }
    });

    // Extract way segments
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

// Start a new round
function startRound(name, coordinateGroups) {
    console.log(`📌 Starting round with: ${name}`);

    // Reset round variables
    correctStreet = name;
    availablePoints = 3;
    wrongGuesses = []; // ✅ Reset wrong guesses

    // Clear previous street polylines
    streetLayer.clearLayers();

    let allCoords = coordinateGroups.flat();
    if (allCoords.length === 0) {
        console.error("⚠️ No valid coordinates for centering.");
        return;
    }

    // Add street segments as polylines
    coordinateGroups.forEach(coords => {
        L.polyline(coords, { color: "red", weight: 4 }).addTo(streetLayer);
    });

    // Center map with padding
    let bounds = L.latLngBounds(allCoords);
    map.fitBounds(bounds.pad(0.2)); // ✅ 20% margin

    // Update UI
    document.getElementById("street-input").value = "";
    document.getElementById("wrong-guesses").innerHTML = ""; // ✅ Clear previous wrong guesses
    updatePointsText();
}

// Check user input
function checkAnswer() {
    let userInput = document.getElementById("street-input").value.trim();

    if (userInput.toLowerCase() === correctStreet.toLowerCase()) {
        document.getElementById("result").innerText = `✅ Correct! You earned ${availablePoints} points!`;
        setTimeout(loadStreetList, 1500); // Load new street after a short delay
    } else {
        wrongGuesses.push(userInput); // ✅ Add wrong guess
        updateWrongGuesses();

        if (availablePoints > 1) {
            availablePoints--;
            updatePointsText();
        } else {
            availablePoints = 0;
            updatePointsText();
            document.getElementById("result").innerText = `❌ The correct street was: ${correctStreet}`;
            setTimeout(loadStreetList, 2000); // Load new street after a delay
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

// Update points text
function updatePointsText() {
    let pointsText = document.getElementById("points-text");
    pointsText.innerText = availablePoints > 0 ? `${availablePoints} points for correct answer` : "";
}

// Allow pressing "Enter" to submit guess
document.getElementById("street-input").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        checkAnswer();
    }
});

// Load a random street when the page loads
loadStreetList();
