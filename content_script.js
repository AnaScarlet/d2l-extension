
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
        let listOfParagraphs = document.getElementById("tinymce").getElementsByTagName("p");
        let lastParagraph = listOfParagraphs[listOfParagraphs.length-1];
        //console.log(lastParagraph);
        //console.log(lastParagraph.innerHTML);
        let originalLength = 0;
        if (lastParagraph.innerHTML !== '<br data-mce-bogus="1">') {
            let originalMsg = lastParagraph.innerHTML.split('<br data-mce-bogus="1">')[0];
            let strList = originalMsg.split("&nbsp; ");
            //console.log(strList);
            for (let str of strList) {
                if (str) {
                    let removeNspbs = str.split("&nbsp;")[0];
                    originalLength += (str.match(/&nbsp;/g) || []).length;  // how many nspb's there are
                    //console.log("Adding " + removeNspbs.length + " to length")
                    originalLength += removeNspbs.length;
                }
            }
            originalLength += (originalMsg.match(/&nbsp; /g) || []).length * 2;  // how many modified nspb's there were
            
            lastParagraph.innerHTML += "&nbsp;&nbsp;&nbsp;&nbsp;";
        } 
        else {
            lastParagraph.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;";
        }
        //console.log("Num chars in mgs: " + originalLength);

        let pos = originalLength + 4;
        positionCursor(lastParagraph, pos);
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
    }, 500);
}

function watchDynamicElementsForChanges() {
    discovered_elements = [];
    dark_mode_on = true;
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
    else if (element.tagName === "H1" || element.tagName === "H2" || element.tagName === "H3" || element.tagName === "H4" || element.tagName === "H5") {
        element.style.backgroundColor = "#ffffff00"  // transparent
    }
    else if (element.classList.contains("d2l-page-search")) {
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
