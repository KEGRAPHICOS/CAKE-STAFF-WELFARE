
(() => {
    /* ========================================
       DEPARTMENT MEMBER LISTS
    ======================================== */

    const departments = {
        "PRODUCTION DEPARTMENT": [
            "AMUZU PETER",
            "BONNAH KENNETH",
            "DANIEL DZIWORNU",
            "DANIEL DARKO",
            "ELLIOT KLUTSE",
            "EMMANUEL NSOR",
            "JOHN NKETIA",
            "JOSEPH ARTHUR",
            "KEN KELVIN ROCKSON",
            "KINGSFORD SAVOR MENSAH",
            "KINGSLEY ANYASU",
            "OBED ASSAN",
            "OSUMAN SALIFU FIANU",
            "PETER BOAKYE",
            "RICHARD ADOMEY",
            "SAMUEL ADADE",
            "SAMUEL AMPOFO",
            "SEWU TANKO LOMOTEY",
            "WILLIAM TETTEH",
            "VIEKU PATRICK"
        ],

        "TECHNICAL DEPARTMENT": [
            "AKLI GERSHON",
            "JUSTICE KOOMSON",
            "ROBERT NII KOTEI",
            "SOLOMON ADDO"
        ],

        "QUALITY DEPARTMENT": [
            "ADJEI CHRISTIAN",
            "ISAAC MENSAH",
            "MAKAFUI SAKRE",
            "ROBERT KWATENG"
        ]
    };


    /* ========================================
       HELPER FUNCTIONS
    ======================================== */

    // Format contribution amounts in Ghana cedis.
    const money = (amount) => {
        return `GHS ${Number(amount || 0).toFixed(2)}`;
    };

    // Prevent HTML characters in names from being interpreted as markup.
    const escapeHTML = (value) => {
        return String(value).replace(/[&<>"']/g, (character) => {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[character];
        });
    };


    /* ========================================
       PAGE ELEMENTS
    ======================================== */

    const yearSelect = document.getElementById("yearSelect");
    const container = document.getElementById("departmentTables");
    const status = document.getElementById("departmentStatus");
    const searchInput = document.getElementById("departmentSearch");

    const grandContribution = document.getElementById("grandContribution");
    const grandMembers = document.getElementById("grandMembers");
    const summaryYear = document.getElementById("summaryYear");
    const summaryYear2 = document.getElementById("summaryYear2");


    /* ========================================
       SEARCH DEPARTMENT TABLES
    ======================================== */

    function filterTables() {
        if (!searchInput || !container) {
            return;
        }

        const searchText = searchInput.value
            .trim()
            .toLowerCase();

        const panels = container.querySelectorAll(".department-panel");

        panels.forEach((panel) => {
            const rows = panel.querySelectorAll("tbody tr");
            let visibleMembers = 0;
            let visibleTotal = 0;

            rows.forEach((row) => {
                const nameCell = row.querySelector("td.member-name");
                const amountCell = row.querySelector("td.amount");

                if (!nameCell || !amountCell) {
                    return;
                }

                const memberName = nameCell.textContent
                    .trim()
                    .toLowerCase();

                const matches = memberName.includes(searchText);

                row.style.display = matches ? "" : "none";

                if (matches) {
                    visibleMembers++;

                    const amountText = amountCell.textContent
                        .replace(/GHS/gi, "")
                        .replace(/,/g, "")
                        .trim();

                    visibleTotal += Number(amountText) || 0;
                }
            });

            // Show only departments with matching members.
            panel.style.display = visibleMembers > 0 ? "" : "none";

            // Update the department member count while searching.
            const stats = panel.querySelectorAll(".department-stat strong");

            if (stats[0]) {
                stats[0].textContent = searchText
                    ? visibleMembers
                    : rows.length;
            }

            // Update the department contribution total while searching.
            if (stats[1]) {
                stats[1].textContent = money(visibleTotal);
            }

            // Update the footer total for the visible members.
            const footerTotal = panel.querySelector("tfoot td.amount");

            if (footerTotal) {
                footerTotal.textContent = money(visibleTotal);
            }
        });

        // Display a message when no member matches.
        let noResults = container.querySelector(".search-no-results");

        const hasVisiblePanel = Array.from(panels).some(
            (panel) => panel.style.display !== "none"
        );

        if (!hasVisiblePanel && searchText) {
            if (!noResults) {
                noResults = document.createElement("div");
                noResults.className = "department-panel search-no-results";
                noResults.textContent = "No members found matching your search.";
                container.prepend(noResults);
            }
        } else if (noResults) {
            noResults.remove();
        }

        // Keep the overall summary accurate for the current search.
        if (searchText) {
            let searchTotal = 0;
            let searchCount = 0;

            panels.forEach((panel) => {
                if (panel.style.display === "none") {
                    return;
                }

                panel.querySelectorAll("tbody tr").forEach((row) => {
                    if (row.style.display === "none") {
                        return;
                    }

                    const amountCell = row.querySelector("td.amount");

                    if (amountCell) {
                        const amountText = amountCell.textContent
                            .replace(/GHS/gi, "")
                            .replace(/,/g, "")
                            .trim();

                        searchTotal += Number(amountText) || 0;
                        searchCount++;
                    }
                });
            });

            if (grandContribution) {
                grandContribution.textContent = money(searchTotal);
            }

            if (grandMembers) {
                grandMembers.textContent = searchCount;
            }

            if (status) {
                status.textContent =
                    `Search results • ${yearSelect.value} • ${searchCount} member(s) found`;
            }
        } else {
            // Re-render the original totals when the search is cleared.
            renderSummaryOnly();
        }
    }


    /* ========================================
       RESTORE ORIGINAL SUMMARY
    ======================================== */

    function renderSummaryOnly() {
        const year = yearSelect.value;
        const records = window.CAKE_SEED_DATA?.[year];

        if (!Array.isArray(records)) {
            return;
        }

        const byName = new Map(
            records.map((member) => [
                String(member.name).trim().toUpperCase(),
                member
            ])
        );

        let total = 0;
        let count = 0;

        Object.values(departments).forEach((names) => {
            names.forEach((name) => {
                const record = byName.get(name);

                if (record) {
                    total += Object.values(record.c || {}).reduce(
                        (sum, value) => sum + (Number(value) || 0),
                        0
                    );
                }

                count++;
            });
        });

        if (grandContribution) {
            grandContribution.textContent = money(total);
        }

        if (grandMembers) {
            grandMembers.textContent = count;
        }

        if (status) {
            status.textContent =
                `Records • ${year} • Total Contributions Per Department`;

            status.className = "data-status online";
        }
    }


    /* ========================================
       RENDER DEPARTMENT TABLES
    ======================================== */

    function render() {
        const year = yearSelect.value;
        const records = window.CAKE_SEED_DATA?.[year];

        if (summaryYear) {
            summaryYear.textContent = year;
        }

        if (summaryYear2) {
            summaryYear2.textContent = year;
        }

        // Clear previous tables if no records exist for this year.
        if (!Array.isArray(records)) {
            container.innerHTML = `
                <div class="department-panel department-empty">
                    No contribution data found for this year.
                </div>
            `;

            if (status) {
                status.textContent = `No records available for ${year}.`;
            }

            if (grandContribution) {
                grandContribution.textContent = money(0);
            }

            if (grandMembers) {
                grandMembers.textContent = 0;
            }

            return;
        }

        // Match contribution records to members by name.
        const byName = new Map(
            records.map((member) => [
                String(member.name).trim().toUpperCase(),
                member
            ])
        );

        let grandTotal = 0;
        let totalMembers = 0;

        // Create a table for each department.
        container.innerHTML = Object.entries(departments)
            .map(([department, names]) => {
                const members = names.map((name) => {
                    const record = byName.get(name);

                    const total = record
                        ? Object.values(record.c || {}).reduce(
                            (sum, value) => sum + (Number(value) || 0),
                            0
                        )
                        : 0;

                    return {
                        name,
                        total,
                        found: Boolean(record)
                    };
                });

                const departmentTotal = members.reduce(
                    (sum, member) => sum + member.total,
                    0
                );

                grandTotal += departmentTotal;
                totalMembers += members.length;

                return `
                    <section class="department-panel">

                        <div class="department-panel-header">
                            <div>
                                <h2>${escapeHTML(department)}</h2>
                                <p>Contribution summary</p>
                            </div>

                            <div class="department-stats">
                                <div class="department-stat">
                                    TOTAL MEMBERS
                                    <strong>${members.length}</strong>
                                </div>

                                <div class="department-stat">
                                    TOTAL CONTRIBUTION
                                    <strong>${money(departmentTotal)}</strong>
                                </div>
                            </div>
                        </div>

                        <div class="department-table-wrap">
                            <table class="department-table">
                                <thead>
                                    <tr>
                                        <th>Member name</th>
                                        <th class="amount">
                                            Contribution total (${year})
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    ${members.map((member) => `
                                        <tr>
                                            <td class="member-name">
                                                ${escapeHTML(member.name)}
                                                ${member.found
                                                    ? ""
                                                    : ' <span class="missing-record">(no record for this year)</span>'
                                                }
                                            </td>

                                            <td class="amount">
                                                ${money(member.total)}
                                            </td>
                                        </tr>
                                    `).join("")}
                                </tbody>

                                <tfoot>
                                    <tr>
                                        <td>Department total</td>
                                        <td class="amount">
                                            ${money(departmentTotal)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                    </section>
                `;
            })
            .join("");

        if (grandContribution) {
            grandContribution.textContent = money(grandTotal);
        }

        if (grandMembers) {
            grandMembers.textContent = totalMembers;
        }

        if (status) {
            status.textContent =
                `Records • ${year} • Total Contributions Per Department`;

            status.className = "data-status online";
        }

        // Reapply the search after changing years.
        filterTables();
    }


    /* ========================================
       YEAR SELECTOR AND SEARCH INPUT
    ======================================== */

    if (yearSelect) {
        yearSelect.addEventListener("change", render);
    }

    if (searchInput) {
        searchInput.addEventListener("input", filterTables);
    }


    /* ========================================
       NAVIGATION MENU
    ======================================== */

    const menuIcon = document.getElementById("menuIcon");
    const menuLinks = document.getElementById("menuLinks");

    if (menuIcon && menuLinks) {
        menuIcon.addEventListener("click", (event) => {
            event.stopPropagation();

            const isOpen = menuLinks.classList.toggle("show");

            menuIcon.setAttribute(
                "aria-expanded",
                isOpen ? "true" : "false"
            );
        });

        document.addEventListener("click", (event) => {
            if (
                !menuIcon.contains(event.target) &&
                !menuLinks.contains(event.target)
            ) {
                menuLinks.classList.remove("show");

                menuIcon.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
        });
    }


    /* ========================================
       INITIALIZE DEPARTMENT PAGE
    ======================================== */

    render();

})();
