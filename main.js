import { loadStreetList, fetchStreetGeometry } from './streetLogic.js';

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

var currentStreetIndex = 0;
var currentStreetName = "";

var currentPoints = 3;
var streetGuessAttempt = 0
var totalScore = 0;
var round = 1;
const maxRounds = 3;
var streetsData = []; // all streets with districts
let selectedDistricts = []; //the districts that the player chooses
var filteredStreetData = []; // all streets within the chosen districts

const MAX_STREET_FETCHING_ATTEMPTS = 5;
const SHEET_ID = "1RwK7sTXTL6VhxbXc7aPSMsXL_KTGImt-aisTLqlpWnQ";
const API_KEY = "AIzaSyAOITVqx5tX6e2LfaH3wGyOUdJfP95BcWY";
const RANGE = "Oslo!A:B";

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
    
    document.getElementById("round-number").innerText = `Runde ${round} av ${maxRounds}`;
    document.getElementById("points-display").innerText = "3 poeng for riktig svar";
    document.getElementById("total-score").innerText = `Poengsum: ${totalScore}`;

    document.getElementById("wrong-guesses").innerHTML = "";
    document.getElementById("street-input").value = "";
    document.getElementById("hint").innerText = "Hint: " + "_".repeat(currentStreetName.length);
}

// Fetch street geometry from OpenStreetMap Overpass API
async function fetchRandomStreet(fetchingAttempt = 1) {    
    document.getElementById('loading-spinner').style.display = 'flex';
    
    currentStreetIndex = Math.floor(Math.random() * filteredStreetData.length);
    
    let currentStreetObject = filteredStreetData[currentStreetIndex];
    currentStreetName = currentStreetObject.streetName;
    console.log("✅ Selected street:", currentStreetObject);


    try {
        let coordinateGroups = await fetchStreetGeometry(currentStreetName);
        streetLayer.clearLayers();
        coordinateGroups.forEach(coords => {
            L.polyline(coords, { color: "red", weight: 4 }).addTo(streetLayer);
        });

        let bounds = L.latLngBounds(allCoords);
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

    if (userInput.toLowerCase() === currentStreetName.toLowerCase()) {
        alert(`Korrekt! Dette er ${currentStreetName}`);
        finishRound();
    } else {
        recordWrongGuess(userInput);

        streetGuessAttempt++;
        currentPoints--;

        document.getElementById("hint").innerText = "Hint: " + currentStreetName.slice(0, streetGuessAttempt) + "_".repeat(currentStreetName.length - 2 * streetGuessAttempt) + currentStreetName.slice(-streetGuessAttempt);

        if (currentPoints === 0) {
            alert(`Riktig svar er: ${currentStreetName}`);
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
            if (streetObj.street.toLowerCase().includes(input)) {
              result.push(streetObj.street);
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


// Load the street lists when the page loads
streetsData = await loadStreetList(SHEET_ID, RANGE, API_KEY);
populateDistrictFilter();