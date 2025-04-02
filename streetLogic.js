// Load streets from Google Sheets
export async function loadStreetList(SHEET_ID, area, API_KEY) {
    
    let RANGE = `${area}!A:B`;
    try {
        let districtSet = new Set();
        let streetsData = []
        
        let url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
        let response = await fetch(url);
        let data = await response.json();

              // Check for errors
        if (data.error) {
            console.error("❌ Error fetching data:", data.error);
            return;
        }

        let rows = data.values;
        
        // Skip header row if present
        if (rows[0][0].toLowerCase() === "gate") {
            rows.shift();
        }

        // Parse data
        rows.forEach(row => {
            let streetName = row[0];
            let districtString = row[1];
            let numberOfGames = parseInt(row[2]) || 0;
            let totalPointsForStreet = parseInt(row[3]) || 0;

            if (!streetName || !districtString) return;

            let districtArray = districtString.split('/').map(d => d.trim());
            streetsData.push({ streetName, districts: districtArray, numberOfGames, totalPointsForStreet });
        });

        return streetsData;
    } catch (error) {
        console.error("❌ Failed to fetch street data:", error);
    }
}

export async function fetchStreetGeometry(streetName, areaCoordinates) {
    let query = `
        [out:json];
        way["name"="${streetName}"]["highway"]${areaCoordinates};
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
