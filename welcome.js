const enterBtn = document.getElementById("enterBtn");
const landingContainer = document.getElementById("landingContainer");

enterBtn.addEventListener("click", () => {

  // Prevent multiple clicks
  enterBtn.disabled = true;

  // Add exit animation
  landingContainer.classList.add("slide-out");

  // Redirect after animation
  setTimeout(() => {
    window.location.href = "2026.html";
  }, 450);

});