// Initialize the map (centered on Oslo)
var map = L.map('map').setView([59.9139, 10.7522], 14);

// Use a basemap with no labels (Carto Light No Labels)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB, OpenStreetMap contributors'
}).addTo(map);

// Global variable for the street polyline
var streetPolyline = null;

// Function to load the street list and select a random street
async function loadStreetList() {
    try {
        let response = await fetch('streets.txt'); // Load the file
        let text = await response.text();
        let streets = text.split('\n').map(line => line.trim()).filter(line => line); // Clean up

        if (streets.length === 0) {
            console.error("⚠️ Street list is empty!");
            return;
        }

        // Choose a random street
        let randomStreet = streets[Math.floor(Math.random() * streets.length)];
        console.log("✅ Selected street:", randomStreet);

        geocodeStreet(randomStreet); // Get full street geometry
    } catch (error) {
        console.error("❌ Error loading streets:", error);
    }
}

// Function to fetch full street geometry using Nominatim
async function geocodeStreet(streetName) {
    let query = `${streetName}, Oslo, Norway`; // Ensure search is within Oslo
    let url = `https://nominatim.openstreetmap.org/search?format=json&polygon_geojson=1&q=${encodeURIComponent(query)}`;

    try {
        let response = await fetch(url);
        let data = await response.json();

        if (data.length === 0) {
            console.error("⚠️ Street not found:", streetName);
            return;
        }

        let geojson = data[0].geojson;

        if (geojson && geojson.type === "LineString") {
            let coordinates = geojson.coordinates.map(coord => [coord[1], coord[0]]); // Convert to [lat, lng]
            console.log(`📌 Found street geometry for ${streetName}`);

            displayStreet(streetName, coordinates);
        } else {
            console.error("❌ No valid street geometry found.");
        }
    } catch (error) {
        console.error("❌ Geocoding error:", error);
    }
}

// Function to display the selected street as a polyline
function displayStreet(name, coordinates) {
    console.log(`📌 Displaying street: ${name}`);

    // Fit the map view to the street’s bounding box
    let bounds = L.latLngBounds(coordinates);
    map.fitBounds(bounds);

    // Remove previous polyline if it exists
    if (streetPolyline) {
        map.removeLayer(streetPolyline);
    }

    // Draw the new polyline
    streetPolyline = L.polyline(coordinates, { color: 'red', weight: 5 }).addTo(map);

    // Store the correct street name
    document.getElementById("street-name").innerText = name;
}

// Function to check the user's guess
function checkAnswer() {
    let userInput = document.getElementById("street-input").value;
    let correctStreet = document.getElementById("street-name").innerText;

    if (userInput.toLowerCase() === correctStreet.toLowerCase()) {
        document.getElementById("result").innerText = "✅ Correct!";
    } else {
        document.getElementById("result").innerText = "❌ Try again!";
    }
}

// Load the street list when the page loads
loadStreetList();
