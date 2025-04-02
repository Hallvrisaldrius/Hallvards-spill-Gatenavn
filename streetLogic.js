// Load streets from Google Sheets
export async function loadStreetList(SHEET_ID, RANGE, API_KEY) {
    try {
        let districtSet = new Set();
        let streetsData = []
        
        let url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
        console.log(url);
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

        console.log("✅ Streets Data:", streetsData);


        return streetsData;
    } catch (error) {
        console.error("❌ Failed to fetch street data:", error);
    }
}
