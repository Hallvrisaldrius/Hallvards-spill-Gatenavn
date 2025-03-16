// map.js

// Initialize the map (centered on Oslo)
var map = L.map('map').setView([59.9139, 10.7522], 14);

// Use a basemap with no labels (Carto Light No Labels)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB, OpenStreetMap contributors'
}).addTo(map);

// Global variable for street polylines
export var streetLayer = L.layerGroup().addTo(map);  // Exporting the streetLayer

// Function to display all street segments as multiple polylines
export function displayStreet(name, coordinateGroups) {
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

    // Calculate the center of the street
    let centerLat = allCoords.reduce((sum, coord) => sum + coord[0], 0) / allCoords.length;
    let centerLng = allCoords.reduce((sum, coord) => sum + coord[1], 0) / allCoords.length;
    let streetCenter = [centerLat, centerLng];

    // Center the map on the street
    map.setView(streetCenter, 16); // Zoom level 16 keeps it visible
}

// Other map-related functions (if needed)...
