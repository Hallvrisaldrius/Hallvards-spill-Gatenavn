// Initialize the map (centered on Oslo)
var map = L.map('map').setView([59.9139, 10.7522], 14);

// Use a basemap with no labels (Carto Light No Labels)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB, OpenStreetMap contributors'
}).addTo(map);

// Global variables
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

        fetchStreetGeometry(randomStreet); // Fetch polyline data
    } catch (error) {
        console.error("❌ Error loading streets:", error);
    }
}

// Function to fetch the full street geometry from Overpass API
async function fetchStreetGeometry(streetName) {
    let query = `
        [out:json];
        way["name"="${streetName}"](59.8,10.4,60.1,10.9);
        out geom;
    `;

    let url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        let response = await fetch(url);
        let data = await response.json();
        console.log("🌍 Overpass API response:", data);

        if (data.elements.length === 0) {
            console.error("⚠️ No geometry found for:", streetName);
            return;
        }

        let coordinates = [];
        data.elements.forEach(way => {
            if (way.type === "way" && way.geometry) {
                way.geometry.forEach(point => {
                    coordinates.push([point.lat, point.lon]);
                });
            }
        });

        if (coordinates.length > 0) {
            displayStreetPolyline(streetName, coordinates);
        } else {
            console.error("❌ No valid coordinates for:", streetName);
        }
    } catch (error) {
        console.error("❌ Error fetching street geometry:", error);
    }
}

// Function to display the polyline on the map
function displayStreetPolyline(name, coordinates) {
    console.log(`📌 Displaying street polyline: ${name}`);

    // Remove previous polyline if it exists
    if (streetPolyline) {
        map.removeLayer(streetPolyline);
    }

    // Draw the polyline on the map
    streetPolyline = L.polyline(coordinates, {
        color: "red",
        weight: 5,
        opacity: 0.8
    }).addTo(map);

    // Fit the map to the polyline
    map.fitBounds(streetPolyline.getBounds());

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
