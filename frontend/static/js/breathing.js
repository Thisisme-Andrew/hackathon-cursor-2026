document.addEventListener("DOMContentLoaded", () => {
    const circle = document.getElementById("breathing-circle");
    const phaseLabel = document.getElementById("breathing-phase-label");
    const countdownEl = document.getElementById("breathing-countdown");
    const startBtn = document.getElementById("breathing-start");
    const pauseBtn = document.getElementById("breathing-pause");
    const finishLink = document.getElementById("breathing-finish");

    const INHALE_SEC = 4;
    const HOLD_SEC = 4;
    const EXHALE_SEC = 6;

    let state = "idle";
    let phaseTimer = null;
    let countdownTimer = null;
    let secondsLeft = 0;

    function setPhase(phase) {
        if (!circle) return;
        circle.classList.remove("phase-inhale", "phase-hold", "phase-exhale", "phase-idle");
        circle.classList.add("phase-" + phase);
    }

    function setLabel(text) {
        if (phaseLabel) phaseLabel.textContent = text;
    }

    function setCountdown(n) {
        secondsLeft = n;
        if (countdownEl) countdownEl.textContent = n > 0 ? n + "s" : "";
    }

    function tickCountdown() {
        if (secondsLeft <= 0) return;
        setCountdown(secondsLeft - 1);
        countdownTimer = setTimeout(tickCountdown, 1000);
    }

    function runPhase(phase) {
        if (phase === "inhale") {
            setPhase("inhale");
            setLabel("Breathe in");
            setCountdown(INHALE_SEC);
            tickCountdown();
            phaseTimer = setTimeout(() => runPhase("hold"), INHALE_SEC * 1000);
        } else if (phase === "hold") {
            setPhase("hold");
            setLabel("Hold");
            setCountdown(HOLD_SEC);
            tickCountdown();
            phaseTimer = setTimeout(() => runPhase("exhale"), HOLD_SEC * 1000);
        } else if (phase === "exhale") {
            setPhase("exhale");
            setLabel("Breathe out");
            setCountdown(EXHALE_SEC);
            tickCountdown();
            phaseTimer = setTimeout(() => runPhase("inhale"), EXHALE_SEC * 1000);
        }
    }

    function stop() {
        if (phaseTimer) {
            clearTimeout(phaseTimer);
            phaseTimer = null;
        }
        if (countdownTimer) {
            clearTimeout(countdownTimer);
            countdownTimer = null;
        }
        state = "idle";
        setPhase("idle");
        setLabel("Breathe in");
        setCountdown(0);
        if (startBtn) {
            startBtn.classList.remove("hidden");
            startBtn.textContent = "Start";
        }
        if (pauseBtn) {
            pauseBtn.classList.add("hidden");
            pauseBtn.textContent = "Pause";
        }
    }

    function pause() {
        if (state !== "running") return;
        if (phaseTimer) {
            clearTimeout(phaseTimer);
            phaseTimer = null;
        }
        if (countdownTimer) {
            clearTimeout(countdownTimer);
            countdownTimer = null;
        }
        state = "paused";
        if (pauseBtn) {
            pauseBtn.textContent = "Resume";
        }
    }

    function resume() {
        if (state !== "paused") return;
        state = "running";
        const label = phaseLabel ? phaseLabel.textContent : "";
        if (label === "Breathe in") runPhase("inhale");
        else if (label === "Hold") runPhase("hold");
        else if (label === "Breathe out") runPhase("exhale");
        if (pauseBtn) pauseBtn.textContent = "Pause";
    }

    if (startBtn) {
        startBtn.addEventListener("click", () => {
            if (state === "running" || state === "paused") return;
            state = "running";
            startBtn.classList.add("hidden");
            if (pauseBtn) pauseBtn.classList.remove("hidden");
            runPhase("inhale");
        });
    }

    if (pauseBtn) {
        pauseBtn.addEventListener("click", () => {
            if (state === "paused") {
                resume();
            } else if (state === "running") {
                pause();
            }
        });
    }

    setPhase("idle");
    setLabel("Breathe in");
});
