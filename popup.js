let checkbox = document.getElementById("dark-theme-checkbox");

checkbox.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    checkbox.setAttribute("value", "checked");
  } else {
    checkbox.setAttribute("value", "unchecked");
  }
})
