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

// Display matching street names in the suggestion box
function showSuggestions() {
    let input = document.getElementById("street-input").value.trim().toLowerCase();
    let suggestionsList = document.getElementById("suggestions");
    suggestionsList.innerHTML = ""; // Clear previous suggestions
    currentHighlightedIndex = -1; // Reset the highlighted index

    if (input.length > 0) {
        // Filter streets based on user input
        let matchedStreets = streets.filter(street => street.toLowerCase().includes(input));
        
        matchedStreets.forEach(street => {
            let listItem = document.createElement("li");
            listItem.innerText = street;
            suggestionsList.appendChild(listItem);
        });

        if (matchedStreets.length > 0) {
            suggestionsList.style.display = "block"; // Show the suggestions box
        } else {
            suggestionsList.style.display = "none"; // Hide if no matches
        }
    } else {
        suggestionsList.style.display = "none"; // Hide if input is empty
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

// Apply this CSS to highlight the selected suggestion
// Add the following to your CSS
#suggestions li.highlighted {
    background-color: #f0f0f0;
    font-weight: bold;
}
