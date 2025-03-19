// Initialize the map - with change
var map = L.map('map');
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png', {
    attribution: '&copy; CartoDB, OpenStreetMap contributors'
}).addTo(map);


// Global variables
var streetLayer = L.layerGroup().addTo(map);
var streets = [];
var currentStreet = "";
var currentPoints = 3;
var totalScore = 0;
var round = 1;
const maxRounds = 3;

// Load streets from text file
async function loadStreetList() {
    try {
        let responseGame = await fetch('streets.txt');
        let textGame = await responseGame.text();
        streets = textGame.split('\n').map(line => line.trim()).filter(line => line);

        let responseAll = await fetch('streets_all.txt');
        let textAll = await responseAll.text();
        allStreets = textAll.split('\n').map(line => line.trim()).filter(line => line);

        if (streets.length === 0) {
            console.error("⚠️ Street list is empty!");
            return;
        }
        
        startRound();
    } catch (error) {
        hideLoadingSpinner(); // Hide the spinner in case of an error
        console.error("❌ Error loading streets:", error);
    }
}

// Start a new round
function startRound() {
    let roundNumberElement = document.getElementById("round-number");
    let pointsDisplayElement = document.getElementById("points-display");
    let totalScoreElement = document.getElementById("total-score");

    if (roundNumberElement) roundNumberElement.innerText = `Round ${round} of ${maxRounds}`;
    if (pointsDisplayElement) pointsDisplayElement.innerText = "3 points for a correct answer";
    if (totalScoreElement) totalScoreElement.innerText = `Total Score: ${totalScore}`;

    document.getElementById("wrong-guesses").innerHTML = "";
    document.getElementById("street-input").value = "";

    currentStreet = streets[Math.floor(Math.random() * streets.length)];
    console.log("✅ Selected street:", currentStreet);
    
    currentPoints = 3;
    fetchStreetGeometry(currentStreet);
}

// Show loading spinner
function showLoadingSpinner() {
    document.getElementById('loading-spinner').style.display = 'flex';
}

// Hide loading spinner
function hideLoadingSpinner() {
    document.getElementById('loading-spinner').style.display = 'none';
}

// Fetch street geometry from OpenStreetMap Overpass API
async function fetchStreetGeometry(streetName) {
    showLoadingSpinner(); // Show the spinner
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
        hideLoadingSpinner(); // Hide the spinner if something goes wrong
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
        alert(`You are correct! This is ${currentStreet}`);
        finishRound(); // End the round properly
    } else {
        recordWrongGuess(userInput);
        
        currentPoints--;
        let pointsDisplayElement = document.getElementById("points-display");
        if (currentPoints === 0) {
            alert(`The correct answer was: ${currentStreet}`);
            finishRound();
        } else if (pointsDisplayElement) {
            pointsDisplayElement.innerText = `${currentPoints} points for a correct answer`;
        }
    }
}

// Store and display wrong guesses
function recordWrongGuess(guess) {
    let wrongGuessesList = document.getElementById("wrong-guesses");
    if (wrongGuessesList) {
        let listItem = document.createElement("li");
        listItem.innerHTML = `❌ ${guess}`;

        // Insert the new item at the beginning of the list
        wrongGuessesList.insertBefore(listItem, wrongGuessesList.firstChild);
    }
}

function finishRound() {
    document.getElementById("street-input").value = "";
    totalScore += currentPoints; // Add round points to total
    document.getElementById("total-score").innerText = `Total Score: ${totalScore}`;
    if (round < maxRounds) {
        round++;
        startRound();
    } else {
        showGameOverScreen(totalScore)
    }
}

let currentHighlightedIndex = -1; // To track the highlighted suggestion

// Event listener for suggestions click
function setupSuggestionClicks() {
    let suggestionsList = document.getElementById("suggestions");
    if (suggestionsList) {
        suggestionsList.addEventListener("click", function (event) {
            if (event.target && event.target.nodeName === "LI") {
                let selectedStreet = event.target.innerText.trim();
                document.getElementById("street-input").value = selectedStreet;
                resetHighlight(); // Reset highlighting after selection
            }
        });
    }
}

// Function to highlight a suggestion
function highlightSuggestion(index) {
    let suggestionsList = document.getElementById("suggestions");
    let items = suggestionsList.getElementsByTagName("li");

    // Reset the highlighting
    resetHighlight();

    if (items[index]) {
        items[index].classList.add("highlighted");
    }
}

// Function to reset the highlighting
function resetHighlight() {
    let suggestionsList = document.getElementById("suggestions");
    let items = suggestionsList.getElementsByTagName("li");
    for (let item of items) {
        item.classList.remove("highlighted");
    }
}

function showSuggestions() {
    let input = document.getElementById("street-input").value.trim().toLowerCase();
    let suggestionsList = document.getElementById("suggestions");
    suggestionsList.innerHTML = ""; // Clear previous suggestions

    if (input.length > 0) {
        // Filter from allStreets instead of streets
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


// Event listener for keyboard navigation (Up, Down, Enter)
document.getElementById("street-input").addEventListener("keydown", function(event) {
    let suggestionsList = document.getElementById("suggestions");
    let items = suggestionsList.getElementsByTagName("li");

    if (event.key === "ArrowDown") {
        // Move highlight down
        if (currentHighlightedIndex < items.length - 1) {
            currentHighlightedIndex++;
            highlightSuggestion(currentHighlightedIndex);
        }
    } else if (event.key === "ArrowUp") {
        // Move highlight up
        if (currentHighlightedIndex > 0) {
            currentHighlightedIndex--;
            highlightSuggestion(currentHighlightedIndex);
        }
    } else if (event.key === "Enter") {
        // If an item is highlighted, select it
        if (currentHighlightedIndex >= 0 && items[currentHighlightedIndex]) {
            let selectedStreet = items[currentHighlightedIndex].innerText.trim();
            document.getElementById("street-input").value = selectedStreet;
            resetHighlight(); // Reset the highlight after selection
            checkAnswer(); // Automatically submit when pressing Enter
        }
    }
});

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
    let gameOverScreen = document.getElementById("game-over-screen");
    let scoreDisplay = document.getElementById("game-over-text");
    
    // Ensure the score is correctly displayed
    scoreDisplay.innerText = `Game Over! You scored ${score} points`;

    // Show the game-over screen
    gameOverScreen.style.display = "flex";
}

function restartGame() {
    document.getElementById("game-over-screen").style.display = "none"; // Hide overlay
    
    score = 0;
    round = 1;
    startNewRound(); // Call your existing function to reset the game
}

// Load the first street when the page loads
loadStreetList();
