
const dark = "#333333";
const body_bgc = "#424242";
const text_color = "#FAFAFA";
const link_color = "#80D8FF";
const button_primary = "#0091EA";
const button_secondary = text_color;

let discovered_elements = [];


window.onload = () => {
    dark_mode()
}

function dark_mode() {
    dfs(document.body, body_bgc, text_color);
    //let selectorsToWaitFor = ["d2l-navigation-button-notification-icon", "#postReplyPlacehodler_bottom > div", "#postReplyPlacehodler_top > div"
    //"d2l-dropdown-context-menu",
        // "d2l-dropdown-content > div > #courseSelectorId", "d2l-dropdown-content > div > div > .d2l-messagebucket-button-container", 
        // "d2l-dropdown-content > div > div > #AB_DL_PH_Messages", "d2l-dropdown-content > div > div > #AB_DL_PH_Alerts", 
        // "d2l-dropdown-content > div > div > #AB_DL_PH_Grades", "d2l-dropdown-content > div.d2l-admin-tools > div"
    //];
    // waitForElementToDisplay(selectorsToWaitFor, (element) => {
    //     console.log("got callback about element");
    //     if (element.shadowRoot && 
    //     (element.tagName === "d2l-navigation-button-notification-icon".toUpperCase() || 
    //     element.tagName === "d2l-navigation-button".toUpperCase() || 
    //     element.tagName === "d2l-icon".toUpperCase())
    //     ) {
    //         for (let shadow_c of element.shadowRoot.children){
    //             dfs(shadow_c, body_bgc, text_color);
    //         }
    //     }
    //     else if (element.tagName === "d2l-dropdown-context-menu".toUpperCase() && element.shadowRoot) {
    //         console.log("Found d2l-dropdown-context-menu");
    //         console.log("is shadowRoot = "+element.shadowRoot);
    //         console.log("Child:");
    //         console.log(element.childNodes);
    //         for (let shadow_c of element.shadowRoot.children){
    //             dfs(shadow_c, body_bgc, text_color);
    //         }
    //         dfs(element, body_bgc, text_color);
    //     }
    //     // else if (element.tagName === "d2l-dropdown-menu".toUpperCase() && element.shadowRoot) {
    //     //     for (let shadow_c of element.shadowRoot.children){
    //     //         dfs(shadow_c, body_bgc, text_color);
    //     //     }
    //     //     dfs(element, body_bgc, text_color);
    //     // }
    //     else if (element.tagName === "div".toUpperCase()) {
    //         console.log("Got callback about d2l-dropdown-content's child div");
    //         dfs(element, body_bgc, text_color);
    //     }
    // }, 1000);


    const targetNodes = [];
    const discoveredNodes = [];

    let dropdownContentElements = document.getElementsByTagName("d2l-dropdown-content");
    for (let i = 0; i<dropdownContentElements.length; i++) {
        let elem = dropdownContentElements[i];
        if (!elem.classList.contains("d2l-menuflyout-dropdown-contents")) {
            targetNodes.push(elem);
        }
    }

    let postReplyTopXPath = document.evaluate("//*[@id='threadContentsPlaceholder']/div/div[2]/div[4]", document, null, XPathResult.ANY_UNORDERED_NODE_TYPE, null);
    if (postReplyTopXPath) {
        if (postReplyTopXPath.singleNodeValue) {
            targetNodes.push(postReplyTopXPath.singleNodeValue);
        }
    }

    let postReplyBottomXPath = document.evaluate("//*[@id='threadContentsPlaceholder']/div/div[2]/div[6]", document, null, XPathResult.ANY_UNORDERED_NODE_TYPE, null);
    if (postReplyBottomXPath) {
        if (postReplyBottomXPath.singleNodeValue) {
            targetNodes.push(postReplyBottomXPath.singleNodeValue);
        }
    }

    //targetNodes.push(document.getElementById('postReplyPlacehodler_top'));
    //targetNodes.push(document.getElementById('postReplyPlacehodler_bottom'));

    // Options for the observer (which mutations to observe)
    const config = { attributes: true, childList: true, subtree: false };

    // Callback function to execute when mutations are observed
    const callback = function(mutationsList, myobserver) {
        // Use traditional 'for loops' for IE 11
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                if (mutation.addedNodes.length !== 0) {
                    console.log("Added node");
                    if (!discoveredNodes.includes(mutation.target)) {
                        dfs(mutation.target, body_bgc, text_color);
                        discoveredNodes.push(mutation.target);
                        // let indexToDelete = targetNodes.indexOf(mutation.target);
                        // if (indexToDelete !== -1) {
                        //     console.log("Index to delete = " + indexToDelete);
                        //     console.log("Target nodes:");
                        //     console.log(targetNodes);
                        //     targetNodes.splice(indexToDelete, 1);
                        // }
                        // if (targetNodes.length === 0) {
                        //     observer.disconnect();
                        // }
                        // if (discoveredNodes.length === targetNodes.length) {
                        //     console.log("Stopping observer");
                        //     observer.disconnect();
                        // }
                    }
                }
                if (mutation.removedNodes.length !== 0) {
                    console.log("Removed node");
                }
            }
            else if (mutation.type === 'attributes') {
                if (mutation.attributeName === "opened") {
                    discoveredNodes.push(mutation.target);
                }
                //console.log('The ' + mutation.attributeName + ' attribute was modified.');
            }
        }
    }

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);
    
    targetNodes.forEach((node) => {
        // Start observing the target node for configured mutations
        try {
            observer.observe(node, config);
        } catch (err) {
            console.log(err);
            // observer.observe(document.getElementById('postReplyPlacehodler_top'));
            // observer.observe(document.getElementById('postReplyPlacehodler_bottom'));
        }
    });
    

    console.log("Number of target nodes:");
    console.log(targetNodes.length);

}


function dfs(element, backgroundColor, foregroundColor) {
    if (!element || !element.style)
        return;
    discovered_elements.push(element);
    if (element.classList.contains("d2l-link") || element.classList.contains("d2l-button-subtle-icon") 
    || element.classList.contains("d2l-button-subtle-content")) {
        element.style.color = link_color;
    }
    else {
        element.style.color = foregroundColor;
    }
    if (element.classList.contains("d2l-button")) {
        //console.log("Found a button");
        if (element.hasAttribute("primary")) {
            element.style.backgroundColor = button_primary;
        }
        else {
            element.style.backgroundColor = button_secondary;
            element.style.color = body_bgc;
        }
        return;
    }
    else if (element.classList.contains("d2l-htmleditor-group-bordered")) {
        element.style.borderColor = dark;
    }
    else if (element.classList.contains("d2l-htmleditor-button")) {
        element.style.backgroundColor = button_secondary;
        element.style.color = body_bgc;
        return;
    }
    else {
        element.style.backgroundColor = backgroundColor;
    }
    for (let c of element.children) {
        if (!discovered_elements.includes(c)) {
            dfs(c, backgroundColor, foregroundColor);
        }
    }
    if (element.shadowRoot) {
        for (let shadow_c of element.shadowRoot.children){
            dfs(shadow_c, backgroundColor, foregroundColor);
        }
    }
}

// Original function from: https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists/57395241#57395241
// function waitForElementToDisplay(selectors, callback, checkFrequencyInMs, timeoutInMs) {
//     var startTimeInMs = Date.now();
//     var elem;
//     (function loopSearch() {
//         for (let selector of selectors) {
//             elem = document.querySelector(selector);
//             if (elem != null) {
//                 callback(elem);
//                 let indexToDelete = selectors.indexOf(selector);
//                 selectors.splice(indexToDelete, 1);  // best for memory
//                 //delete selectors[indexToDelete];  // replaces array element with empty
//                 //selectors = selectors.filter(elem => elem !== selector);  // causes memory leak! yikes!
//                 console.log("New selectors:");
//                 console.log(selectors);
//                 if (selectors.length === 0) {
//                     return;
//                 }
//             }
//             else {
//                 setTimeout(function () {
//                 if (timeoutInMs && Date.now() - startTimeInMs > timeoutInMs)
//                     return;
//                 loopSearch();
//                 }, checkFrequencyInMs);
//             }
//         }
//     })();
// }
