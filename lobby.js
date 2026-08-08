export function initLobby() {

    console.log("🏠 Lobby Loaded");

    const startBtn = document.getElementById("startBtn");

    if (startBtn) {

        startBtn.addEventListener("click", () => {

            window.location.href = "game.html";

        });

    }

}