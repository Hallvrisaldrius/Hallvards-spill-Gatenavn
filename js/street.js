// street.js
import { initializeMap, streetLayer, displayStreet } from './map.js';

// Initialize the map first
initializeMap();

// Fetch the street geometry
export async function fetchStreetGeometry(streetName) {
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
            displayStreet(streetName, allCoordinates); // Call displayStreet once the map is initialized
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
