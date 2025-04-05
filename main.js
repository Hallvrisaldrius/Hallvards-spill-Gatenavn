import { loadStreetList, updateStreetStats } from './backendAPI.js';
import { fetchStreetGeometry } from './streetLogic.js';

// Show the welcome screen when the page loads
document.addEventListener("DOMContentLoaded", function() {
    createAreaButtons();
    document.getElementById("welcome-screen").style.display = "flex";
});

// Initialize the map
var map = L.map('map');
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png', {
    attribution: '&copy; CartoDB, OpenStreetMap contributors'
}).addTo(map);

// Global variables
var streetLayer = L.layerGroup().addTo(map);

var availableAreas = {
    "Ibestad": {coordinates: '(68.7,16.8,69.0,17.5)'},
    "Oslo": {coordinates: '(59.7,10.4,60.1,10.9)'}, 
    "Trondheim": {coordinates: '(63.1,10.0,63.5,10.7)'}
};

var currentAreaCoordinates;

var currentStreetIndex = 0;
var currentStreet;

var currentPoints = 3;
var streetGuessAttempt = 0
var totalScore = 0;
var round = 1;
var streetsData = []; // all streets with districts
var selectedDistricts = []; //the districts that the player chooses
var filteredStreetData = []; // all streets within the chosen districts

const ROUNDS_PER_GAME = 3;
const MAX_STREET_FETCHING_ATTEMPTS = 5;
const SHEET_ID = "1RwK7sTXTL6VhxbXc7aPSMsXL_KTGImt-aisTLqlpWnQ";

function createAreaButtons() {
    let areaContainer = document.getElementById("areaButtons");
    areaContainer.style.display = "flex";
    areaContainer.style.flexDirection = "column";
    areaContainer.style.gap = "10px"; // Add spacing between buttons
    
    Object.keys(availableAreas).forEach(area => {
        let button = document.createElement("button");
        button.textContent = area;
        button.className = "area-button";
        button.style.backgroundColor = "blue";
        button.style.color = "white";
        button.style.padding = "10px";
        button.style.border = "none";
        button.style.borderRadius = "5px";
        button.onclick = () => chooseArea(area);
        areaContainer.appendChild(button);
    });
}

async function chooseArea(area) {
    document.getElementById('loading-spinner').style.display = 'flex';
    console.log("Selected area:", area);
    currentAreaCoordinates = availableAreas[area].coordinates;
    streetsData = await loadStreetList(SHEET_ID, area, API_KEY);
    document.getElementById("areaButtons").style.display = "none";
    populateDistrictFilter();
    document.getElementById('startButton').style.display = 'block';
    document.getElementById('loading-spinner').style.display = 'none';
}

function setStreetsForGame() {
    filteredStreetData = streetsData
        .filter(streetObj => 
            streetObj.districts.some(district => selectedDistricts.includes(district))
        )
    console.log("Number of streets in game:", filteredStreetData.length);
}

document.getElementById('startButton').addEventListener('click', () => {
    if (selectedDistricts.length === 0) {
        alert("Du må velge minst én bydel");
        return;
    }
    setStreetsForGame();
    startNewGame();
});

document.getElementById('game-over-button').addEventListener('click', () => {
    startNewGame();
});

function startNewGame() {
    totalScore = 0
    round = 1

    document.getElementById("welcome-screen").style.display = "none";
    document.getElementById("game-over-screen").style.display = "none";

    startRound(); 
}

// Start a new round
function startRound() {
    fetchRandomStreet();

    currentPoints = 3;
    streetGuessAttempt = 0;
    
    document.getElementById("round-number").innerText = `Runde ${round} av ${ROUNDS_PER_GAME}`;
    document.getElementById("points-display").innerText = "3 poeng for riktig svar";
    document.getElementById("total-score").innerText = `Poengsum: ${totalScore}`;

    document.getElementById("wrong-guesses").innerHTML = "";
    document.getElementById("street-input").value = "";
    document.getElementById("hint").innerText = "Hint: " + "_".repeat(currentStreet.streetName.length);
}

// Fetch street geometry from OpenStreetMap Overpass API
async function fetchRandomStreet(fetchingAttempt = 1) {    
    document.getElementById('loading-spinner').style.display = 'flex';
    
    currentStreetIndex = Math.floor(Math.random() * filteredStreetData.length);
    
    currentStreet = filteredStreetData[currentStreetIndex];
    console.log("✅ Selected street:", currentStreet);


    try {
        let coordinateGroups = await fetchStreetGeometry(currentStreet.streetName, currentAreaCoordinates);
        streetLayer.clearLayers();
        coordinateGroups.forEach(coords => {
            L.polyline(coords, { color: "red", weight: 4 }).addTo(streetLayer);
        });

        let bounds = L.latLngBounds(coordinateGroups);
        map.fitBounds(bounds.pad(0.2)); // Add margin
        
    } catch (error) {
        if (fetchingAttempt >= MAX_STREET_FETCHING_ATTEMPTS) {
            alert("❌ Feil med å hente gate", error);
        } else {
            console.log("❌ Feil med å hente gate", error);
            fetchRandomStreet(++fetchingAttempt)
        }
    } finally {
        document.getElementById('loading-spinner').style.display = 'none';
    }
}

document.getElementById("check-answer").addEventListener('click', () => {
    checkAnswer();
});


// Check the user's answer
function checkAnswer() {
    let inputBox = document.getElementById("street-input");
    let userInput = inputBox.value.trim();
    inputBox.value = "";

    if (userInput.toLowerCase() === currentStreet.streetName.toLowerCase()) {
        alert(`Korrekt! Dette er ${currentStreet.streetName}`);
        finishRound();
    } else {
        recordWrongGuess(userInput);

        streetGuessAttempt++;
        currentPoints--;

        document.getElementById("hint").innerText = "Hint: " + currentStreet.streetName.slice(0, streetGuessAttempt) + "_".repeat(currentStreet.streetName.length - 2 * streetGuessAttempt) + currentStreet.streetName.slice(-streetGuessAttempt);

        if (currentPoints === 0) {
            alert(`Riktig svar er: ${currentStreet.streetName}`);
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

    wrongGuessesList.insertBefore(listItem, wrongGuessesList.firstChild);
}

function finishRound() {
    document.getElementById("street-input").value = "";
    totalScore += currentPoints; 
    document.getElementById("total-score").innerText = `Poengsum: ${totalScore}`;
    updateStreetStats()
    if (round < ROUNDS_PER_GAME) {
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
            let inputBox = document.getElementById("street-input")
            inputBox.value = selectedStreet;
            inputBox.focus();
        }
    });
}

document.getElementById('street-input').addEventListener('input', () => {
    let input = document.getElementById("street-input").value.trim().toLowerCase();
    let suggestionsList = document.getElementById("suggestions");
    suggestionsList.innerHTML = ""; // Clear previous suggestions

    if (input.length > 0) {
        let matchedStreets = streetsData.reduce((result, streetObj) => {
            if (streetObj.streetName.toLowerCase().includes(input)) {
              result.push(streetObj.streetName);
            }
            return result;
          }, []);
        
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
});

// Call the function to setup click handlers after page load
setupSuggestionClicks();

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

function populateDistrictFilter() {
    let container = document.getElementById("districtFilter");

    let districtList = [...new Set(streetsData.flatMap(street => street.districts))].sort();

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

function updateSelectedDistricts() {
    selectedDistricts = Array.from(document.querySelectorAll(".district-checkbox:checked"))
                             .map(cb => cb.value);
    console.log("Selected Districts:", selectedDistricts);
}