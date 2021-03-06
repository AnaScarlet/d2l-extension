/******************************************************************************************************************************************************
 * Copyright 2021 Anastasiya Lazarenko
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 ******************************************************************************************************************************************************/


const dark = "#333333";
const body_bgc = "#424242";
const light_bgc = "#F5F5F5";
const original_text_color = "#494C4E";
const text_color = "#FAFAFA";
const link_color = "#80D8FF";
const button_primary = "#0091EA";
const button_secondary = light_bgc;

const RETURN = "return now";
const CONTINUE = "continue to dfs";

let discovered_elements = [];
let dark_mode_on = false;
var tinyMceParentDocument = document;
var tinyMceParentWindow = window;

// Attempt to bring dark mode faster....
document.body.onload = () => {
    document.body.style.backgroundColor = body_bgc;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.dark_theme === "true") {
        sendResponse({dark_theme: "on"});
        dark_mode();
    }
    else {
        sendResponse({dark_theme: "off"});
        if (dark_mode_on) {
            reloadPageToRemoveDarkMode();
        }
        else {
            // Bring back body's original color
            document.body.style.backgroundColor = "#FFFFFF";
        }
    }
});

window.onload = () => {
    chrome.runtime.sendMessage({d2l_page: "hello"}, (response) => {
        if (response.dark_theme === "true" && !dark_mode_on) {
            dark_mode();
        }
    });
}

function addKeyListenerToTinymce() {
    tinyMceParentDocument.addEventListener("keydown", (event) => {
        if (event.code === "Tab") {
            event.preventDefault();
            event.stopPropagation();

            if (!this.tinyMceParentDocument.getElementById("tinymce")) {
                return;
            }
            let selection = this.tinyMceParentWindow.getSelection();

            if (event.shiftKey === true) {              // Shift + Tab to untab
                if (selection.isCollapsed == false) {
                    this.tinyMceParentDocument.execCommand("outdent");
                    return;
                }
                let parentNode = selection.anchorNode.parentElement;
                let lastChild = parentNode.lastChild;
                if (!lastChild) {
                    return;
                }
                
                if (lastChild.textContent === "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"){
                    parentNode.removeChild(lastChild);
                    let newLastChild = parentNode.lastChild;
                    let range = new Range();
                    range.setStart(newLastChild, newLastChild.length);
                    selection.empty();
                    selection.addRange(range);
                    selection.collapseToEnd();
                }            
            }
            else {                                      // Just tab
                if (selection.isCollapsed == false) {
                    this.tinyMceParentDocument.execCommand("indent");
                    return;
                }
                let listOfParagraphs = this.tinyMceParentDocument.getElementById("tinymce").getElementsByTagName("p");
                let lastParagraph = listOfParagraphs[listOfParagraphs.length-1];
                let originalMsg = lastParagraph.innerHTML.split('<br data-mce-bogus="1">')[0];
                if (originalMsg.length > 0) {
                    let parentNode = selection.anchorNode.parentElement;
                    let newTextNode = parentNode.appendChild(
                        this.tinyMceParentDocument.createTextNode("\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"));
                    selection.extend(newTextNode, newTextNode.length);
                    selection.collapseToEnd();
                }
                else {
                    lastParagraph.removeChild(lastParagraph.children[0]); // remove the br
                    let newTextNode = lastParagraph.appendChild(
                        this.tinyMceParentDocument.createTextNode("\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"));
                    selection.extend(newTextNode, newTextNode.length);
                    selection.collapseToEnd();
                }
            }    
        }
    });
}


function reloadPageToRemoveDarkMode() {
    location.reload();
    dark_mode_on = false;
}

function dark_mode() {
    dfs(document.body, body_bgc, text_color);

    setTimeout(() => {
        watchDynamicElementsForChanges();
    }, 300);
}

function watchDynamicElementsForChanges() {
    discovered_elements = [];
    dark_mode_on = true;

    if (window.location.href === "https://d2l.ucalgary.ca/d2l/home") {
        //On home page. Handle tabs.

        setTimeout(() => {
            monitorTabClicks();
        }, 2000)
    
    
        let d2lTabsElement = document.getElementsByTagName("d2l-my-courses")[0].shadowRoot.children[1].shadowRoot.children[2].children;
        for (let i = 0; i<d2lTabsElement.length; i++) {
            let elem = d2lTabsElement[i];
            
            // Wait for spinner to go away!
            setTimeout(() => {
                dfs(elem, body_bgc, text_color);
                discovered_elements = [];
            }, 3000)
        }
    }
    
    /* 
     * TODO: Not sure if this is needed to get Quiz pages to work since no access...
     */
    // If page gets reloaded and then these elements are null...
    if (window.location.href.match(/https:\/\/d2l\.ucalgary\.ca.*\/content.*\/viewContent.*\/View/) !== null) {
        let textBox = document.querySelector(".d2l-quiz-textbox-html-container");
        if (textBox) {
            let newThreadIframe = document.querySelector(".d2l-htmleditor-iframecontainer > div > div > div > iframe");
            tinyMceParentDocument = newThreadIframe.contentDocument || newThreadIframe.contentWindow.document;
            tinyMceParentWindow = newThreadIframe.contentWindow;
            dfs(tinyMceParentDocument.body, body_bgc, text_color);
            dfs(textBox, body_bgc, text_color);
            addKeyListenerToTinymce();
        }
    }

    // Options for the observer (which mutations to observe)
    const config = { 
        attributes: true,
        childList: true,
        subtree: true    // observes the whole document efficiently
    };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);
    
    // Start observing the target node for configured mutations
    try {
        observer.observe(document.body, config);
    } catch (err) {
        console.log(err);
        console.log("Node:")
        console.log(node);
    }

}

function monitorTabClicks() {
    let tabButtons = document.getElementsByTagName("d2l-my-courses")[0].shadowRoot.querySelector("d2l-my-courses-container").shadowRoot.querySelector("d2l-tabs").shadowRoot.querySelector("div.d2l-tabs-layout.d2l-body-compact.d2l-tabs-layout-shown > div.d2l-tabs-container > div.arrow-keys-container > div").children;
    for (let tab of tabButtons) {
        tab.addEventListener("click", function() {
            let d2lTabsElement = document.getElementsByTagName("d2l-my-courses")[0].shadowRoot.children[1].shadowRoot.children[2].children;
            for (let i = 0; i<d2lTabsElement.length; i++) {
                let elem = d2lTabsElement[i];
                
                // Wait for spinner to go away!
                setTimeout(() => {
                    dfs(elem, body_bgc, text_color);
                    discovered_elements = [];
                }, 2500)
            }
        });
    }
}

// Callback function to execute when mutations are observed
const callback = function(mutationsList) {
    // Use traditional 'for loops' for IE 11
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            if (mutation.addedNodes.length !== 0) {
                if (mutation.target.id === "d2l_two_panel_selector_main") {
                    setTimeout(() => {
                        dfs(mutation.target, body_bgc, text_color);
                        discovered_elements = [];
                    }, 300);
                }
                else if (mutation.target.id === "createThreadPlaceholder") {
                    setTimeout(() => {
                        let newThreadIframe = document.getElementById("newThread$threadData$message$html_ifr");
                        tinyMceParentDocument = newThreadIframe.contentDocument || newThreadIframe.contentWindow.document;
                        tinyMceParentWindow = newThreadIframe.contentWindow;
                        dfs(tinyMceParentDocument.body, body_bgc, text_color);
                        dfs(mutation.target, body_bgc, text_color);
                        addKeyListenerToTinymce();
                    }, 300);
                }
                else if (mutation.target.id === "postReplyPlacehodler_top") {
                    setTimeout(() => {
                        let newThreadIframe = document.querySelector(".d2l-htmleditor-iframecontainer > div > div > div > iframe");
                        if (!newThreadIframe) {
                            console.log("Error: no thread editor iframe found.");
                        }
                        tinyMceParentDocument = newThreadIframe.contentDocument || newThreadIframe.contentWindow.document;
                        tinyMceParentWindow = newThreadIframe.contentWindow;
                        dfs(tinyMceParentDocument.body, body_bgc, text_color);
                        dfs(mutation.target, body_bgc, text_color);
                        addKeyListenerToTinymce();
                    }, 300);
                }
                else if (mutation.target.id === "postReplyPlacehodler_bottom") {
                    setTimeout(() => {
                        let newThreadIframes = document.querySelectorAll(".d2l-htmleditor-iframecontainer > div > div > div > iframe");
                        if (!newThreadIframes) {
                            console.log("Error: no thread editor iframe found.");
                        }
                        let newThreadIframe;
                        if (newThreadIframes.length === 1) {
                            newThreadIframe = newThreadIframes[0];  // the bottom one is the only open text box
                        }
                        else if (newThreadIframes.length === 2) {
                            newThreadIframe = newThreadIframes[1];  // the bottom text box is the second item in the list
                        }
                        else {
                            console.log("More than 2 thread text boxes found!");
                        }
                        tinyMceParentDocument = newThreadIframe.contentDocument || newThreadIframe.contentWindow.document;
                        tinyMceParentWindow = newThreadIframe.contentWindow;
                        dfs(tinyMceParentDocument.body, body_bgc, text_color);
                        dfs(mutation.target, body_bgc, text_color);
                        addKeyListenerToTinymce();
                    }, 300);
                }
                else {
                    dfs(mutation.target, body_bgc, text_color);
                    discovered_elements = [];
                }
            }
        }
        else if (mutation.type === 'attributes') {
            if (mutation.target.tagName === "d2l-more-less".toUpperCase()) {
                dfs(mutation.target, body_bgc, text_color);
                discovered_elements = [];
            }
        }
    }
}


function dfs(element, backgroundColor, foregroundColor) {
    if (!element || !element.style)
        return;
    discovered_elements.push(element);

    let returnValue = applyStylingToElement(element, backgroundColor, foregroundColor);
    if (returnValue.return === RETURN) {
        return;
    }

    backgroundColor = returnValue.backgroundColor;
    foregroundColor = returnValue.foregroundColor;
    
    for (let c of element.children) {
        if (!discovered_elements.includes(c)) {
            dfs(c, backgroundColor, foregroundColor);
        }
    }
    if (element.shadowRoot) {
        for (let shadow_c of element.shadowRoot.children){
            if (!discovered_elements.includes(shadow_c)) {
                dfs(shadow_c, backgroundColor, foregroundColor);
            }
        }
    }
}

function applyStylingToElement(element, backgroundColor, foregroundColor) {
    if (element.classList.contains("d2l-enrollment-card-image-container")) {
        return {return: RETURN, backgroundColor: backgroundColor, foregroundColor: foregroundColor};
    }
    else if (element.tagName === "d2l-dropdown-more".toUpperCase() || element.classList.contains("d2l-card-actions")) {
        return {return: RETURN, backgroundColor: backgroundColor, foregroundColor: foregroundColor};
    }
    if (element.getAttribute("aria-labelledby") === "ActivityFeedWidget") {
        element.style.color = original_text_color; // original text color since it gets overriden by "inherit"
        element.style.backgroundColor = light_bgc;
        return {return: RETURN, backgroundColor: backgroundColor, foregroundColor: foregroundColor};
    }
    if (element.hasAttribute("fill") && element.hasAttribute("stroke")) {
        element.setAttribute("fill", light_bgc);
        element.setAttribute("stroke", button_primary);
    }
    if ((element.tagName === "A" && !element.classList.contains("d2l-navigation-s-link") && !element.classList.contains("d2l-navigation-s-home-icon")
        && !element.classList.contains("vui-button") && !element.classList.contains("d2l-iterator-button") && !element.classList.contains("d2l-htmleditor-button"))
        || element.classList.contains("d2l-link") || element.classList.contains("d2l-button-subtle-icon") 
        || element.classList.contains("d2l-button-subtle-content") || element.classList.contains("d2l-linkheading-link")) {
        element.style.color = link_color;
        return {return: CONTINUE, backgroundColor: backgroundColor, foregroundColor: link_color};
    }
    if (element.classList.contains("d_tabs_c_s")) {
        element.style.borderBottomColor = backgroundColor;
    }
    if (element.classList.contains("d_tabs_text")) {
        return {return: RETURN, backgroundColor: backgroundColor, foregroundColor: foregroundColor};
    }
    else {
        element.style.color = foregroundColor;
    }
    if (element.classList.contains("d2l-button")) {
        if (element.hasAttribute("primary")) {
            element.style.backgroundColor = button_primary;
        }
        else {
            element.style.backgroundColor = button_secondary;
            element.style.color = body_bgc;
        }
        return {return: RETURN, backgroundColor: backgroundColor, foregroundColor: foregroundColor};
    }
    else if (element.classList.contains("d2l-htmleditor-group-bordered")) {
        element.style.borderColor = dark;
    }
    else if (element.tagName === "d2l-tabs".toUpperCase()) {
        let compStyle = element.style;
        compStyle.setProperty("--d2l-tabs-background-color", dark);
    }
    else if (element.tagName === "d2l-dropdown-menu".toUpperCase()) {
        let compStyle = element.style;
        compStyle.setProperty("--d2l-dropdown-background-color", body_bgc);
    }
    else if (element.classList.contains("d2l-tabs-layout")) {
        element.style.borderBottomColor = dark;
    }
    else if (element.classList.contains("d2l-le-calendar-today")) {
        element.style.backgroundColor = light_bgc;
        element.style.color = body_bgc;
        return {return: RETURN, backgroundColor: backgroundColor, foregroundColor: foregroundColor};
    }
    else if (element.classList.contains("d2l-htmleditor-button")) {
        element.style.backgroundColor = button_secondary;
        element.style.color = body_bgc;
        return {return: RETURN, backgroundColor: backgroundColor, foregroundColor: foregroundColor};
    }
    else if (element.tagName === "H1" || element.tagName === "H2" || element.tagName === "H3" || element.tagName === "H4" 
        || element.tagName === "H5" || element.classList.contains("d2l-page-search")) {
        element.style.backgroundColor = "#ffffff00"  // transparent
    }
    else if (element.classList.contains("d2l-more-less-blur")) {
        element.style.background = "linear-gradient(#ffffff00, #333333)";
    }
    else if (element.classList.contains("d2l-twopanelselector-side-sep") || element.classList.contains("d2l-twopanelselector-side")) {
        element.style.background = "linear-gradient(90deg, #ffffff00, #333333)";
    }
    else if (element.classList.contains("d2l-collapsepane-header")) {
        element.style.background = "linear-gradient(#616161, #333333)";
        element.style.borderColor = dark;
        return {return: CONTINUE, backgroundColor: "#ffffff00", foregroundColor: foregroundColor};
    }
    else if (element.classList.contains("d2l-datalist-container")) {
        element.style.background = backgroundColor;
    }
    else {
        element.style.backgroundColor = backgroundColor;
    }
    if (element.id === "tinymce") {
        return {return: RETURN, backgroundColor: backgroundColor, foregroundColor: foregroundColor};
    }
    return {return: CONTINUE, backgroundColor: backgroundColor, foregroundColor: foregroundColor};
}
