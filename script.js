document.addEventListener("DOMContentLoaded", function () {
    // Initialize the map and other functions here after the DOM is loaded

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
    // Check if the answer is correct and update points
    let userInput = document.getElementById("street-input").value;
    let correctStreet = document.getElementById("street-name").innerText;

    if (userInput.toLowerCase() === correctStreet.toLowerCase()) {
        updatePointsText(3); // Update the points if the answer is correct
    } else {
        updatePointsText(currentPoints - 1); // Deduct one point for wrong answer
    }
}


    // Update the points text
    function updatePointsText() {
        let points = getRemainingPoints();
        let submitButton = document.getElementById("submit-btn");
        submitButton.innerText = `Submit - ${points} points`;
    }

    // Get remaining points based on attempts
    function getRemainingPoints() {
        return Math.max(0, 4 - attempts); // If attempts exceed 3, return 0 points
    }

    let attempts = 0;

    // Start a new round of the game
    function startRound() {
        attempts = 0;
        document.getElementById("result").innerText = '';
        loadStreetList();
    }

    // Add wrong guesses to the list
    function addWrongGuess(guess) {
        let wrongGuessesList = document.getElementById("wrong-guesses");
        let listItem = document.createElement("li");
        listItem.innerHTML = `${guess} <span style="color:red;">❌</span>`;
        wrongGuessesList.appendChild(listItem);
    }

    // Start a new round on page load
    startRound();
});
