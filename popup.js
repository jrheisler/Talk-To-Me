const textBox = document.getElementById("textToSpeak");
const rateSlider = document.getElementById("rateSlider");
const helpButton = document.getElementById("helpButton");
const aboutDialog = document.getElementById("aboutDialog");
const closeAboutButton = document.getElementById("closeAboutButton");
const closeButton = document.getElementById("closeButton");

let utterance = null;
let isSpeaking = false;
let currentCharIndex = 0; // Track the current character index

// Function to get the highlighted text from the active tab
function getHighlightedText() {
    return window.getSelection().toString();
}

// Load the highlighted text into the text box when the popup is opened
document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.session.get(['hasShownAbout'], function (result) {
        if (!result.hasShownAbout) {
            aboutDialog.showModal();
            chrome.storage.session.set({ 'hasShownAbout': true });
        }
    });

    chrome.storage.local.get(['savedRate'], function (result) {
        if (result.savedRate) {
            rateSlider.value = result.savedRate; // Set the slider to the saved value
        }
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
            {
                target: { tabId: tabs[0].id },
                func: getHighlightedText,
            },
            (results) => {
                if (results && results[0].result) {
                    textBox.innerText = results[0].result;
                    startSpeaking(); // Automatically start speaking the text
                } else {
                    textBox.innerText = "No text highlighted.";
                }
            }
        );
    });
});

// Start or toggle speech on click
textBox.addEventListener("click", () => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
        speechSynthesis.pause();
        textBox.style.borderColor = "#e76f51"; // Change border to red on pause
    } else if (speechSynthesis.paused) {
        speechSynthesis.resume();
        textBox.style.borderColor = "#2a9d8f"; // Reset border color on resume
    } else {
        startSpeaking();
    }
});

rateSlider.addEventListener("input", () => {
    // Save the selected speech rate to storage
    chrome.storage.local.set({ 'savedRate': rateSlider.value }, function () {
        console.log("Speech rate saved:", rateSlider.value);
    });

    if (isSpeaking) {
        speechSynthesis.cancel();
        startSpeakingFrom(currentCharIndex); // Restart speaking from the current position with the new speed
    }
});

function startSpeaking() {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel(); // Stop any ongoing speech
    }

    utterance = new SpeechSynthesisUtterance(textBox.innerText);
    utterance.rate = rateSlider.value; // Set the speech rate based on slider value
    isSpeaking = true;
    currentCharIndex = 0; // Reset character index
    textBox.style.borderColor = "#2a9d8f"; // Ensure the border is reset on start

    // Update character index as words are spoken
    utterance.onboundary = function (event) {
        if (event.name === 'word') {
            currentCharIndex = event.charIndex;
            highlightSpokenWord(currentCharIndex);
        }
    };

    utterance.onend = function () {
        isSpeaking = false;
    };

    speechSynthesis.speak(utterance);
}

function startSpeakingFrom(index) {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel(); // Stop any ongoing speech
    }

    const text = textBox.innerText.slice(index);
    utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rateSlider.value; // Set the speech rate based on slider value
    isSpeaking = true;

    // Update character index as words are spoken
    utterance.onboundary = function (event) {
        if (event.name === 'word') {
            currentCharIndex = index + event.charIndex;
            highlightSpokenWord(currentCharIndex);
        }
    };

    utterance.onend = function () {
        isSpeaking = false;
    };

    speechSynthesis.speak(utterance);
}

// Function to highlight the spoken word
function highlightSpokenWord(charIndex) {
    const text = textBox.innerText;

    const beforeText = text.slice(0, charIndex);
    const currentWordLength = text.slice(charIndex).split(/\s+/)[0].length;
    const currentWord = text.slice(charIndex, charIndex + currentWordLength);
    const afterText = text.slice(charIndex + currentWordLength);

    textBox.innerHTML = `<span class="text-content">${beforeText}<span class="highlight">${currentWord}</span>${afterText}</span>`;
}

// Handle closing the "About" dialog when the X button is clicked
closeAboutButton.addEventListener("click", () => {
    aboutDialog.close();
});

// Handle closing the popup window
closeButton.addEventListener("click", () => {
    window.close(); // This should close the popup
});

// Open the "About" dialog when the ? button is clicked
helpButton.addEventListener("click", () => {
    aboutDialog.showModal();
});
