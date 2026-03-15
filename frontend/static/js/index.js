document.addEventListener("DOMContentLoaded", async () => {
    const orbWrap = document.getElementById("orb-wrap");
    const orbButton = document.getElementById("orb-button");
    const teamDialog = document.getElementById("team-dialog");
    const openTeam = document.getElementById("open-team");

    if (orbWrap && orbButton) {
        orbButton.addEventListener("click", () => {
            orbWrap.classList.remove("ripple-boost");
            void orbWrap.offsetWidth;
            orbWrap.classList.add("ripple-boost");
        });
    }

    if (teamDialog && openTeam) {
        openTeam.addEventListener("click", () => teamDialog.showModal());
    }

    const user = await getCurrentUser();
    const ctaContainer = document.querySelector(".mx-auto.flex.w-full.max-w-sm.flex-col.gap-5");
    if (user && ctaContainer) {
        const dashboardLink = document.createElement("a");
        dashboardLink.href = "/dashboard";
        dashboardLink.className = "btn h-14 rounded-full border-none bg-[#7ccfa9] text-lg font-bold text-white hover:bg-[#6bbf99]";
        dashboardLink.textContent = "Go to Dashboard";
        ctaContainer.insertBefore(dashboardLink, ctaContainer.firstChild);
    }
});
