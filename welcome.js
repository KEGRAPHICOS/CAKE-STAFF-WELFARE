"use strict";


/* =========================================================
   CAKE STAFF WELFARE
   WELCOME PAGE SCRIPT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {


    /* =====================================================
       GET HTML ELEMENTS
    ====================================================== */

    const enterBtn =
        document.getElementById("enterBtn");

    const landingContainer =
        document.getElementById("landingContainer");

    const reportsLoader =
        document.getElementById("reportsLoader");

    const reportsLoaderText =
        document.getElementById("reportsLoaderText");


    /* =====================================================
       CHECK REQUIRED ELEMENTS
    ====================================================== */

    if (
        !enterBtn ||
        !landingContainer ||
        !reportsLoader
    ) {

        console.error(
            "Required welcome page elements were not found."
        );

        return;

    }


    /* =====================================================
       VIEW REPORTS
    ====================================================== */

    enterBtn.addEventListener("click", () => {


        /* -------------------------------------------------
           PREVENT MULTIPLE CLICKS
        ------------------------------------------------- */

        enterBtn.disabled = true;


        /* -------------------------------------------------
           START WELCOME PAGE EXIT ANIMATION
        ------------------------------------------------- */

        landingContainer.classList.add(
            "slide-out"
        );


        /* -------------------------------------------------
           WAIT FOR EXIT ANIMATION
        ------------------------------------------------- */

        setTimeout(() => {


            /* Hide welcome page */

            landingContainer.style.display =
                "none";


            /* -------------------------------------------------
               SHOW LOADING SCREEN
            ------------------------------------------------- */

            reportsLoader.classList.add(
                "active"
            );

            reportsLoader.setAttribute(
                "aria-hidden",
                "false"
            );


            /* -------------------------------------------------
               FIRST MESSAGE
            ------------------------------------------------- */

            if (reportsLoaderText) {

                reportsLoaderText.textContent =
                    "Connecting to reports...";

            }


            /* -------------------------------------------------
               SECOND MESSAGE
            ------------------------------------------------- */

            setTimeout(() => {

                if (reportsLoaderText) {

                    reportsLoaderText.textContent =
                        "Loading contribution records...";

                }

            }, 1000);


            /* -------------------------------------------------
               THIRD MESSAGE
            ------------------------------------------------- */

            setTimeout(() => {

                if (reportsLoaderText) {

                    reportsLoaderText.textContent =
                        "Preparing dashboard...";

                }

            }, 2000);


            /* -------------------------------------------------
               OPEN 2026 PAGE AFTER 3 SECONDS
            ------------------------------------------------- */

            setTimeout(() => {

                window.location.href =
                    "2026.html";

            }, 3000);


        }, 450);


    });

});