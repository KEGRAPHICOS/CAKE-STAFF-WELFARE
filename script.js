/* =========================================================
   CAKE STAFFS WELFARE
   CONTRIBUTION MANAGEMENT SYSTEM
========================================================= */

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
];

const year = document.body.dataset.year || "2026";

const tableBody = document.querySelector("#contributionTable tbody");
const totalContribution = document.getElementById("totalContribution");
const totalMembers = document.getElementById("totalMembers");
const statusMessage = document.getElementById("statusMessage");

const menuIcon = document.getElementById("menuIcon");
const menuLinks = document.getElementById("menuLinks");


/* =========================================================
   FORMAT MONEY
========================================================= */

function money(n) {
  return `GHS ${Number(n || 0).toFixed(2)}`;
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[ch]));
}


/* =========================================================
   RENDER CONTRIBUTION TABLE
========================================================= */

function render(records) {

  tableBody.innerHTML = "";

  let grand = 0;

  records.forEach(member => {

    let total = 0;

    const row = document.createElement("tr");

    let html = `
      <td class="name">
        ${escapeHTML(member.name)}
      </td>
    `;

    MONTHS.forEach(month => {

      const value = Number(member.c?.[month]) || 0;

      total += value;

      const cls = value > 0 ? "paid" : "unpaid";

      html += `
        <td class="${cls}">
          ${value.toFixed(2)}
        </td>
      `;

    });

    grand += total;

    html += `
      <td class="total">
        ${total.toFixed(2)}
      </td>
    `;

    row.innerHTML = html;

    tableBody.appendChild(row);

  });

  totalMembers.textContent = records.length;

  totalContribution.textContent = money(grand);

}


/* =========================================================
   LOAD RECORDS FROM BACKEND
========================================================= */

async function loadRecords() {
  try {
    statusMessage.textContent = `Loading ${year} records...`;
    statusMessage.className = "data-status";
    const key = `cake_welfare_records_${year}`;
    const saved = localStorage.getItem(key);
    let records;
    if (saved !== null) {
      records = JSON.parse(saved);
    } else {
      const response = await fetch("data.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load starter records");
      const seed = await response.json();
      records = seed[year] || [];
    }
    render(Array.isArray(records) ? records : []);
    statusMessage.textContent = `Records • ${year} • This browser`;
    statusMessage.className = "data-status online";
  } catch (error) {
    console.error("Error loading records:", error);
    statusMessage.textContent = "Unable to load records. Open this site through a web host or local web server.";
    statusMessage.className = "data-status offline";
    render([]);
  }
}


/* =========================================================
   MOBILE MENU
========================================================= */

if (menuIcon && menuLinks) {

  menuIcon.addEventListener("click", event => {

    event.stopPropagation();

    const isOpen = menuLinks.classList.toggle("show");

    menuIcon.setAttribute(
      "aria-expanded",
      isOpen ? "true" : "false"
    );

  });

  document.addEventListener("click", event => {

    if (
      !menuIcon.contains(event.target) &&
      !menuLinks.contains(event.target)
    ) {

      menuLinks.classList.remove("show");

      menuIcon.setAttribute("aria-expanded", "false");

    }

  });

}


/* =========================================================
   START
========================================================= */

loadRecords();