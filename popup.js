let checkbox = document.getElementById("dark-theme-checkbox");
let localStorage = window.localStorage;

init();

function init() {
  const darkTheme = localStorage.getItem('dark_theme');
  if (darkTheme === "on") {
    checkbox.setAttribute("value", "checked");
    checkbox.checked = true;
  }
  else {
    checkbox.setAttribute("value", "unchecked");
    checkbox.checked = false;
  }
}

checkbox.addEventListener('change', (event) => {

  function callback (returnObj) {
    if (returnObj) {
      if (returnObj.dark_theme) {
        checkbox.setAttribute("value", "checked");
        checkbox.checked = true;
        updateLocalStorage(true);
      }
      else {
        checkbox.setAttribute("value", "unchecked");
        checkbox.checked = false;
        updateLocalStorage(false);
      }
      if (!returnObj.matches) {
        console.log("Error: incorrect response to dark theme setting from D2L extension content script.");
      }
    }
  }

  if (event.currentTarget.checked) {
    checkbox.setAttribute("value", "checked");
    sendMessageToContentScript(true, callback);
  } 
  else {
    checkbox.setAttribute("value", "unchecked");
    sendMessageToContentScript(false, callback);
  }
});

function sendMessageToContentScript(dark_theme, callback) {
  if (dark_theme === true) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {dark_theme: "true"}, function(response) {
        if (response.dark_theme !== "on") {
          callback({dark_theme : false, matches: false});
        }
        else {
          callback({dark_theme : true, matches: true});
        }
      });
    });
  }
  else {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {dark_theme: "false"}, function(response) {
        if (response.dark_theme !== "off") {
          callback({dark_theme : true, matches: false});
        }
        else {
          callback({dark_theme : false, matches: true});
        }
      });
    });
  }
}

function updateLocalStorage(isDarkThemeOn) {
  if (isDarkThemeOn) {
    localStorage.setItem('dark_theme', 'on');
    // chrome.storage.sync.set({dark_theme: true}, () => {
    //   console.log("dark_theme set to true");
    // });
  }
  else {
    localStorage.setItem('dark_theme', 'off');
    // chrome.storage.sync.set({dark_theme: false}, () => {
    //   console.log("dark_theme set to false");
    // });
  }
}
