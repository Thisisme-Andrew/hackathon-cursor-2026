document.addEventListener("DOMContentLoaded", () => {
    const seedNode = document.getElementById("demo-seed");
    const seed = seedNode ? JSON.parse(seedNode.textContent) : {
        calmQuestions: ["What's on your mind today?"],
        urgentQuestions: ["What needs attention first?"],
        voiceSamples: { calm: "", urgent: "" },
        steps: 4,
    };

    const isSessionMode = document.body.dataset.sessionMode === "1";
    const userId = seed.user?.id || seed.user?.email || "demo-user-123";
    const boardHref = document.body.dataset.boardHref || "/dashboard";
    const API_BASE = "/tasks";

    async function postTask(body) {
        const res = await fetch(`${API_BASE}/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    }

    const body = document.body;
    const modeIcon = document.getElementById("mode-icon");
    const modeText = document.getElementById("mode-text");
    const modeToggle = document.getElementById("mode-toggle");
    const questionText = document.getElementById("question-text");
    const changeQuestionBtn = document.getElementById("change-question");
    const interactionStage = document.getElementById("interaction-stage");
    const stepLabel = document.getElementById("step-label");
    const progressBar = document.querySelector(".top-progress > span");

    const orb = document.getElementById("orb");
    const orbStatus = document.getElementById("orb-status");

    const modeVoiceBtn = document.getElementById("mode-voice");
    const modeTypeBtn = document.getElementById("mode-type");
    const voiceView = document.getElementById("voice-view");
    const typeView = document.getElementById("type-view");

    const tapSpeakBtn = document.getElementById("tap-speak");
    const recordingStrip = document.getElementById("recording-strip");
    const muteRecordBtn = document.getElementById("mute-record");
    const recordTimer = document.getElementById("record-timer");
    const stopRecordBtn = document.getElementById("stop-record");
    const liveTranscriptWrap = document.getElementById("live-transcript-wrap");
    const liveTranscript = document.getElementById("live-transcript");
    const voiceReview = document.getElementById("voice-review");
    const rerecordBtn = document.getElementById("rerecord");
    const voiceOutput = document.getElementById("voice-output");
    const voiceConfirmBtn = document.getElementById("voice-confirm");

    const typedInput = document.getElementById("typed-input");
    const typeSubmitBtn = document.getElementById("type-submit");
    const demoNote = document.getElementById("demo-note");

    const calmQuestions = Array.isArray(seed.calmQuestions) ? seed.calmQuestions : [];
    const urgentQuestions = Array.isArray(seed.urgentQuestions) ? seed.urgentQuestions : [];
    const demoVoiceResponses = seed.voiceSamples || { calm: "", urgent: "" };
    const totalSteps = Number(seed.steps) > 0 ? Number(seed.steps) : 4;

    let questionIndex = 0;
    let activeQuestionSet = calmQuestions;
    let selectedInputMode = "voice";
    let questionTypingTimer = null;
    let reviewTypingTimer = null;
    let transcriptInterval = null;
    let recordInterval = null;
    let recordSecondsLeft = 30;
    let currentStep = 1;
    let muted = false;
    let resultTasksForSave = [];

    function updateStepUi() {
        stepLabel.textContent = `${currentStep} / ${totalSteps}`;
        progressBar.style.width = `${(currentStep / totalSteps) * 100}%`;
    }

    function updateOrbState(state) {
        orb.classList.remove("speaking", "listening", "ready");
        if (state === "listening") {
            orb.classList.add("listening");
            orbStatus.innerHTML = '<span class="status-dot inline-block h-2 w-2 rounded-full bg-[var(--accent)] align-middle"></span><span class="ml-2 align-middle">LISTENING</span>';
            return;
        }
        if (state === "ready") {
            orb.classList.add("ready");
            orbStatus.innerHTML = '<span class="status-dot inline-block h-2 w-2 rounded-full bg-[var(--accent)] align-middle"></span><span class="ml-2 align-middle">READY</span>';
            return;
        }
        orb.classList.add("speaking");
        orbStatus.innerHTML = '<span class="status-dot inline-block h-2 w-2 rounded-full bg-[var(--accent)] align-middle"></span><span class="ml-2 align-middle">SPEAKING</span>';
    }

    function clearTypingTimers() {
        if (questionTypingTimer) {
            clearTimeout(questionTypingTimer);
            questionTypingTimer = null;
        }
        if (reviewTypingTimer) {
            clearTimeout(reviewTypingTimer);
            reviewTypingTimer = null;
        }
    }

    function typeIntoElement(element, fullText, speed, done) {
        clearTypingTimers();
        element.textContent = "";
        element.classList.add("typing-cursor");
        let i = 0;

        const tick = () => {
            element.textContent = fullText.slice(0, i);
            i += 1;
            if (i <= fullText.length) {
                const delay = Math.max(12, speed + Math.floor(Math.random() * 12) - 6);
                questionTypingTimer = setTimeout(tick, delay);
            } else {
                element.classList.remove("typing-cursor");
                if (done) {
                    done();
                }
            }
        };

        tick();
    }

    function typeIntoTextarea(textarea, fullText, speed, done) {
        clearTypingTimers();
        textarea.value = "";
        let i = 0;

        const tick = () => {
            textarea.value = fullText.slice(0, i);
            i += 1;
            if (i <= fullText.length) {
                const delay = Math.max(10, speed + Math.floor(Math.random() * 10) - 5);
                reviewTypingTimer = setTimeout(tick, delay);
            } else if (done) {
                done();
            }
        };

        tick();
    }

    function resetRecordingUi() {
        if (transcriptInterval) {
            clearInterval(transcriptInterval);
            transcriptInterval = null;
        }
        if (recordInterval) {
            clearInterval(recordInterval);
            recordInterval = null;
        }
        muted = false;
        muteRecordBtn.textContent = "Mute";
        recordSecondsLeft = 30;
        recordTimer.textContent = "30s";
        recordingStrip.classList.add("hidden");
        liveTranscriptWrap.classList.add("hidden");
        liveTranscript.textContent = "";
    }

    function setQuestion(index) {
        questionIndex = index % Math.max(activeQuestionSet.length, 1);
        changeQuestionBtn.classList.add("hidden");
        interactionStage.classList.add("is-loading");
        typeIntoElement(questionText, activeQuestionSet[questionIndex], 34, () => {
            interactionStage.classList.remove("is-loading");
            changeQuestionBtn.classList.remove("hidden");
        });
        resetRecordingUi();
        voiceReview.classList.add("hidden");
        tapSpeakBtn.classList.remove("hidden");
        typedInput.value = "";
        voiceOutput.value = "";
        demoNote.textContent = "";
        updateOrbState("speaking");
    }

    function cycleQuestion() {
        setQuestion((questionIndex + 1) % activeQuestionSet.length);
    }

    function moveToNextQuestion() {
        if (currentStep < totalSteps) {
            currentStep += 1;
            updateStepUi();
            cycleQuestion();
        } else {
            showResults();
        }
    }

    // ---- Results screen data & logic ----

    const DEMO_THEMES = ["Project Deadline", "Procrastination", "Manager Comms", "Mental Load"];

    const DEMO_TASKS = [
        { name: "Open project document — write one sentence", dur: "~5 min",  cat: "Work",   prio: "LOW" },
        { name: "Reply to manager's email",                   dur: "~5 min",  cat: "Work",   prio: "LOW" },
        { name: "Set a 25-minute Pomodoro timer",             dur: "~1 min",  cat: "Work",   prio: "LOW" },
        { name: "Write section outline (bullet points only)", dur: "~20 min", cat: "Work",   prio: "LOW" },
        { name: "Drink water & take a 5-min walk",            dur: "~10 min", cat: "Health", prio: "LOW" },
        { name: "Deep work block: draft first full section",  dur: "~25 min", cat: "Work",   prio: "LOW" },
    ];

    const CAT_STYLE = {
        Work:         "background:#f2eced;color:#7f5b63",
        Health:       "background:#f0f7e8;color:#5a8a3a",
        Finance:      "background:#fef7e6;color:#9a7a20",
        Relationships:"background:#f0f0fa;color:#6060b0",
    };

    const PRIO_STYLE = {
        LOW:  "background:#f0f2f5;color:#8799b4",
        MED:  "background:#fdf6e8;color:#a08030",
        HIGH: "background:#fdf0ee;color:#c8604a",
    };

    window.toggleDate = function (i) {
        const el = document.getElementById("dt-" + i);
        if (el) {
            const hidden = el.style.display === "none" || !el.style.display;
            el.style.display = hidden ? "block" : "none";
        }
    };

    function showResults() {
        const isUrgent = body.classList.contains("mode-urgent");
        const resultTasks = isUrgent
            ? DEMO_TASKS.map((task) => ({ ...task, prio: "HIGH" }))
            : DEMO_TASKS;
        resultTasksForSave = resultTasks;

        // Populate theme chips
        const themeEl = document.getElementById("theme-chips");
        if (themeEl) {
            themeEl.innerHTML = DEMO_THEMES.map((t) =>
                `<span style="border-radius:9999px;padding:4px 12px;font-size:12px;font-weight:600;` +
                `background:color-mix(in srgb,var(--accent) 12%,white 88%);color:var(--accent);` +
                `border:1px solid color-mix(in srgb,var(--accent) 25%,white 75%)">${t}</span>`
            ).join("");
        }

        // Populate task list
        const taskEl = document.getElementById("task-list");
        if (taskEl) {
            taskEl.innerHTML = resultTasks.map((t, i) => {
                const cat  = CAT_STYLE[t.cat]  || CAT_STYLE.Work;
                const prio = PRIO_STYLE[t.prio] || PRIO_STYLE.LOW;
                const sep  = i > 0 ? "border-top:1px solid #f0f2f5;" : "";
                return (
                    `<li style="${sep}display:flex;align-items:flex-start;gap:8px;padding:12px 0">` +
                    `<span style="margin-top:6px;height:6px;width:6px;flex:none;border-radius:9999px;background:#334772"></span>` +
                    `<span style="flex:1;font-size:14px;font-weight:500;line-height:1.45;color:#2f426c">${t.name}</span>` +
                    `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;padding-top:2px;flex:none">` +
                    `<div style="display:flex;align-items:center;gap:5px">` +
                    `<span style="white-space:nowrap;font-size:10px;color:#8da0be">${t.dur}</span>` +
                    `<span style="border-radius:9999px;padding:2px 8px;font-size:10px;font-weight:600;${cat}">${t.cat}</span>` +
                    `<span style="border-radius:9999px;padding:2px 8px;font-size:10px;font-weight:700;${prio}">${t.prio}</span>` +
                    `<button style="font-size:13px;cursor:pointer;background:none;border:none;padding:0;line-height:1" onclick="toggleDate(${i})" title="Add due date">📅</button>` +
                    `</div>` +
                    `<input type="date" id="dt-${i}" style="display:none;font-size:11px;border-radius:8px;border:1px solid #dfebe7;background:#fff;padding:3px 8px;max-width:130px">` +
                    `</div></li>`
                );
            }).join("");
        }

        document.getElementById("results-screen").classList.remove("hidden");
        window.scrollTo(0, 0);
    }

    function applyTone(mode) {
        const isUrgent = mode === "urgent";
        body.classList.toggle("mode-urgent", isUrgent);
        modeIcon.textContent = isUrgent ? "\u26A1" : "\uD83C\uDF43";
        modeText.textContent = isUrgent ? "Urgent" : "Calm";
        activeQuestionSet = isUrgent ? urgentQuestions : calmQuestions;
        currentStep = 1;
        updateStepUi();
        setQuestion(0);
    }

    function setInputMode(mode) {
        selectedInputMode = mode;
        const useVoice = mode === "voice";

        modeVoiceBtn.classList.toggle("active", useVoice);
        modeTypeBtn.classList.toggle("active", !useVoice);

        voiceView.classList.toggle("hidden", !useVoice);
        typeView.classList.toggle("hidden", useVoice);
        demoNote.textContent = "";

        if (useVoice) {
            updateOrbState("speaking");
        } else {
            updateOrbState("ready");
        }
    }

    function finishRecording() {
        resetRecordingUi();
        voiceReview.classList.remove("hidden");
        tapSpeakBtn.classList.add("hidden");
        const responseText = demoVoiceResponses[body.classList.contains("mode-urgent") ? "urgent" : "calm"];
        typeIntoTextarea(voiceOutput, responseText, 14, () => updateOrbState("ready"));
    }

    function startRecording() {
        resetRecordingUi();
        voiceReview.classList.add("hidden");
        tapSpeakBtn.classList.add("hidden");
        recordingStrip.classList.remove("hidden");
        liveTranscriptWrap.classList.remove("hidden");
        updateOrbState("listening");

        const modeKey = body.classList.contains("mode-urgent") ? "urgent" : "calm";
        const targetTranscript = demoVoiceResponses[modeKey];
        let transcriptIdx = 0;

        transcriptInterval = setInterval(() => {
            if (muted) {
                return;
            }
            transcriptIdx += 2;
            liveTranscript.textContent = targetTranscript.slice(0, transcriptIdx);
            if (transcriptIdx >= targetTranscript.length) {
                finishRecording();
            }
        }, 80);

        recordInterval = setInterval(() => {
            recordSecondsLeft -= 1;
            recordTimer.textContent = `${recordSecondsLeft}s`;
            if (recordSecondsLeft <= 0) {
                finishRecording();
            }
        }, 1000);
    }

    modeToggle.addEventListener("click", () => {
        applyTone(body.classList.contains("mode-urgent") ? "calm" : "urgent");
    });

    changeQuestionBtn.addEventListener("click", cycleQuestion);

    modeVoiceBtn.addEventListener("click", () => setInputMode("voice"));
    modeTypeBtn.addEventListener("click", () => setInputMode("type"));

    tapSpeakBtn.addEventListener("click", startRecording);

    muteRecordBtn.addEventListener("click", () => {
        muted = !muted;
        muteRecordBtn.textContent = muted ? "Unmute" : "Mute";
    });

    stopRecordBtn.addEventListener("click", finishRecording);

    rerecordBtn.addEventListener("click", () => {
        resetRecordingUi();
        voiceReview.classList.add("hidden");
        tapSpeakBtn.classList.remove("hidden");
        voiceOutput.value = "";
        updateOrbState("speaking");
    });

    voiceConfirmBtn.addEventListener("click", () => {
        demoNote.textContent = "Saved for demo. Moving to next question...";
        setTimeout(moveToNextQuestion, 520);
    });

    typeSubmitBtn.addEventListener("click", () => {
        if (!typedInput.value.trim()) {
            typedInput.focus();
            return;
        }
        demoNote.textContent = "Submitted for demo. Moving to next question...";
        setTimeout(moveToNextQuestion, 520);
    });

    applyTone("calm");
    setInputMode("voice");
    updateStepUi();

    const openTeamBtn = document.getElementById("open-team");
    const teamDialog = document.getElementById("team-dialog");
    if (openTeamBtn && teamDialog) {
        openTeamBtn.addEventListener("click", () => teamDialog.showModal());
    }

    const saveToBoardBtn = document.getElementById("save-to-board-btn");
    if (isSessionMode && saveToBoardBtn) {
        saveToBoardBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            const originalText = saveToBoardBtn.textContent;
            saveToBoardBtn.textContent = "Saving…";
            saveToBoardBtn.style.pointerEvents = "none";

            try {
                for (let i = 0; i < resultTasksForSave.length; i++) {
                    const t = resultTasksForSave[i];
                    const dueInput = document.getElementById("dt-" + i);
                    const dueAt = dueInput?.value ? `${dueInput.value}T12:00:00Z` : undefined;
                    await postTask({
                        userId,
                        title: t.name,
                        category: t.cat,
                        priority: t.prio,
                        estimatedTimeToComplete: t.dur,
                        dueAt,
                    });
                }
                window.location.href = boardHref;
            } catch (err) {
                saveToBoardBtn.textContent = originalText;
                saveToBoardBtn.style.pointerEvents = "";
                saveToBoardBtn.insertAdjacentHTML(
                    "afterend",
                    `<p class="mt-2 text-sm text-red-600" id="save-error">Failed to save: ${err.message}</p>`
                );
                setTimeout(() => document.getElementById("save-error")?.remove(), 4000);
            }
        });
    }
});
