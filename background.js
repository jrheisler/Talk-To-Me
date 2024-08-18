chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['runCount'], function (result) {
        let runCount = result.runCount || 0;
        runCount++;
        chrome.storage.local.set({ 'runCount': runCount });
    });
});
