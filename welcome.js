const enterBtn = document.getElementById("enterBtn");
const landingContainer = document.getElementById("landingContainer");

enterBtn.addEventListener("click", () => {
  // Add class to slide out
  landingContainer.classList.add("slide-out");

  // Redirect after animation completes
  landingContainer.addEventListener("transitionend", () => {
    window.location.href = "2026.html"; // main page
  }, { once: true });
});
