// Initialize the map (centered on Oslo)
var map = L.map('map').setView([59.9139, 10.7522], 14);

// Use a basemap with no labels (Carto Light No Labels)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB, OpenStreetMap contributors'
}).addTo(map);

// Global variables for polyline and street name
var streetPolyline = null;

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

        fetchStreetGeometry(randomStreet); // Get full street path
    } catch (error) {
        console.error("❌ Error loading streets:", error);
    }
}

// Query Overpass API to get full street geometry (with multiple segments if necessary)
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

        let coordinates = extractCoordinates(data);
        if (coordinates.length) {
            displayStreet(streetName, coordinates);
        } else {
            console.error("❌ No valid coordinates found for", streetName);
        }
    } catch (error) {
        console.error("❌ Overpass API error:", error);
    }
}

// Extract coordinates from Overpass API response (handles multiple segments)
function extractCoordinates(data) {
    let nodes = {};
    let coordinates = [];

    // Store all nodes with their coordinates
    data.elements.forEach(element => {
        if (element.type === "node") {
            nodes[element.id] = [element.lat, element.lon];
        }
    });

    // Extract way (street path) using node references
    data.elements.forEach(element => {
        if (element.type === "way") {
            let wayCoords = element.nodes.map(nodeId => nodes[nodeId]).filter(coord => coord);
            if (wayCoords.length) {
                coordinates = coordinates.concat(wayCoords); // Concatenate multiple segments into one array
            }
        }
    });

    return coordinates;
}

// Display the full street as a polyline
function displayStreet(name, coordinates) {
    console.log(`📌 Displaying street: ${name}`);

    // Set the map view to fit the street's path
    let bounds = L.latLngBounds(coordinates);
    map.fitBounds(bounds);

    // Remove previous polyline if it exists
    if (streetPolyline) {
        map.removeLayer(streetPolyline);
    }

    // Draw the street polyline
    streetPolyline = L.polyline(coordinates, { color: "red", weight: 4 }).addTo(map);

    // Store the correct street name
    document.getElementById("street-name").innerText = name;
}

// Check the user's answer
function checkAnswer() {
    let userInput = document.getElementById("street-input").value;
    let correctStreet = document.getElementById("street-name").innerText;

    if (userInput.toLowerCase() === correctStreet.toLowerCase()) {
        document.getElementById("result").innerText = "✅ Correct!";
    } else {
        document.getElementById("result").innerText = "❌ Try again!";
    }
}

// Load a random street when the page loads
loadStreetList();
