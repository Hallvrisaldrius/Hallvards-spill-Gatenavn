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
            let street = row[0];
            let districtString = row[1];
            let numberOfGames = parseInt(row[2]) || 0;
            let totalPointsForStreet = parseInt(row[3]) || 0;

            if (!street || !districtString) return;

            let districtArray = districtString.split('/').map(d => d.trim());
            districtArray.forEach(d => districtSet.add(d));
            streetsData.push({ street, districts: districtArray, numberOfGames, totalPointsForStreet });
        });

        console.log("✅ Streets Data:", streetsData);

        allDistricts = Array.from(districtSet).sort();
        populateDistrictFilter(allDistricts);

        return streetsData;
    } catch (error) {
        console.error("❌ Failed to fetch street data:", error);
    }
}

function populateDistrictFilter(districtList) {
    let container = document.getElementById("districtFilter");

    districtList.forEach(district => {
        let label = document.createElement("label");
        let checkbox = document.createElement("input");
        
        checkbox.type = "checkbox";
        checkbox.value = district;
        checkbox.className = "district-checkbox";
        checkbox.addEventListener("change", updateSelectedDistricts);
        
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(" " + district));
        container.appendChild(label);
        container.appendChild(document.createElement("br"));
    });
}