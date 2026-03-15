document.addEventListener("DOMContentLoaded", () => {
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
});
