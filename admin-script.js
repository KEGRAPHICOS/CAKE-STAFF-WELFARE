"use strict";

/* =========================================================
   CAKE STAFFS WELFARE - ADMIN SCRIPT

   Connected directly to the Node.js/Express backend.
   The frontend and backend are served from the same
   online server, so the system works on any device.
========================================================= */


/* =========================================================
   DATABASE CONFIGURATION
========================================================= */

const API_BASE = window.location.origin;

const MONTHS = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
];

const TOKEN_KEY = "cake_admin_token";
const USER_KEY = "cake_saved_username";
const YEAR_KEY = "cake_admin_year";


/* =========================================================
   HTML ELEMENTS
========================================================= */

const loginPage = document.getElementById("loginPage");
const dashPage = document.getElementById("dashPage");

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("u");
const passwordInput = document.getElementById("p");
const errorMessage = document.getElementById("err");
const rememberMe = document.getElementById("rememberMe");
const loginButton = document.getElementById("loginBtn");

const togglePasswordBtn = document.getElementById("togglePasswordBtn");

const searchInput = document.getElementById("q");
const memberNameInput = document.getElementById("nName");
const memberPanel = document.getElementById("panel");

const tableBody = document.getElementById("tb");
const emptyState = document.getElementById("emptyState");

const grandTotalElement = document.getElementById("gt");
const memberCountElement = document.getElementById("gm");
const recordCountElement = document.getElementById("recordCount");
const totalLabel = document.getElementById("totalLabel");

const loader = document.getElementById("loader");
const loaderText = document.getElementById("loaderText");

const yearSelect = document.getElementById("yearSelect");
const syncStatus = document.getElementById("syncStatus");
const footerYear = document.getElementById("footerYear");

const deleteModal = document.getElementById("deleteModal");
const saveModal = document.getElementById("saveModal");

const deleteMemberName = document.getElementById("deleteMemberName");
const saveYearText = document.getElementById("saveYearText");

const openAddBtn = document.getElementById("openAddBtn");
const closeAddBtn = document.getElementById("closeAddBtn");
const addMemberBtn = document.getElementById("addMemberBtn");

const saveAllBtn = document.getElementById("saveAllBtn");
const closeSaveBtn = document.getElementById("closeSaveBtn");
const confirmSaveBtn = document.getElementById("confirmSaveBtn");

const logoutBtn = document.getElementById("logoutBtn");

const closeDeleteBtn = document.getElementById("closeDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");


/* =========================================================
   APP STATE
========================================================= */

let currentYear = localStorage.getItem(YEAR_KEY) || "2026";

let db = [];

let dirty = false;

let memberToDelete = null;


/* =========================================================
   HELPERS
========================================================= */

function money(value) {
    return `GHS ${Number(value || 0).toFixed(2)}`;
}


function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[character]));
}


function setStatus(text, state = "") {
    if (!syncStatus) return;

    syncStatus.textContent = text;
    syncStatus.className = state;
}


function showLoader(text = "Loading...") {
    if (loaderText) loaderText.textContent = text;
    if (loader) loader.style.display = "flex";
}


function hideLoader() {
    if (loader) loader.style.display = "none";
}


function showLogin() {
    if (loginPage) loginPage.style.display = "flex";
    if (dashPage) dashPage.style.display = "none";
}


function showDashboard() {
    if (loginPage) loginPage.style.display = "none";
    if (dashPage) dashPage.style.display = "block";
}


function showError(message) {
    if (!errorMessage) return;

    errorMessage.textContent = message;
    errorMessage.style.display = "block";
}


function clearError() {
    if (!errorMessage) return;

    errorMessage.textContent = "";
    errorMessage.style.display = "none";
}


/* =========================================================
   DATABASE NORMALIZATION
========================================================= */

function normalize(records) {

    return (Array.isArray(records) ? records : [])

        .filter(member =>
            member &&
            typeof member.name === "string"
        )

        .map(member => {

            const contributions = {};

            MONTHS.forEach(month => {

                const value = Number(member.c?.[month] ?? 0);

                contributions[month] =
                    Number.isFinite(value) && value >= 0
                        ? Math.round(value * 100) / 100
                        : 0;

            });

            return {
                name: member.name
                    .trim()
                    .replace(/\s+/g, " ")
                    .toUpperCase(),

                c: contributions
            };

        })

        .filter((member, index, array) =>
            member.name &&
            array.findIndex(item =>
                item.name === member.name
            ) === index
        )

        .sort((a, b) =>
            a.name.localeCompare(b.name)
        );
}


/* =========================================================
   DATABASE REQUEST
========================================================= */

async function apiFetch(path, options = {}) {

    const token = sessionStorage.getItem(TOKEN_KEY);

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
        cache: "no-store",
        ...options,
        headers
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            body.error || "Database request failed"
        );
    }

    return body;
}


/* =========================================================
   LOAD YEAR
========================================================= */

async function loadYear(year = currentYear) {

    currentYear = String(year);

    localStorage.setItem(YEAR_KEY, currentYear);

    if (yearSelect) {
        yearSelect.value = currentYear;
    }

    if (footerYear) {
        footerYear.textContent = currentYear;
    }

    if (totalLabel) {
        totalLabel.textContent =
            `TOTAL CONTRIBUTIONS - ${currentYear}`;
    }

    if (saveYearText) {
        saveYearText.textContent = currentYear;
    }

    setStatus(`Loading ${currentYear}...`);

    try {

        const response = await apiFetch(`/api/data/${currentYear}`);

        const records = Array.isArray(response) ? response : [];

        db = normalize(records);

        dirty = false;

        render();

        setStatus(`Live • ${currentYear}`, "online");

    } catch (error) {

        console.error("Load error:", error);

        db = [];

        render();

        setStatus("Server unavailable", "offline");

        alert(
            "Could not load the database.\n\n" +
            "Please check your internet connection."
        );

    }
}


/* =========================================================
   SAVE DATABASE
========================================================= */

async function saveDatabase(showMessage = true) {

    try {

        setStatus("Saving...", "saving");

        db = normalize(db);

        await apiFetch(`/api/data/${currentYear}`, {
            method: "PUT",
            body: JSON.stringify(db)
        });

        dirty = false;

        render();

        setStatus(`Saved • ${currentYear}`, "online");

        if (showMessage) {

            alert(
                `All ${currentYear} entries have been saved successfully.`
            );

        }

    } catch (error) {

        console.error("Save error:", error);

        setStatus("Save failed", "offline");

        alert(
            "The entries could not be saved.\n\n" +
            "Please check your internet connection."
        );

    }
}


/* =========================================================
   RENDER TABLE
========================================================= */

function render() {

    if (!tableBody) return;

    const filter = searchInput
        ? searchInput.value.trim().toUpperCase()
        : "";

    tableBody.innerHTML = "";

    let visibleCount = 0;

    db.forEach((member, index) => {

        if (
            filter &&
            !member.name.includes(filter)
        ) {
            return;
        }

        visibleCount++;

        const row = document.createElement("tr");

        let total = 0;

        let html = `
            <td>
                <b>${escapeHTML(member.name)}</b>
            </td>
        `;

        MONTHS.forEach(month => {

            const value = Number(member.c?.[month]) || 0;

            total += value;

            html += `
                <td>
                    <input
                        type="text"
                        inputmode="decimal"
                        data-index="${index}"
                        data-month="${month}"
                        value="${value.toFixed(2)}"
                        class="${value === 0 ? "zero" : ""}"
                        aria-label="${month} contribution for ${escapeHTML(member.name)}"
                    >
                </td>
            `;

        });

        html += `
            <td>
                <b class="memberTotal">${money(total)}</b>
            </td>

            <td>
                <button
                    type="button"
                    class="del"
                    data-delete-index="${index}"
                >
                    <i class="fa-solid fa-trash"></i>
                    REMOVE
                </button>
            </td>
        `;

        row.innerHTML = html;

        tableBody.appendChild(row);

    });

    if (emptyState) {
        emptyState.style.display =
            visibleCount === 0 ? "flex" : "none";
    }

    if (recordCountElement) {
        recordCountElement.textContent =
            `${visibleCount} member${visibleCount === 1 ? "" : "s"}`;
    }

    calc();

}


/* =========================================================
   CALCULATE TOTALS
========================================================= */

function calc() {

    const grandTotal = db.reduce((sum, member) => {

        return sum + MONTHS.reduce((monthTotal, month) => {

            return monthTotal +
                Number(member.c?.[month] || 0);

        }, 0);

    }, 0);

    if (grandTotalElement) {
        grandTotalElement.textContent = money(grandTotal);
    }

    if (memberCountElement) {
        memberCountElement.textContent = db.length;
    }

}


/* =========================================================
   MARK DIRTY
========================================================= */

function markDirty() {

    dirty = true;

    setStatus(
        `Unsaved changes • ${currentYear}`,
        "dirty"
    );

}


/* =========================================================
   UPDATE CONTRIBUTION
========================================================= */

function updateInput(input) {

    const index = Number(input.dataset.index);

    const month = input.dataset.month;

    if (
        !db[index] ||
        !MONTHS.includes(month)
    ) {
        return;
    }

    let value = Number(input.value);

    if (!Number.isFinite(value) || value < 0) {
        value = 0;
    }

    value = Math.round(value * 100) / 100;

    db[index].c[month] = value;

    input.value = value.toFixed(2);

    input.classList.toggle(
        "zero",
        value === 0
    );

    const row = input.closest("tr");

    if (row) {

        const total = MONTHS.reduce((sum, mon) => {

            return sum +
                Number(db[index].c[mon] || 0);

        }, 0);

        const totalElement =
            row.querySelector(".memberTotal");

        if (totalElement) {
            totalElement.textContent = money(total);
        }

    }

    calc();

    markDirty();

}


/* =========================================================
   ADD MEMBER
========================================================= */

function openAddMemberPanel() {

    if (!memberPanel || !memberNameInput) return;

    memberPanel.style.display = "block";

    memberNameInput.focus();

}


function closeAddMemberPanel() {

    if (!memberPanel || !memberNameInput) return;

    memberPanel.style.display = "none";

    memberNameInput.value = "";

}


function addMember() {

    if (!memberNameInput) return;

    const name = memberNameInput.value
        .trim()
        .replace(/\s+/g, " ")
        .toUpperCase();

    if (!name) {

        alert("Please enter the member's name.");

        return;

    }

    if (db.some(member => member.name === name)) {

        alert("This member already exists.");

        return;

    }

    const contributions = {};

    MONTHS.forEach(month => {
        contributions[month] = 0;
    });

    db.push({
        name,
        c: contributions
    });

    db = normalize(db);

    closeAddMemberPanel();

    render();

    markDirty();

}


/* =========================================================
   DELETE MEMBER
========================================================= */

function removeMember(index) {

    if (!db[index]) return;

    memberToDelete = index;

    if (deleteMemberName) {
        deleteMemberName.textContent =
            db[index].name;
    }

    if (deleteModal) {
        deleteModal.style.display = "flex";
    }

}


function closeDeleteModal() {

    if (deleteModal) {
        deleteModal.style.display = "none";
    }

    memberToDelete = null;

}


function confirmDeleteMember() {

    if (memberToDelete === null) {

        closeDeleteModal();

        return;

    }

    db.splice(memberToDelete, 1);

    closeDeleteModal();

    render();

    markDirty();

}


/* =========================================================
   SAVE MODAL
========================================================= */

function saveAllEntries() {

    if (saveModal) {
        saveModal.style.display = "flex";
    }

}


function closeSaveModal() {

    if (saveModal) {
        saveModal.style.display = "none";
    }

}


async function confirmSaveAllEntries() {

    closeSaveModal();

    await saveDatabase(true);

}


/* =========================================================
   PASSWORD VISIBILITY
========================================================= */

function togglePassword() {

    if (!passwordInput) return;

    const isPassword =
        passwordInput.type === "password";

    passwordInput.type =
        isPassword ? "text" : "password";

    if (togglePasswordBtn) {

        togglePasswordBtn.innerHTML =
            isPassword
                ? '<i class="fa-solid fa-eye"></i>'
                : '<i class="fa-solid fa-eye-slash"></i>';

    }

}


/* =========================================================
   LOGIN
========================================================= */

async function doLogin() {

    if (!usernameInput || !passwordInput) return;

    clearError();

    const username = usernameInput.value.trim();

    const password = passwordInput.value;

    if (!username || !password) {

        showError(
            "Please enter username and password."
        );

        return;

    }

    if (loginButton) {
        loginButton.disabled = true;
    }

    showLoader("Connecting to database...");

    try {

        const result = await apiFetch("/api/login", {
            method: "POST",
            body: JSON.stringify({ username, password })
        });

        if (!result.token) {
            throw new Error("Login token was not returned by the server.");
        }

        sessionStorage.setItem(TOKEN_KEY, result.token);

        if (rememberMe && rememberMe.checked) {

            localStorage.setItem(
                USER_KEY,
                username
            );

        } else {

            localStorage.removeItem(USER_KEY);

        }

        showDashboard();

        await loadYear(currentYear);

    } catch (error) {

        console.error("Login error:", error);

        showError(
            "Unable to connect to the database."
        );

        passwordInput.value = "";

        passwordInput.focus();

    } finally {

        hideLoader();

        if (loginButton) {
            loginButton.disabled = false;
        }

    }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    const token = sessionStorage.getItem(TOKEN_KEY);

    try {
        if (token) {
            await apiFetch("/api/logout", { method: "POST" });
        }
    } catch (error) {
        console.warn("Logout request failed:", error);
    }

    sessionStorage.removeItem(TOKEN_KEY);

    showLogin();

    if (passwordInput) {
        passwordInput.value = "";
    }

    clearError();

}


/* =========================================================
   CHECK AUTH
========================================================= */

async function checkAuth() {

    const token =
        sessionStorage.getItem(TOKEN_KEY);

    if (!token) {

        showLogin();

        const remembered =
            localStorage.getItem(USER_KEY);

        if (remembered && usernameInput && rememberMe) {

            usernameInput.value = remembered;

            rememberMe.checked = true;

        }

        return;

    }

    showDashboard();

    await loadYear(currentYear);

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

if (loginForm) {

    loginForm.addEventListener("submit", event => {

        event.preventDefault();

        doLogin();

    });

}


if (togglePasswordBtn) {

    togglePasswordBtn.addEventListener(
        "click",
        togglePassword
    );

}


if (tableBody) {

    tableBody.addEventListener("input", event => {

        const input =
            event.target.closest("input[data-index]");

        if (input) {
            updateInput(input);
        }

    });

    tableBody.addEventListener("blur", event => {

        const input =
            event.target.closest("input[data-index]");

        if (input) {

            const value = Number(input.value);

            input.value =
                Number.isFinite(value) && value >= 0
                    ? value.toFixed(2)
                    : "0.00";

        }

    }, true);


    tableBody.addEventListener("click", event => {

        const button =
            event.target.closest("[data-delete-index]");

        if (!button) return;

        removeMember(
            Number(button.dataset.deleteIndex)
        );

    });

}


if (yearSelect) {

    yearSelect.addEventListener("change", async () => {

        if (
            dirty &&
            !confirm(
                "You have unsaved changes. Switch year and discard them?"
            )
        ) {

            yearSelect.value = currentYear;

            return;

        }

        await loadYear(yearSelect.value);

    });

}


if (searchInput) {

    searchInput.addEventListener("input", render);

}


if (openAddBtn) {

    openAddBtn.addEventListener(
        "click",
        openAddMemberPanel
    );

}


if (closeAddBtn) {

    closeAddBtn.addEventListener(
        "click",
        closeAddMemberPanel
    );

}


if (addMemberBtn) {

    addMemberBtn.addEventListener(
        "click",
        addMember
    );

}


if (memberNameInput) {

    memberNameInput.addEventListener("keydown", event => {

        if (event.key === "Enter") {
            addMember();
        }

    });

}


if (saveAllBtn) {

    saveAllBtn.addEventListener(
        "click",
        saveAllEntries
    );

}


if (closeSaveBtn) {

    closeSaveBtn.addEventListener(
        "click",
        closeSaveModal
    );

}


if (confirmSaveBtn) {

    confirmSaveBtn.addEventListener(
        "click",
        confirmSaveAllEntries
    );

}


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        logout
    );

}


if (closeDeleteBtn) {

    closeDeleteBtn.addEventListener(
        "click",
        closeDeleteModal
    );

}


if (confirmDeleteBtn) {

    confirmDeleteBtn.addEventListener(
        "click",
        confirmDeleteMember
    );

}


if (deleteModal) {

    deleteModal.addEventListener("click", event => {

        if (event.target === event.currentTarget) {
            closeDeleteModal();
        }

    });

}


if (saveModal) {

    saveModal.addEventListener("click", event => {

        if (event.target === event.currentTarget) {
            closeSaveModal();
        }

    });

}


window.addEventListener("beforeunload", event => {

    if (dirty) {

        event.preventDefault();

        event.returnValue = "";

    }

});


/* =========================================================
   START APPLICATION
========================================================= */

checkAuth();