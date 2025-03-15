// Initialize the map (centered on Oslo)
var map = L.map('map').setView([59.9139, 10.7522], 14);

// Use a basemap with no labels (Carto Light No Labels)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB, OpenStreetMap contributors'
}).addTo(map);

// Global variables for street polylines and rounds
var streetLayer = L.layerGroup().addTo(map);
var rounds = 3;  // Number of rounds
var currentRound = 0;
var streets = [];
var points = 0;

// Load and select a random street for each round
async function loadStreetList() {
    try {
        let response = await fetch('streets.txt');
        let text = await response.text();
        streets = text.split('\n').map(line => line.trim()).filter(line => line);

        if (streets.length === 0) {
            console.error("⚠️ Street list is empty!");
            return;
        }

        // Shuffle and select N streets for the rounds (no repetition)
        streets = shuffleArray(streets);
        startRound();  // Start the first round
    } catch (error) {
        console.error("❌ Error loading streets:", error);
    }
}

// Shuffle function for randomizing the streets list
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap elements
    }
    return arr;
}

// Start a new round
function startRound() {
    if (currentRound >= rounds) {
        // End the game after the specified number of rounds
        alert(`Game over! You scored ${points} points.`);
        return;
    }

    currentRound++;
    let randomStreet = streets[currentRound - 1];  // Get the next street
    console.log("✅ Round", currentRound, "Selected street:", randomStreet);

    fetchStreetGeometry(randomStreet); // Get all segments for the street
    document.getElementById("round-number").innerText = `Round: ${currentRound} / ${rounds}`;
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
    document.getElementById("street-name").style.display = "block";  // Show the street name for guessing
}

// Check the user's answer
function checkAnswer() {
    let userInput = document.getElementById("street-input").value;
    let correctStreet = document.getElementById("street-name").innerText;
    let score = 0;

    if (userInput.toLowerCase() === correctStreet.toLowerCase()) {
        score = 3 - document.getElementById("wrong-guesses").childElementCount;  // Points based on the number of attempts
        points += score;

        document.getElementById("result").innerText = `✅ Correct! You scored ${score} points.`;
        document.getElementById("wrong-guesses").innerHTML = ''; // Clear wrong guesses
        setTimeout(startRound, 1000);  // Start next round after 1 second
    } else {
        document.getElementById("result").innerText = `❌ Incorrect! Try again.`;
        addWrongGuess(userInput);  // Show wrong guess
    }
}

// Add a wrong guess to the list
function addWrongGuess(guess) {
    let wrongGuessesList = document.getElementById("wrong-guesses");
    let wrongGuessItem = document.createElement("li");
    wrongGuessItem.innerText = guess + " ❌";
    wrongGuessesList.appendChild(wrongGuessItem);
}

// Event listener to submit the guess when Enter key is pressed
document.getElementById("street-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        checkAnswer();
    }
});

// Load the street list when the page loads
loadStreetList();
