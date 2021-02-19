
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
    console.log("sending message");
    chrome.runtime.sendMessage({d2l_page: "hello"}, (response) => {
        console.log(response.dark_theme);
        if (response.dark_theme === "true" && !dark_mode_on) {
            dark_mode();
        }
    });
}

document.addEventListener("keydown", event => {
    if (event.code === "Tab") {
        event.preventDefault();
        event.stopPropagation();

        //console.log("editor element:")
        //console.log(document.getElementsByClassName("d2l-htmleditor")[0]);   // null
        if (!document.getElementById("tinymce")) {
            return;
        }
        let tinyMceParentDocument = document.getElementById("tinymce").ownerDocument;

        if (event.shiftKey === true) {
            //console.log("Shift key pressed");
            tinyMceParentDocument.execCommand("outdent");
            return;
        }
        else {
            //console.log("Just Tab pressed");
            //console.log(window.getSelection());
            let listOfParagraphs = document.getElementById("tinymce").getElementsByTagName("p");
            let lastParagraph = listOfParagraphs[listOfParagraphs.length-1];
            let originalMsg = lastParagraph.innerHTML.split('<br data-mce-bogus="1">')[0];
            if (originalMsg.length > 0) {
                //console.log("text area had stuff in it");
                let selection = window.getSelection();
                //console.log("Anchor node parnet:");
                let parentNode = selection.anchorNode.parentElement;
                // console.log(parentNode);
                // console.log("Focus node:");
                // console.log(selection.focusNode);
                // console.log("Is selection collapsed = " + selection.isCollapsed);
                // console.log("anchorOffset:");
                // console.log(selection.anchorOffset);
                // console.log("number of ranges:");
                // console.log(selection.rangeCount);
                let newTextNode = parentNode.appendChild(
                    tinyMceParentDocument.createTextNode("\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"));
                //console.log("New Text node length = " + newTextNode.length);
                selection.extend(newTextNode, newTextNode.length);
                selection.collapseToEnd();
                // console.log("New anchorOffset:");
                // console.log(selection.anchorOffset);
            }
            else {
                tinyMceParentDocument.execCommand("indent");
            }
        }    
    }
});

// Original from: https://www.geeksforgeeks.org/how-to-set-cursor-position-in-content-editable-element-using-javascript/
function positionCursor(tag, pos) { 
      
    // Creates range object 
    var setpos = document.createRange(); 
      
    // Creates object for selection 
    var set = window.getSelection();
    
    // Set start position of range 
    setpos.setStart(tag.childNodes[0], pos); 
      
    // Collapse range within its boundary points 
    // Returns boolean 
    setpos.collapse(true); 
      
    // Remove all ranges set 
    set.removeAllRanges(); 
      
    // Add range with respect to range object. 
    set.addRange(setpos); 
      
    // Set cursor on focus 
    tag.focus(); 
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

    console.log(window.location.href);
    if (window.location.href === "https://d2l.ucalgary.ca/d2l/home") {
        console.log("On home page. Handle tabs.")

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
            }, 2500)
        }
    }
    

    const targetNodes = [];

    let dropdownContentElements = document.getElementsByTagName("d2l-dropdown-content");
    for (let i = 0; i<dropdownContentElements.length; i++) {
        let elem = dropdownContentElements[i];
        if (!elem.classList.contains("d2l-menuflyout-dropdown-contents")) {
            targetNodes.push(elem);
        }
    }

    let moreLessElements = document.getElementsByTagName('d2l-more-less');
    for (let i = 0; i<moreLessElements.length; i++) {
        let elem = moreLessElements[i];
        targetNodes.push(elem);
    }

    let mainPageElement = document.getElementsByClassName("d2l-page-main-padding");
    for (let i = 0; i<mainPageElement.length; i++) {
        let elem = mainPageElement[i];
        targetNodes.push(elem);
    }

    let dropdownContent = document.getElementsByTagName("d2l-dropdown-context-menu");
    for (let i = 0; i<dropdownContent.length; i++) {
        let elem = dropdownContent[i];
        targetNodes.push(elem);
    }


    targetNodes.push(document.getElementById("d2l_two_panel_selector_main"));

    // Page gets reloaded and then these are null...
    targetNodes.push(document.getElementById('postReplyPlacehodler_top'));
    targetNodes.push(document.getElementById('postReplyPlacehodler_bottom'));
    targetNodes.push(document.getElementById('createThreadPlaceholder'));

    // Options for the observer (which mutations to observe)
    const config = { attributes: true, childList: true, subtree: false };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);
    
    targetNodes.forEach((node) => {
        // Start observing the target node for configured mutations
        try {
            observer.observe(node, config);
        } catch (err) {
            console.log(err);
        }
    });

    console.log(targetNodes);

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
const callback = function(mutationsList, myobserver) {
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
                else {
                    dfs(mutation.target, body_bgc, text_color);
                    discovered_elements = [];
                }
            }
        }
        else if (mutation.type === 'attributes') {
            if (mutation.target.tagName === "d2l-more-less".toUpperCase()) {
                console.log("attribute mutation of d2l-more-less");
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
        console.log("Found activity widget");
        element.style.color = original_text_color; // original text color since it gets overriden by "inherit"
        element.style.backgroundColor = light_bgc;
        return {return: RETURN, backgroundColor: backgroundColor, foregroundColor: foregroundColor};
    }
    if (element.hasAttribute("fill") && element.hasAttribute("stroke")) {
        element.setAttribute("fill", light_bgc);
        element.setAttribute("stroke", button_primary);
    }
    if ((element.tagName === "A" && ! element.classList.contains("d2l-navigation-s-link") && !element.classList.contains("d2l-navigation-s-home-icon")
        && !element.classList.contains("vui-button") && !element.classList.contains("d2l-iterator-button")) 
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
    else {
        element.style.backgroundColor = backgroundColor;
    }
    if (element.id === "tinymce") {
        return {return: RETURN, backgroundColor: backgroundColor, foregroundColor: foregroundColor};
    }
    return {return: CONTINUE, backgroundColor: backgroundColor, foregroundColor: foregroundColor};
}
