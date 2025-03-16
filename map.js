// map.js
let map = L.map('map');

// Initialize the map with the default view
function initializeMap() {
    map.setView([59.9139, 10.7522], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB, OpenStreetMap contributors'
    }).addTo(map);
}

// Function to display street segments
function displayStreet(coordinateGroups) {
    let streetLayer = L.layerGroup().addTo(map);
    streetLayer.clearLayers();

    let allCoords = coordinateGroups.flat();
    if (allCoords.length === 0) {
        console.error("⚠️ No valid coordinates for centering.");
        return;
    }

    coordinateGroups.forEach(coords => {
        L.polyline(coords, { color: "red", weight: 4 }).addTo(streetLayer);
    });

    // Fit map to street segments with a 20% margin
    let bounds = L.latLngBounds(allCoords);
    map.fitBounds(bounds.pad(0.2)); // Adds a 20% margin
}

export { initializeMap, displayStreet };
