// popup.js – Complete Updated File

// Get DOM elements

const textBox = document.getElementById("textToSpeak");
const rateSlider = document.getElementById("rateSlider");
const helpButton = document.getElementById("helpButton");
const aboutDialog = document.getElementById("aboutDialog");
const closeAboutButton = document.getElementById("closeAboutButton");
const stopButton = document.getElementById("stopButton");
const pasteButton = document.getElementById("pasteButton");
const wordCountElement = document.getElementById("wordCount");
const fileInput = document.getElementById("fileInput");
const chooseFileButton = document.getElementById("chooseFileButton");
const restartButton = document.getElementById("restartButton");
const jumpBackButton = document.getElementById("jumpBackButton");
const jumpForwardButton = document.getElementById("jumpForwardButton");

// Helper: Calculate character offset for a 10-second jump
function getJumpOffset() {
  // At 150 wpm, there are 2.5 words per second.
  // Assuming ~6 characters per word gives about 15 characters per second.
  // Multiply by currentRate and 10 seconds.
  return Math.round(150 * parseFloat(rateSlider.value));
}

// Jump Back button: Move speech back 10 seconds
jumpBackButton.addEventListener("click", () => {
  let offset = getJumpOffset();
  // Ensure we don't go before the beginning of the text.
  currentCharIndex = Math.max(0, currentCharIndex - offset);
  speechSynthesis.cancel();
  startSpeakingFrom(currentCharIndex);
});

// Jump Forward button: Move speech forward 10 seconds
jumpForwardButton.addEventListener("click", () => {
  let offset = getJumpOffset();
  // Ensure we don't go beyond the text length.
  currentCharIndex = Math.min(textBox.innerText.length, currentCharIndex + offset);
  speechSynthesis.cancel();
  startSpeakingFrom(currentCharIndex);
});


// Register the dialog with the polyfill if it doesn't have the native showModal() method
if (!('showModal' in HTMLDialogElement.prototype)) {
  dialogPolyfill.registerDialog(aboutDialog);
}


let utterance = null;
let isSpeaking = false;
let currentCharIndex = 0; // Tracks current character index

// Function to update word count and estimated reading time
function updateWordCount() {
  const text = textBox.innerText.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const baseWPM = 150;
  const currentRate = parseFloat(rateSlider.value);
  const adjustedWPM = baseWPM * currentRate;
  const estimatedTime = (words / adjustedWPM).toFixed(2);
  wordCountElement.innerText = `Word Count: ${words} | Estimated Time: ${estimatedTime} mins`;
}

// Load saved speech rate if available
const savedRate = localStorage.getItem("savedRate");
if (savedRate) {
  rateSlider.value = savedRate;
}

// Update word count on text change
textBox.addEventListener("input", updateWordCount);

// --- DRAG & DROP HANDLING ---

textBox.addEventListener("dragover", (e) => {
  console.log("dragover event triggered");
  e.preventDefault(); // Allow drop
  textBox.classList.add("dragover");
});
textBox.addEventListener("dragenter", (e) => {
  console.log("dragenter event triggered");
  e.preventDefault();
  textBox.classList.add("dragover");
});
textBox.addEventListener("dragleave", () => {
  console.log("dragleave event triggered");
  textBox.classList.remove("dragover");
});
textBox.addEventListener("drop", (e) => {
  console.log("drop event triggered");
  e.preventDefault();
  textBox.classList.remove("dragover");

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    processFile(files[0]);
  }
});

// --- END DRAG & DROP ---

// File input handling via button
chooseFileButton.addEventListener("click", () => {
  fileInput.click();
});
fileInput.addEventListener("change", () => {
  const files = fileInput.files;
  if (files.length > 0) {
    processFile(files[0]);
  }
});

restartButton.addEventListener("click", () => {
  // Cancel any ongoing speech
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
  // Reset the current character index to 0
  currentCharIndex = 0;
  // Start speaking from the beginning
  startSpeaking();
});

// Paste button: read clipboard text and start speech
pasteButton.addEventListener("click", async () => {
  try {
    const clipboardText = await navigator.clipboard.readText();
    if (clipboardText) {
      textBox.innerHTML = clipboardText;
      textBox.innerText = clipboardText;
      updateWordCount();
      startSpeaking();
    }
  } catch (err) {
    console.error("Error reading clipboard:", err);
  }
});
// Rate slider: update saved rate and restart speech if needed
rateSlider.addEventListener("input", () => {
  localStorage.setItem("savedRate", rateSlider.value);
  updateWordCount();
  if (isSpeaking) {
    speechSynthesis.cancel();
    startSpeakingFrom(currentCharIndex);
  }
});

// Stop/Start button: toggle speech synthesis
stopButton.addEventListener("click", () => {
  if (isSpeaking) {
    speechSynthesis.cancel();
    isSpeaking = false;
    textBox.style.borderColor = "";
  } else {
    if (textBox.innerText.trim() !== "") {
      startSpeakingFrom(currentCharIndex);
    }
  }
});

// Process file based on type (TXT, DOCX, PDF)
function processFile(file) {
  const fileName = file.name.toLowerCase();
  console.log("Processing file:", fileName, "MIME type:", file.type);

  // Allowed types/extension arrays
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
  ];
  const allowedExtensions = [".pdf", ".doc", ".docx", ".txt"];
  const isAllowedType = allowedTypes.includes(file.type);
  const isAllowedExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

  if (isAllowedType || isAllowedExtension) {
    if (fileName.endsWith(".txt") || file.type === "text/plain") {
      console.log("Processing TXT file");
      const reader = new FileReader();
      reader.onload = function(event) {
        textBox.innerText = event.target.result;
        updateWordCount();
        startSpeaking();
      };
      reader.onerror = function(e) {
        textBox.innerText = "Error reading file.";
        updateWordCount();
      };
      reader.readAsText(file);
    } else if (fileName.endsWith(".docx")) {
      console.log("Processing DOCX file");
      const reader = new FileReader();
      reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
          .then(result => {
            // Create a temporary element to extract plain text
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = result.value;
            const extractedText = tempDiv.innerText;
            textBox.innerText = extractedText;
            updateWordCount();
            startSpeaking();
          })
          .catch(error => {
            console.error("Error processing DOCX file:", error);
            textBox.innerText = "Error processing DOCX file.";
            updateWordCount();
          });

        mammoth.extractRawText({ arrayBuffer: arrayBuffer })
          .then(function(result) {
            console.log("Mammoth raw text extraction result:", result);
            let extractedText = result.value;
            extractedText = extractedText.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
            extractedText = extractedText.replace(/\s+/g, ' ').trim();
            textBox.innerText = extractedText;
            updateWordCount();
            startSpeaking();
          })
          .catch(function(error) {
            console.error("Error processing DOCX file:", error);
            textBox.innerText = "Error processing DOCX file.";
            updateWordCount();
          });
      };
      reader.onerror = function(e) {
        console.error("FileReader error:", e);
        textBox.innerText = "Error reading file.";
        updateWordCount();
      };
      reader.readAsArrayBuffer(file);
    } else if (fileName.endsWith(".doc")) {
      textBox.innerText = "DOC file conversion is not supported. Please convert to DOCX.";
      updateWordCount();
    } else if (fileName.endsWith(".pdf") || file.type === "application/pdf") {
      console.log("Processing PDF file");
      const reader = new FileReader();
      reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js';
        pdfjsLib.getDocument({ data: arrayBuffer }).promise.then(function(pdf) {
          console.log("PDF loaded. Number of pages:", pdf.numPages);
          let maxPages = pdf.numPages;
          let pagePromises = [];
          for (let i = 1; i <= maxPages; i++) {
            pagePromises.push(
              pdf.getPage(i).then(function(page) {
                console.log("Processing page", i);
                return page.getTextContent().then(function(textContent) {
                  let pageText = textContent.items.map(item => item.str).join(" ");
                  console.log("Page", i, "text sample:", pageText.substring(0, 50));
                  return pageText;
                });
              })
            );
          }
          Promise.all(pagePromises).then(function(pagesText) {
            const pdfText = pagesText.join("\n");
            console.log("Final extracted PDF text length:", pdfText.length);
            textBox.innerText = pdfText;
            updateWordCount();
            startSpeaking();
          }).catch(function(err) {
            console.error("Error processing PDF pages:", err);
            textBox.innerText = "Error processing PDF file pages.";
            updateWordCount();
          });
        }).catch(function(error) {
          console.error("Error loading PDF:", error);
          textBox.innerText = "Error processing PDF file.";
          updateWordCount();
        });
      };
      reader.onerror = function(e) {
        console.error("Error reading PDF file:", e);
        textBox.innerText = "Error reading file.";
        updateWordCount();
      };
      reader.readAsArrayBuffer(file);
    }
  } else {
    textBox.innerText = `Unsupported file type: ${file.name}`;
    updateWordCount();
  }
}

// --- TEXT-TO-SPEECH FUNCTIONS ---

function startSpeaking() {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
  const text = textBox.innerText;
  if (!text) return;
  utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = parseFloat(rateSlider.value);
  isSpeaking = true;
  currentCharIndex = 0;
  textBox.style.borderColor = "#80cbc4";

  utterance.onboundary = function(event) {
    if (event.name === "word") {
      currentCharIndex = event.charIndex;
      highlightSpokenWord(currentCharIndex);
    }
  };

  utterance.onend = function() {
    isSpeaking = false;
    textBox.style.borderColor = "";
  };

  speechSynthesis.speak(utterance);
}

function startSpeakingFrom(index) {
  console.log("Starting speech from index:", index);
  const text = textBox.innerText;
  if (!text || index >= text.length) return;
  const remainingText = text.slice(index);
  utterance = new SpeechSynthesisUtterance(remainingText);
  utterance.rate = parseFloat(rateSlider.value);
  isSpeaking = true;

  utterance.onboundary = function(event) {
    if (event.name === "word") {
      currentCharIndex = index + event.charIndex;
      highlightSpokenWord(currentCharIndex);
    }
  };

  utterance.onend = function() {
    isSpeaking = false;
    textBox.style.borderColor = "";
  };

  speechSynthesis.speak(utterance);
}

function highlightSpokenWord(charIndex) {
  const text = textBox.innerText;
  if (!text) return;
  let start = charIndex;
  while (start > 0 && text[start - 1] !== ' ') {
    start--;
  }
  let end = charIndex;
  while (end < text.length && text[end] !== ' ') {
    end++;
  }
  const before = text.slice(0, start);
  const word = text.slice(start, end);
  const after = text.slice(end);

  textBox.innerHTML = `${before}<span class="highlight">${word}</span>${after}`;

  const highlightElement = textBox.querySelector(".highlight");
//  if (highlightElement) {
//    highlightElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
//  }
if (highlightElement.scrollIntoViewIfNeeded) {
  highlightElement.scrollIntoViewIfNeeded({ behavior: "smooth" });
} else {
  highlightElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
}

}

// --- ABOUT DIALOG ---
closeAboutButton.addEventListener("click", () => {
  aboutDialog.close();
});

helpButton.addEventListener("click", () => {
  aboutDialog.showModal();
});

// --- INITIAL UPDATE ---
updateWordCount();
/*
textBox.addEventListener("click", (e) => {
  // Remove focus to prevent interference with editing behavior.
  textBox.blur();
  console.log("Text area clicked", speechSynthesis.speaking, speechSynthesis.paused);
  if (speechSynthesis.speaking && !speechSynthesis.paused) {
    speechSynthesis.pause();
    textBox.style.borderColor = "#e76f51"; // Indicate pause
    console.log("Speech paused");
  } else if (speechSynthesis.paused) {
    speechSynthesis.resume();
    textBox.style.borderColor = "#80cbc4"; // Indicate resume
    console.log("Speech resumed");
  } else {
    startSpeaking();
  }
});
*/
textBox.addEventListener("click", (e) => {
  // If Alt is pressed, we want to restart from the clicked position.
  if (e.altKey) {
    // Focus the text box so the browser updates the selection/caret
    textBox.focus();
    // Use a small delay to ensure the selection is updated.
    setTimeout(() => {
      const caretOffset = getCaretOffsetFromClick(e, textBox);
      console.log("Alt-click computed caret offset:", caretOffset);
      // Remove focus to avoid default editing behavior
      textBox.blur();
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      // Use a short delay to ensure cancellation is processed, then restart from the clicked offset
      setTimeout(() => {
        currentCharIndex = caretOffset;
        startSpeakingFrom(caretOffset);
      }, 200);
    }, 100); // Delay of 100ms to let selection update
  } else {
    // Normal click behavior: toggle pause/resume
    // Remove focus immediately so editing doesn't interfere
    textBox.blur();
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      textBox.style.borderColor = "#e76f51";
      console.log("Speech paused");
    } else if (speechSynthesis.paused) {
      speechSynthesis.resume();
      textBox.style.borderColor = "#80cbc4";
      console.log("Speech resumed");
    } else {
      const caretOffset = getCaretOffsetFromClick(e, textBox);
      console.log("Regular click computed caret offset:", caretOffset);
      currentCharIndex = caretOffset;
      startSpeakingFrom(caretOffset);
      console.log("Speech started from offset:", caretOffset);
    }
  }
});



function getCaretOffsetFromClick(e, element) {
  let caretOffset = 0;
  // For browsers that support document.caretRangeFromPoint (Chrome, Edge, etc.)
  if (document.caretRangeFromPoint) {
    let range = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (range) {
      let preCaretRange = document.createRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      caretOffset = preCaretRange.toString().length;
    }
  }
  // For Firefox and others that support document.caretPositionFromPoint
  else if (document.caretPositionFromPoint) {
    let pos = document.caretPositionFromPoint(e.clientX, e.clientY);
    if (pos) {
      let preCaretRange = document.createRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(pos.offsetNode, pos.offset);
      caretOffset = preCaretRange.toString().length;
    }
  }
  return caretOffset;
}

