// Initialize the map
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

// Load streets from text file
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
    // Ensure elements exist before modifying
    let roundNumberElement = document.getElementById("round-number");
    let pointsDisplayElement = document.getElementById("points-display");
    let totalScoreElement = document.getElementById("total-score");

    if (roundNumberElement) roundNumberElement.innerText = `Round ${round} of ${maxRounds}`;
    if (pointsDisplayElement) pointsDisplayElement.innerText = "3 points for a correct answer";
    if (totalScoreElement) totalScoreElement.innerText = `Total Score: ${totalScore}`;

    document.getElementById("wrong-guesses").innerHTML = "";
    document.getElementById("street-input").value = "";

    currentStreet = streets[Math.floor(Math.random() * streets.length)];
    console.log("✅ Selected street:", currentStreet);
    
    currentPoints = 3;
    fetchStreetGeometry(currentStreet);
}

// Fetch street geometry from OpenStreetMap Overpass API
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

// Extract all coordinates for a street
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

// Display the selected street on the map
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
    map.fitBounds(bounds.pad(0.2)); // Add margin
}

// Check the user's answer
function checkAnswer() {
    let userInput = document.getElementById("street-input").value.trim();

    if (userInput.toLowerCase() === currentStreet.toLowerCase()) {
        alert(`You are correct! This is ${currentStreet}`);

        // ✅ Update total score before moving to the next round
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

        let pointsDisplayElement = document.getElementById("points-display");
        if (currentPoints === 0) {
            alert(`The correct answer was: ${currentStreet}`);
            finishRound()
            startRound();
        } else if (pointsDisplayElement) {
            pointsDisplayElement.innerText = `${currentPoints} points for a correct answer`;
        }
    }
}

// Store and display wrong guesses
function recordWrongGuess(guess) {
    let wrongGuessesList = document.getElementById("wrong-guesses");
    if (wrongGuessesList) {
        let listItem = document.createElement("li");
        listItem.innerHTML = `❌ ${guess}`;

        // Insert the new item at the beginning of the list
        wrongGuessesList.insertBefore(listItem, wrongGuessesList.firstChild);
    }
}

function finishRound() {
    // Add round points to total score
    totalScore += currentPoints;
    document.getElementById("total-score").innerText = `Total Points: ${totalScore}`;

    if (round < totalRounds) {
        round++;
        startRound();
    } else {
        // Display finish message
        alert(`Game Over! You scored a total of ${totalScore} points.`);
    }
}


// Allow pressing "Enter" to submit
document.getElementById("street-input").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        checkAnswer();
    }
});

// Load the first street when the page loads
loadStreetList();
