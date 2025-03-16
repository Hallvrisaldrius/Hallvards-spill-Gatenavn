// Initialize the map without a default center
var map = L.map('map');

// Use a basemap with no labels (Carto Light No Labels)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB, OpenStreetMap contributors'
}).addTo(map);

// Global variables
var streetLayer = L.layerGroup().addTo(map);
var currentStreet = "";
var remainingPoints = 3;
var wrongGuesses = [];
var round = 1;  // Track the current round
var totalPoints = 0;  // Track the accumulated total score

// Load and select a random street for each round
async function loadStreetList() {
    try {
        let response = await fetch('streets.txt');
        let text = await response.text();
        let streets = text.split('\n').map(line => line.trim()).filter(line => line);

        if (streets.length === 0) {
            console.error("⚠️ Street list is empty!");
            return;
        }

        // Choose a random street for the current round
        let randomStreet = streets[Math.floor(Math.random() * streets.length)];
        console.log("✅ Selected street:", randomStreet);

        currentStreet = randomStreet;
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

    // Fit map to the full extent of the street
    let bounds = L.latLngBounds(allCoords);
    map.fitBounds(bounds.pad(0.2)); // Adds a 20% margin
}

// Check the user's answer
function checkAnswer() {
    let userInput = document.getElementById("street-input").value.trim();
    
    if (!userInput) return; // Ignore empty input

    if (userInput.toLowerCase() === currentStreet.toLowerCase()) {
        totalPoints += remainingPoints;  // Add points to the total
        document.getElementById("result").innerText = `✅ Correct! You earned ${remainingPoints} points!`;
        document.getElementById("points-text").style.display = "none";
    } else {
        wrongGuesses.push(userInput);
        displayWrongGuesses();
        
        remainingPoints = Math.max(0, remainingPoints - 1); // Decrease but never below 0
        updatePointsText();

        if (remainingPoints === 0) {
            document.getElementById("result").innerText = `❌ No more attempts. The correct answer was: ${currentStreet}`;
        }
    }

    document.getElementById("street-input").value = ""; // Clear input field

    // End round and proceed to next if necessary
    if (remainingPoints === 0 || userInput.toLowerCase() === currentStreet.toLowerCase()) {
        endRound();
    }
}

// Display wrong guesses
function displayWrongGuesses() {
    let wrongList = document.getElementById("wrong-guesses");
    wrongList.innerHTML = ""; // Clear previous list

    wrongGuesses.forEach(guess => {
        let li = document.createElement("li");
        li.innerHTML = `<span style="color: red;">❌ ${guess}</span>`;
        wrongList.appendChild(li);
    });
}

// Update points text
function updatePointsText() {
    let pointsText = document.getElementById("points-text");
    if (remainingPoints > 0) {
        pointsText.innerText = `${remainingPoints} points for a correct answer`;
    } else {
        pointsText.style.display = "none"; // Hide when no points left
    }
}

// End the round and prepare for the next round
function endRound() {
    // Display round result and total score so far
    document.getElementById("round-result").innerText = `Round ${round} complete! Total points: ${totalPoints}`;

    // Prepare for next round
    if (round < 3) {
        round++;
        remainingPoints = 3;  // Reset points for next round
        wrongGuesses = [];
        document.getElementById("wrong-guesses").innerHTML = "";
        document.getElementById("result").innerText = "";
        document.getElementById("points-text").innerText = "3 points for a correct answer";
        document.getElementById("points-text").style.display = "block";
        loadStreetList();
    } else {
        // After all rounds
        document.getElementById("round-result").innerText = `Game Over! Your final score: ${totalPoints}`;
        document.getElementById("street-input").disabled = true;  // Disable input after game ends
    }
}

// Reset and start a new game
function startGame() {
    round = 1;
    totalPoints = 0;
    remainingPoints = 3;
    wrongGuesses = [];
    document.getElementById("wrong-guesses").innerHTML = "";
    document.getElementById("result").innerText = "";
    document.getElementById("points-text").innerText = "3 points for a correct answer";
    document.getElementById("points-text").style.display = "block";

    loadStreetList();
}

// Allow pressing Enter to submit
document.getElementById("street-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        checkAnswer();
    }
});

// Start the first round when the page loads
startGame();
