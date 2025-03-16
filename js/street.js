// street.js

export async function loadStreetList() {
    try {
        let response = await fetch('streets.txt');
        let text = await response.text();
        let streets = text.split('\n').map(line => line.trim()).filter(line => line); // Clean up

        if (streets.length === 0) {
            console.error("⚠️ Street list is empty!");
            return;
        }

        // Choose a random street
        const correctStreet = streets[Math.floor(Math.random() * streets.length)];
        console.log("✅ Selected street:", correctStreet);

        return correctStreet; // Return the correct street
    } catch (error) {
        console.error("❌ Error loading streets:", error);
    }
}
