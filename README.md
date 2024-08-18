# Talk-To-Me
Design Document for "Talk-To-Me" Chrome Extension
1. Overview
The "Talk-To-Me" Chrome extension is a user-friendly tool designed to convert highlighted text on any web page into speech. It utilizes the browser's built-in Speech Synthesis API to read aloud selected content, making it accessible to users who prefer or need audio representation of text. The extension offers customizable speech rates, automatic text highlighting, and an intuitive user interface.

2. Objectives
Text-to-Speech (TTS) Conversion: Allow users to convert highlighted text on web pages into spoken words.
Customizable Speech Rate: Provide users with the ability to adjust the speech rate to suit their listening preferences.
Text Highlighting: Visually highlight the spoken text in real-time, synchronizing the spoken word with the highlighted word.
User-Friendly Interface: Ensure the extension is easy to use, with clear controls and settings.
Session-Based About Dialog: Inform users about the extension’s functionality, with the “About” dialog shown on initial load and periodically based on user interaction.
3. Architecture and Components
Manifest File (manifest.json):

Specifies the extension's metadata, permissions, and dependencies.
Key permissions: activeTab, scripting, storage.
Defines the entry point for the extension (popup.html).
HTML Interface (popup.html):

Provides the visual structure for the extension’s popup.
Includes the textarea for displaying highlighted text, controls for speech rate adjustment, and buttons for additional functionality like opening the “About” dialog.
CSS Styling (styles.css):

Defines the visual styles for the extension’s interface, ensuring consistency and usability.
Includes styles for the text box, buttons, sliders, and dialogs, with responsiveness in mind.
JavaScript Logic (popup.js):

Text Retrieval: Captures the highlighted text from the active tab using chrome.scripting.executeScript.
Speech Synthesis: Converts the retrieved text to speech using the SpeechSynthesisUtterance API.
Speech Rate Adjustment: Allows users to adjust the speech rate using a slider, with changes saved using chrome.storage.local.
Text Highlighting: Synchronizes the text highlighting with the spoken words, utilizing the onboundary event of the SpeechSynthesisUtterance.
Session Handling: Manages the display of the “About” dialog using chrome.storage.session, ensuring it appears only when needed.
Icons and Assets:

Includes various icon sizes for the extension’s display in the browser toolbar and store listing.
4. Workflow and Data Flow
Initialization:

When the user opens the extension popup, popup.js initializes by retrieving any previously saved settings, such as the speech rate.
The script checks if the “About” dialog has been shown in the current session. If not, it displays the dialog and sets a flag in session storage.
Text Selection and Retrieval:

The extension captures the highlighted text on the active tab using chrome.scripting.executeScript.
The retrieved text is then inserted into the textBox element in the popup.
Text-to-Speech Conversion:

Upon loading the text, the extension automatically initiates speech synthesis, reading the text aloud at the user-defined rate.
The SpeechSynthesisUtterance API is used to handle the conversion, with real-time text highlighting managed by the onboundary event.
User Interaction:

Rate Adjustment: Users can adjust the speech rate via a slider, with the rate stored locally for consistency across sessions.
Pause/Resume: Clicking the text box toggles the speech between pause and resume states.
About Dialog: Users can view more information about the extension by clicking the “?” button, which opens the “About” dialog.
Speech Synchronization:

As the speech progresses, the text corresponding to the spoken word is highlighted. This is managed by the onboundary event, which triggers highlighting based on the character index.
5. Edge Cases and Considerations
Text Not Highlighted: If no text is highlighted when the popup is opened, the extension displays a message indicating that no text was selected.
Speech Rate and Highlight Sync: Special care is taken to ensure that the highlighting keeps pace with the speech, especially when the rate is adjusted mid-speech.
PDFs and Special Content: The extension is optimized for standard web pages. PDFs and certain dynamically rendered content (like Google Docs) may not work perfectly without further adjustments.
6. Future Enhancements
Support for More Content Types: Enhance support for PDFs and other non-standard web content.
Additional Voices and Languages: Provide users with options to select different voices or languages for the text-to-speech conversion.
Advanced Settings: Add more advanced settings for users who want finer control over speech synthesis, such as pitch and volume adjustments.
7. Testing and Deployment
Testing: Thorough testing across various web pages and content types to ensure reliability and performance.
Packaging: Once finalized, the extension is packaged into a .zip file for submission to the Chrome Web Store.
Submission: Follow Google’s submission guidelines to publish the extension and monitor feedback for continuous improvement.
This design document provides a comprehensive overview of the "Talk-To-Me" Chrome extension, detailing its objectives, architecture, workflow, and future considerations.
