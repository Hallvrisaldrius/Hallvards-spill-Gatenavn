// Initialize the map without a default center
var map = L.map('map');

// Use a basemap with no labels (Carto Light No Labels)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB, OpenStreetMap contributors'
}).addTo(map);

// Function to display street coordinates on the map
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

// Expose map-related functions
export { map, displayStreet };
