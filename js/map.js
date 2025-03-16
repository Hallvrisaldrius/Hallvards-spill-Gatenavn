// map.js

// Global variable for the map and streetLayer
export let map;
export let streetLayer;

// Function to initialize the map
export function initializeMap() {
    // Initialize the map (centered on Oslo)
    map = L.map('map').setView([59.9139, 10.7522], 14);

    // Use a basemap with no labels (Carto Light No Labels)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB, OpenStreetMap contributors'
    }).addTo(map);

    // Initialize the streetLayer as a layer group on the map
    streetLayer = L.layerGroup().addTo(map);
}

// Function to display the street on the map
export function displayStreet(name, coordinateGroups) {
    console.log(`📌 Displaying all segments of: ${name}`);

    // Clear previous street polylines
    streetLayer.clearLayers();

    // Add each segment as a polyline
    coordinateGroups.forEach(coords => {
        L.polyline(coords, { color: "red", weight: 4 }).addTo(streetLayer);
    });

    // Calculate center of the street
    let allCoords = coordinateGroups.flat(); // Flatten the array of coordinates
    let centerLat = allCoords.reduce((sum, coord) => sum + coord[0], 0) / allCoords.length;
    let centerLng = allCoords.reduce((sum, coord) => sum + coord[1], 0) / allCoords.length;
    let streetCenter = [centerLat, centerLng];

    // Center the map on the street with a margin for a better view
    map.setView(streetCenter, 15); // Adjust zoom as needed for a better margin around the street
}
