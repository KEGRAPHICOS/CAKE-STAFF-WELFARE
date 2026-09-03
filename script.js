const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const year = document.body.dataset.year || "2026";
const tableBody = document.querySelector("#contributionTable tbody");
const totalContribution = document.getElementById("totalContribution");
const totalMembers = document.getElementById("totalMembers");
const statusMessage = document.getElementById("statusMessage");

function money(n) {
  return `GHS ${Number(n || 0).toFixed(2)}`;
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

function render(records) {
  tableBody.innerHTML = "";
  let grand = 0;

  records.forEach(member => {
    let total = 0;
    const row = document.createElement("tr");
    let html = `<td class="name">${escapeHTML(member.name)}</td>`;

    MONTHS.forEach(month => {
      const value = Number(member.c?.[month]) || 0;
      total += value;
      const cls = value > 0 ? "paid" : "unpaid";
      html += `<td class="${cls}">${value.toFixed(2)}</td>`;
    });

    grand += total;
    html += `<td class="total">${total.toFixed(2)}</td>`;
    row.innerHTML = html;
    tableBody.appendChild(row);
  });

  totalMembers.textContent = records.length;
  totalContribution.textContent = money(grand);
}

async function loadRecords() {
  try {
    const response = await fetch(`/api/data/${year}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Server unavailable");
    const records = await response.json();
    render(Array.isArray(records) ? records : []);
    statusMessage.textContent = `Live records • ${year}`;
    statusMessage.className = "data-status online";
  } catch (error) {
    statusMessage.textContent = "Unable to load live records. Start the backend server.";
    statusMessage.className = "data-status offline";
    render([]);
  }
}

const menuIcon = document.getElementById("menuIcon");
const menuLinks = document.getElementById("menuLinks");
if (menuIcon && menuLinks) {
  menuIcon.addEventListener("click", event => {
    event.stopPropagation();
    menuLinks.style.display = menuLinks.style.display === "block" ? "none" : "block";
  });
  document.addEventListener("click", event => {
    if (!menuIcon.contains(event.target) && !menuLinks.contains(event.target))
      menuLinks.style.display = "none";
  });
}

loadRecords();
