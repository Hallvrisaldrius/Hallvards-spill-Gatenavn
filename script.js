// Initialize the map (centered on Oslo)
var map = L.map('map').setView([59.9139, 10.7522], 14);

// Add Esri Light Gray Base (light background)
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; Esri, HERE, Garmin, FAO, NOAA, USGS, OpenStreetMap contributors'
}).addTo(map);

// Add Esri Light Gray Overlay (optional, adds a few details but NO labels)
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Overlay/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; Esri, HERE, Garmin, FAO, NOAA, USGS, OpenStreetMap contributors'
}).addTo(map);

// Global marker variable
var streetMarker = null;

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

        geocodeStreet(randomStreet); // Get coordinates for the street
    } catch (error) {
        console.error("❌ Error loading streets:", error);
    }
}

// Function to fetch coordinates for a street using OpenStreetMap Nominatim API
async function geocodeStreet(streetName) {
    let query = `${streetName}, Oslo, Norway`; // Ensure search is within Oslo
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

    try {
        let response = await fetch(url);
        let data = await response.json();
        console.log("🌍 Nominatim API response:", data);

        if (data.length === 0) {
            console.error("⚠️ Street not found:", streetName);
            return;
        }

        let lat = parseFloat(data[0].lat);
        let lng = parseFloat(data[0].lon);

        console.log(`📍 Found coordinates for ${streetName}: ${lat}, ${lng}`);

        if (!isNaN(lat) && !isNaN(lng)) {
            displayStreet(streetName, lat, lng);
        } else {
            console.error("❌ Invalid coordinates:", lat, lng);
        }
    } catch (error) {
        console.error("❌ Geocoding error:", error);
    }
}

// Function to display the selected street on the map
function displayStreet(name, lat, lng) {
    console.log(`📌 Displaying street: ${name} at ${lat}, ${lng}`);

    // Set map view to the chosen street's location
    map.setView([lat, lng], 16);

    // Remove previous marker if it exists
    if (streetMarker) {
        map.removeLayer(streetMarker);
    }

    // Add a new marker at the chosen street's location
    streetMarker = L.marker([lat, lng]).addTo(map)
        .bindPopup(`Guess this street!`).openPopup();

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
