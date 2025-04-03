export async function fetchStreetGeometry(streetName, coordinates) {
    let query = `
        [out:json];
        way["name"="${streetName}"]["highway"]${coordinates};
        (._;>;);
        out body;
    `;
    let url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    let response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }
    let data = await response.json();
    console.log("🗺 Overpass API response:", data);

    if (!data.elements.length) {
        throw new Error("⚠️ Street not found:", streetName);
    }

    let allCoordinates = extractAllCoordinates(data);
    if (allCoordinates.length) {
        return allCoordinates;
    } else {
        throw new Error("❌ No valid coordinates found for", streetName);
    }
}

// Extract all coordinates for a street
function extractAllCoordinates(data) {
    let nodes = {};
    let allCoordinates = [];

    data.elements.forEach(element => {
        if (element.type === "node") {
            nodes[element.id] = [element.lat, element.lon];
        }
    });

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
