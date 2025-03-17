// Initialize the map (but do not set a fixed center)
var map = L.map('map');
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB, OpenStreetMap contributors'
}).addTo(map);

// Global variables
var streetLayer = L.layerGroup().addTo(map);
var streets = [];
var currentStreet = "";
var currentPoints = 3;
var totalScore = 0;
var round = 1;
const maxRounds = 3;

// Load and select a random street
async function loadStreetList() {
    try {
        let response = await fetch('streets.txt');
        let text = await response.text();
        streets = text.split('\n').map(line => line.trim()).filter(line => line);

        if (streets.length === 0) {
            console.error("⚠️ Street list is empty!");
            return;
        }

        startRound();
    } catch (error) {
        console.error("❌ Error loading streets:", error);
    }
}

// Start a new round
function startRound() {
    if (round > maxRounds) {
        alert(`Game Over! Final Score: ${totalScore} points`);
        return;
    }

    document.getElementById("round-number").innerText = `Round ${round} of ${maxRounds}`;
    document.getElementById("wrong-guesses").innerHTML = "";
    document.getElementById("street-input").value = "";
    document.getElementById("points-display").innerText = "3 points for a correct answer";

    currentStreet = streets[Math.floor(Math.random() * streets.length)];
    console.log("✅ Selected street:", currentStreet);
    
    currentPoints = 3;
    fetchStreetGeometry(currentStreet);
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

// Display the street on the map
function displayStreet(coordinateGroups) {
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
    map.fitBounds(bounds.pad(0.2)); // 20% margin
}

// Check the user's answer
function checkAnswer() {
    let userInput = document.getElementById("street-input").value.trim();
    
    if (userInput.toLowerCase() === currentStreet.toLowerCase()) {
        totalScore += currentPoints;
        document.getElementById("total-score").innerText = `Total Score: ${totalScore}`;
        
        if (round < maxRounds) {
            round++;
            startRound();
        } else {
            alert(`Game Over! Final Score: ${totalScore} points`);
        }
    } else {
        recordWrongGuess(userInput);
        if (currentPoints > 0) {
            currentPoints--;
        }

        if (currentPoints === 0) {
            alert(`The correct answer was: ${currentStreet}`);
            round++;
            startRound();
        } else {
            document.getElementById("points-display").innerText = `${currentPoints} points for a correct answer`;
        }
    }
}

// Store wrong guesses
function recordWrongGuess(guess) {
    let wrongGuessesList = document.getElementById("wrong-guesses");
    let listItem = document.createElement("li");
    listItem.innerHTML = `❌ ${guess}`;
    wrongGuessesList.appendChild(listItem);
}

// Allow pressing "Enter" to submit
document.getElementById("street-input").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        checkAnswer();
    }
});

// Load a random street when the page loads
loadStreetList();
