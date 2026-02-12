function updateTotals() {
  const rows = document.querySelectorAll("#contributionTable tbody tr");
  document.getElementById("totalMembers").textContent = rows.length;

  let grandTotal = 0;

  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    let rowTotal = 0;

    // Cells 1 to 12 are months
    for (let i = 1; i <= 12; i++) {
      let value = parseFloat(cells[i].textContent) || 0;
      rowTotal += value;
    }

    // Update row total (14th cell)
    cells[13].textContent = rowTotal.toFixed(2);
    grandTotal += rowTotal;
  });

  // Update grand total
  document.getElementById("totalContribution").textContent =
    "GHS " + grandTotal.toFixed(2);
}

// Example: apply contribution to a month
function applyContribution(monthIndex, amount) {
  const rows = document.querySelectorAll("#contributionTable tbody tr");

  rows.forEach(row => {
    row.children[monthIndex].textContent = amount;
  });

  updateTotals();
}

// Run once on page load
updateTotals();


const menuIcon = document.getElementById("menuIcon");
const menuLinks = document.getElementById("menuLinks");

menuIcon.addEventListener("click", () => {
  menuLinks.style.display = menuLinks.style.display === "block" ? "none" : "block";
});

document.addEventListener("click", (e) => {
  if (!menuIcon.contains(e.target) && !menuLinks.contains(e.target)) {
    menuLinks.style.display = "none";
  }
});


