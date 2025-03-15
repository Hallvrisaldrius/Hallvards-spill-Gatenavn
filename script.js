// Initialize the map without a fixed center
var map = L.map('map');

// Use a basemap with no labels (Carto Light No Labels)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB, OpenStreetMap contributors'
}).addTo(map);

// Global variables
var streetLayer = L.layerGroup().addTo(map);
let incorrectGuesses = new Set();
let attempts = 0;
let score = 0;

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

        // Reset game state
        incorrectGuesses.clear();
        attempts = 0;
        document.getElementById("wrong-guesses").innerHTML = "";
        document.getElementById("result").innerText = "";
        document.getElementById("street-name").style.display = "none"; // Hide correct answer initially

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

    // Store correct street name
    document.getElementById("street-name").innerText = name;
}

// Check the user's answer
function checkAnswer() {
    let userInput = document.getElementById("street-input").value.trim();
    let correctStreet = document.getElementById("street-name").innerText.trim();
    let resultDiv = document.getElementById("result");
    let wrongList = document.getElementById("wrong-guesses");

    resultDiv.innerText = ""; // Clear previous messages

    if (userInput.toLowerCase() === correctStreet.toLowerCase()) {
        let pointsEarned = attempts === 0 ? 3 : attempts === 1 ? 2 : attempts === 2 ? 1 : 0;
        score += pointsEarned;
        resultDiv.innerText = `✅ Correct! You earned ${pointsEarned} points!`;
        resultDiv.style.color = "green";
        updateScoreDisplay();
        
        // Load a new street after a short delay
        setTimeout(loadStreetList, 2000);
    } else {
        if (userInput !== "" && !incorrectGuesses.has(userInput.toLowerCase())) {
            incorrectGuesses.add(userInput.toLowerCase());

            let listItem = document.createElement("li");
            listItem.innerHTML = `❌ ${userInput}`;
            listItem.style.color = "red";
            listItem.style.margin = "5px 0";
            wrongList.appendChild(listItem);
        }

        attempts++;

        // If 3 wrong attempts, reveal the correct answer BELOW the list
        if (attempts >= 3) {
            let correctAnswerItem = document.createElement("li");
            correctAnswerItem.innerHTML = `✅ The correct answer was: <strong>${correctStreet}</strong>`;
            correctAnswerItem.style.color = "blue";
            correctAnswerItem.style.marginTop = "10px";
            wrongList.appendChild(correctAnswerItem);

            resultDiv.innerText = ""; // No extra text above
            updateScoreDisplay();
            
            // Load a new street after a short delay
            setTimeout(loadStreetList, 3000);
        }
    }

    // Clear input field
    document.getElementById("street-input").value = "";
}

// Listen for "Enter" key press in input field
document.getElementById("street-input").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        checkAnswer();
    }
});

// Update the score display
function updateScoreDisplay() {
    document.getElementById("score").innerText = `Score: ${score}`;
}

// Load a random street when the page loads
loadStreetList();
