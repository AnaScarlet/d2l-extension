let checkbox = document.getElementById("dark-theme-checkbox");

checkbox.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    checkbox.setAttribute("value", "checked");
    window.postMessage({ type: "FROM_PAGE", text: "Hello from the webpage!" }, "*");

    // window.addEventListener("message", (event) => {
    //   // Do we trust the sender of this message?  (might be
    //   // different from what we originally opened, for example).
    //   console.log(event.source);
    //   if (event.origin !== "chrome-extension://edoaaplganibhckjockncmjmkejghiad") {
    //     return;
    //   }
    //   console.log("Source was d2l");

    //   // event.source is popup
    //   // event.data is "hi there yourself!  the secret response is: rheeeeet!"
    // }, false);
  } else {
    checkbox.setAttribute("value", "unchecked");
  }
})
