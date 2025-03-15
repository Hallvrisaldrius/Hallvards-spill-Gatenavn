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
let points = 3; // Start with 3 points
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

// Update the points message based on attempts
function updatePointsText() {
    let pointsText = document.getElementById("points-text");
    if (points === 3) {
        pointsText.innerText = "3 points for correct answer";
    } else if (points === 2) {
        pointsText.innerText = "2 points for correct answer";
    } else if (points === 1) {
        pointsText.innerText = "1 point for correct answer";
    } else {
        pointsText.innerText = ""; // Clear the points message after 3 attempts
    }
}

// Check the user's answer
function checkAnswer() {
    let userInput = document.getElementById("street-input").value.trim();
    let resultDiv = document.getElementById("result");
    let wrongList = document.getElementById("wrong-guesses");

    resultDiv.innerText = ""; // Clear previous messages

    if (userInput.toLowerCase() === correctStreet.toLowerCase()) {
        // Award points based on attempt number
        if (attempts === 1) {
            points = 3;
        } else if (attempts === 2) {
            points = 2;
        } else if (attempts === 3) {
            points = 1;
        }

        resultDiv.innerText = `✅ Correct! You scored ${points} points.`;
        resultDiv.style.color = "green";
    } else {
        // Deduct 1 point for each wrong guess
        if (points > 0) {
            points--;
        }

        // Add incorrect guess if it's not already listed
        if (userInput !== "" && !incorrectGuesses.has(userInput.toLowerCase())) {
            incorrectGuesses.add(userInput.toLowerCase());

            let listItem = document.createElement("li");
            listItem.innerHTML = `❌ ${userInput}`;
            listItem.style.color = "red";
            listItem.style.margin = "5px 0";
            wrongList.appendChild(listItem);
        }
    }

    // Clear input field and update attempts
    document.getElementById("street-input").value = "";
    attempts++;

    // Update the points text message after each attempt
    updatePointsText();

    // After 3 attempts, display the correct answer if not already guessed
    if (attempts >= 4) {
        resultDiv.innerText = `❌ The correct street was: ${correctStreet}`;
        resultDiv.style.color = "red";
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
