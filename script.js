// Show the welcome screen when the page loads
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("welcome-screen").style.display = "flex";
});

// Initialize the map - with change
var map = L.map('map');
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png', {
    attribution: '&copy; CartoDB, OpenStreetMap contributors'
}).addTo(map);

// Global variables
var streetLayer = L.layerGroup().addTo(map);
var currentStreet = "";
var currentPoints = 3;
var totalScore = 0;
var round = 1;
const maxRounds = 3;
var streetsData = []; // all streets with districts
var allStreets = []; // all streets
let selectedDistricts = []; //the districts that the player chooses
var streets = []; // all streets within the chosen districts

// Load streets from text file
async function loadStreetList() {
    try {
        let districtSet = new Set();
        
        let streetList = await fetch('streets.csv');
        let streetListText = await streetList.text();
        let lines = streetListText.split('\n').map(line => line.trim()).filter(line => line);
        lines.forEach(line => {
            let [street, districtString] = line.split(',')
            if (!street || !districtString) return;
            let districtArray = districtString.split('/').map(d => d.trim());
            districtArray.forEach(d => districtSet.add(d));
            streetsData.push({ street, districts: districtArray });
        });
        allStreets = streetsData.map(streetObj => streetObj.street);
        
        allDistricts = Array.from(districtSet).sort(); // Convert Set to array and sort alphabetically
        populateDistrictFilter(allDistricts); // Function to create the checkmark buttons
        
    } catch (error) {
        document.getElementById('loading-spinner').style.display = 'none';
        console.error("❌ Error loading street list");
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
        container.appendChild(document.createElement("br"));  // New line for readability
    });
}

function updateSelectedDistricts() {
    selectedDistricts = Array.from(document.querySelectorAll(".district-checkbox:checked"))
                             .map(cb => cb.value);
    console.log("Selected Districts:", selectedDistricts);
}

function setStreetsForGame() {
    streets = streetsData
        .filter(streetObj => 
            streetObj.districts.some(district => selectedDistricts.includes(district))
        )
        .map(streetObj => streetObj.street);
    console.log("Number of streets in game:", streets.length);
}

function startButtonPressed() {  
    setStreetsForGame();
    startNewGame();
}

function startNewGame() {
    totalScore = 0
    round = 1

    document.getElementById("welcome-screen").style.display = "none";
    document.getElementById("game-over-screen").style.display = "none";
    document.getElementById("round-number").innerText = `Round ${round} of ${maxRounds}`;
    document.getElementById("total-score").innerText = `Total Score: ${totalScore}`;

    startRound(); 
}

// Start a new round
function startRound() {
    document.getElementById("round-number").innerText = `Round ${round} of ${maxRounds}`;
    document.getElementById("points-display").innerText = "3 points for a correct answer";
    document.getElementById("total-score").innerText = `Total Score: ${totalScore}`;

    document.getElementById("wrong-guesses").innerHTML = "";
    document.getElementById("street-input").value = "";

    currentStreet = streets[Math.floor(Math.random() * streets.length)];
    console.log("✅ Selected street:", currentStreet);
    
    currentPoints = 3;
    fetchStreetGeometry(currentStreet);
}

// Fetch street geometry from OpenStreetMap Overpass API
async function fetchStreetGeometry(streetName) {
    document.getElementById('loading-spinner').style.display = 'flex';
    let query = `
        [out:json];
        way["name"="${streetName}"]["highway"](59.7,10.4,60.1,10.9);
        (._;>;);
        out body;
    `;
    let url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        let response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }
        let data = await response.json();
        console.log("🗺 Overpass API response:", data);

        if (!data.elements.length) {
            console.error("⚠️ Street not found:", streetName);
            return;
        }

        let allCoordinates = extractAllCoordinates(data);
        if (allCoordinates.length) {
            displayStreet(allCoordinates);
        } else {
            console.error("❌ No valid coordinates found for", streetName);
        }
    } catch (error) {
        console.error("❌ Overpass API error:", error);
    } finally {
        document.getElementById('loading-spinner').style.display = 'none';
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

// Display the selected street on the map
function displayStreet(coordinateGroups) {
    streetLayer.clearLayers();
    
    let allCoords = coordinateGroups.flat();
    if (allCoords.length === 0) {
        console.error("⚠️ No valid coordinates for centering.");
        return;
    }

    coordinateGroups.forEach(coords => {
        L.polyline(coords, { color: "red", weight: 4 }).addTo(streetLayer);
    });

    let bounds = L.latLngBounds(allCoords);
    map.fitBounds(bounds.pad(0.2)); // Add margin
}

// Check the user's answer
function checkAnswer() {
    let userInput = document.getElementById("street-input").value.trim();

    if (userInput.toLowerCase() === currentStreet.toLowerCase()) {
        alert(`Korrekt! Dette er ${currentStreet}`);
        finishRound(); // End the round properly
    } else {
        recordWrongGuess(userInput);
        
        currentPoints--;
        if (currentPoints === 0) {
            alert(`Riktig svar er: ${currentStreet}`);
            finishRound();
        } else {
            document.getElementById("points-display").innerText = `${currentPoints} poeng for riktig svar`;
        }
    }
}

// Store and display wrong guesses
function recordWrongGuess(guess) {
    let wrongGuessesList = document.getElementById("wrong-guesses");
    let listItem = document.createElement("li");
    listItem.innerHTML = `❌ ${guess}`;

    // Insert the new item at the beginning of the list
    wrongGuessesList.insertBefore(listItem, wrongGuessesList.firstChild);
}

function finishRound() {
    document.getElementById("street-input").value = "";
    totalScore += currentPoints; 
    document.getElementById("total-score").innerText = `Poengsum: ${totalScore}`;
    if (round < maxRounds) {
        round++;
        startRound();
    } else {
        showGameOverScreen(totalScore)
    }
}

// Event listener for suggestions click
function setupSuggestionClicks() {
    document.getElementById("suggestions").addEventListener("click", function (event) {
        if (event.target && event.target.nodeName === "LI") {
            let selectedStreet = event.target.innerText.trim();
            document.getElementById("street-input").value = selectedStreet;
        }
    });
}

function showSuggestions() {
    let input = document.getElementById("street-input").value.trim().toLowerCase();
    let suggestionsList = document.getElementById("suggestions");
    suggestionsList.innerHTML = ""; // Clear previous suggestions

    if (input.length > 0) {
        let matchedStreets = allStreets.filter(street => street.toLowerCase().includes(input));
        
        // Shuffle the results and limit to 10 suggestions for variety
        matchedStreets = matchedStreets.sort(() => Math.random() - 0.5).slice(0, 10);
        
        matchedStreets.forEach(street => {
            let listItem = document.createElement("li");
            listItem.innerText = street;
            listItem.addEventListener("click", function() {
                document.getElementById("street-input").value = street;
                suggestionsList.style.display = "none";
            });
            suggestionsList.appendChild(listItem);
        });

        suggestionsList.style.display = matchedStreets.length > 0 ? "block" : "none";
    } else {
        suggestionsList.style.display = "none";
    }
}

// Call the function to setup click handlers after page load
setupSuggestionClicks();

// Event listener for input field to show suggestions
document.getElementById("street-input").addEventListener("input", showSuggestions);

// Event listener for "Enter" key to submit the answer
document.getElementById("street-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        checkAnswer();
    }
});

// Allow pressing "Enter" to submit
document.getElementById("street-input").addEventListener("blur", function() {
    setTimeout(function() {
        document.getElementById("suggestions").style.display = "none";
    }, 200); // Delay to allow clicks on suggestions
});

function showGameOverScreen(score) {
    document.getElementById("game-over-text").innerText = `Spillet er over, du fikk ${score} poeng`;
    document.getElementById("game-over-screen").style.display = "flex";
}

// Load the street lists when the page loads
loadStreetList();
