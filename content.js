chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.text) {
        const utterance = new SpeechSynthesisUtterance(request.text);
        speechSynthesis.speak(utterance);
    }
});
