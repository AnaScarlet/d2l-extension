// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let localStorage = window.localStorage;

chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {hostEquals: 'd2l.ucalgary.ca'},
      })],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.d2l_page === "hello") {

    function callback (isDarkThemeOn) {
      if (isDarkThemeOn) {
        sendResponse({dark_theme: "true"});
      }
      else {
        sendResponse({dark_theme: "false"});
      }
    }

    init(callback);
    
  }
  return true;  // make response async
});

function init(callback) {
  const darkTheme = localStorage.getItem('dark_theme');
  //chrome.storage.sync.get(['dark_theme'], function(darkThemeObj) {
  if (darkTheme === "on") {
    callback(true);
  }
  else {
    callback(false);
  }
 // });
  
}
