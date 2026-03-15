document.addEventListener("DOMContentLoaded", async () => {
    const seedNode = document.getElementById("demo-seed");
    const seed = seedNode ? JSON.parse(seedNode.textContent) : {
        calmQuestions: ["What's on your mind today?"],
        urgentQuestions: ["What needs attention first?"],
        voiceSamples: { calm: "", urgent: "" },
        steps: 4,
    };

    const isSessionMode = document.body.dataset.sessionMode === "1";
    let userId = seed.user?.id || seed.user?.email || "demo-user-123";

    if (isSessionMode) {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            window.location.href = "/auth?mode=login&next=" + encodeURIComponent("/session");
            return;
        }
        userId = currentUser.userId;
    }

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
    let recordInterval = null;
    let recordSecondsLeft = 30;
    let currentStep = 1;
    let muted = false;
    let resultTasksForSave = [];

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let fullTranscript = "";
    let combinedTranscript = "";
    let lastStepTranscript = "";

    const speechSynthesisApi = window.speechSynthesis || null;
    let availableVoices = [];
    let currentTtsAudio = null;
    let currentTtsAudioUrl = "";
    let currentTtsRequest = null;

    function cacheVoices() {
        if (!speechSynthesisApi) {
            return;
        }
        availableVoices = speechSynthesisApi.getVoices() || [];
    }

    function pickQuestionVoice() {
        if (!availableVoices.length) {
            return null;
        }

        const preferredNames = [
            "Natural",
            "Neural",
            "Ava",
            "Jenny",
            "Microsoft Aria",
            "Google US English",
            "Samantha",
            "Karen",
            "Zira",
        ];

        const preferred = availableVoices.find((voice) =>
            preferredNames.some((name) => voice.name.includes(name)),
        );
        if (preferred) {
            return preferred;
        }

        return (
            availableVoices.find((voice) => voice.lang === "en-US") ||
            availableVoices.find((voice) => voice.lang?.startsWith("en")) ||
            null
        );
    }

    function stopQuestionVoiceover() {
        if (currentTtsRequest) {
            currentTtsRequest.abort();
            currentTtsRequest = null;
        }

        if (currentTtsAudio) {
            currentTtsAudio.pause();
            currentTtsAudio.currentTime = 0;
            currentTtsAudio = null;
        }

        if (currentTtsAudioUrl) {
            URL.revokeObjectURL(currentTtsAudioUrl);
            currentTtsAudioUrl = "";
        }

        if (!speechSynthesisApi) {
            return;
        }
        speechSynthesisApi.cancel();
    }

    async function speakQuestionWithServerTts(text) {
        const mode = body.classList.contains("mode-urgent") ? "urgent" : "calm";
        const controller = new AbortController();
        currentTtsRequest = controller;

        const res = await fetch("/speech/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, mode }),
            signal: controller.signal,
        });

        if (!res.ok) {
            throw new Error("server tts unavailable");
        }

        const blob = await res.blob();
        if (!blob.size) {
            throw new Error("empty tts audio");
        }

        const objectUrl = URL.createObjectURL(blob);
        currentTtsAudioUrl = objectUrl;
        const audio = new Audio(objectUrl);
        currentTtsAudio = audio;

        audio.addEventListener("ended", () => {
            if (currentTtsAudioUrl) {
                URL.revokeObjectURL(currentTtsAudioUrl);
                currentTtsAudioUrl = "";
            }
            currentTtsAudio = null;
        });

        await audio.play();
    }

    function speakQuestionWithBrowser(text) {
        if (!speechSynthesisApi || !text || !text.trim()) {
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text.trim());
        const voice = pickQuestionVoice();
        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
        } else {
            utterance.lang = "en-US";
        }
        utterance.rate = 0.96;
        utterance.pitch = 1;
        utterance.volume = 1;
        speechSynthesisApi.speak(utterance);
    }

    async function speakQuestion(text) {
        if (!text || !text.trim()) {
            return;
        }

        stopQuestionVoiceover();

        try {
            await speakQuestionWithServerTts(text.trim());
            return;
        } catch (_) {
            // Fallback to browser voice when backend TTS is unavailable or blocked.
        }

        speakQuestionWithBrowser(text.trim());
    }

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
        if (recognition) {
            try {
                recognition.stop();
            } catch (_) {}
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
        fullTranscript = "";
    }

    function setQuestion(index) {
        questionIndex = index % Math.max(activeQuestionSet.length, 1);
        const nextQuestion = activeQuestionSet[questionIndex];

        changeQuestionBtn.classList.add("hidden");
        interactionStage.classList.add("is-loading");
        // Start typing animation only after audio is ready and starts playing
        (async () => {
            try {
                await speakQuestion(nextQuestion);
            } catch (e) {
                // fallback: still show text if audio fails
            }
            typeIntoElement(questionText, nextQuestion, 34, () => {
                interactionStage.classList.remove("is-loading");
                changeQuestionBtn.classList.remove("hidden");
            });
        })();
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

    async function moveToNextQuestion() {
        if (currentStep < totalSteps) {
            currentStep += 1;
            updateStepUi();
            cycleQuestion();
        } else {
            await showResults();
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

    const CATEGORIES = ["Work", "Health", "Relationships", "Finance", "Personal Growth", "Spirituality", "Family"];
    const DURATIONS = ["5 min", "15 min", "20 min", "30 min", "45 min", "1 hr"];
    const PRIORITIES = ["LOW", "MED", "HIGH"];

    const CAT_STYLE = {
        Work: "background:#f2eced;color:#7f5b63",
        Health: "background:#f0f7e8;color:#5a8a3a",
        Finance: "background:#fef7e6;color:#9a7a20",
        Relationships: "background:#f0f0fa;color:#6060b0",
        "Personal Growth": "background:#edf2fd;color:#5d77ad",
        Spirituality: "background:#fff4e9;color:#b27838",
        Family: "background:#e9f6ee;color:#4a8f6e",
    };

    const PRIO_STYLE = {
        LOW: "background:#f0f2f5;color:#8799b4",
        MED: "background:#fdf6e8;color:#a08030",
        HIGH: "background:#fdf0ee;color:#c8604a",
    };

    window.toggleDate = function (i) {
        const el = document.getElementById("dt-" + i);
        if (el) {
            const hidden = el.style.display === "none" || !el.style.display;
            el.style.display = hidden ? "block" : "none";
        }
    };

    function renderTaskList(tasks, taskEl, emptyTranscript) {
        if (!taskEl) return;
        if (emptyTranscript && tasks.length === 0) {
            taskEl.innerHTML =
                `<li class="py-6 text-center" style="color:#8da0be;font-size:14px;line-height:1.5">` +
                `Not enough information — we couldn't extract any tasks from your session. ` +
                `Please try again with more detailed responses.</li>`;
            return;
        }
        taskEl.innerHTML = tasks.map((t, i) => {
            const cat = CAT_STYLE[t.cat] || CAT_STYLE.Work;
            const prio = PRIO_STYLE[t.prio] || PRIO_STYLE.LOW;
            const sep = i > 0 ? "border-top:1px solid #f0f2f5;" : "";
            return (
                `<li data-task-idx="${i}" style="${sep}display:flex;align-items:flex-start;gap:8px;padding:12px 0">` +
                `<span style="margin-top:6px;height:6px;width:6px;flex:none;border-radius:9999px;background:#334772"></span>` +
                `<span class="task-name" style="flex:1;font-size:14px;font-weight:500;line-height:1.45;color:#2f426c">${escapeHtml(t.name)}</span>` +
                `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;padding-top:2px;flex:none">` +
                `<div style="display:flex;align-items:center;gap:5px">` +
                `<span style="white-space:nowrap;font-size:10px;color:#8da0be">${escapeHtml(t.dur)}</span>` +
                `<span style="border-radius:9999px;padding:2px 8px;font-size:10px;font-weight:600;${cat}">${escapeHtml(t.cat)}</span>` +
                `<span style="border-radius:9999px;padding:2px 8px;font-size:10px;font-weight:700;${prio}">${escapeHtml(t.prio)}</span>` +
                `<button type="button" class="task-date-btn" data-idx="${i}" title="Add due date" style="cursor:pointer;background:none;border:none;padding:0;font-size:13px;line-height:1">📅</button>` +
                `<button type="button" class="task-edit-btn" data-idx="${i}" title="Edit task" style="cursor:pointer;background:none;border:none;padding:0;font-size:13px;line-height:1">✏️</button>` +
                `<button type="button" class="task-del-btn" data-idx="${i}" title="Delete task" style="cursor:pointer;background:none;border:none;padding:0;font-size:13px;line-height:1">🗑️</button>` +
                `</div>` +
                `<input type="date" id="dt-${i}" style="display:none;font-size:11px;border-radius:8px;border:1px solid #dfebe7;background:#fff;padding:3px 8px;max-width:130px">` +
                `</div></li>`
            );
        }).join("");

        taskEl.querySelectorAll(".task-date-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                const i = parseInt(btn.getAttribute("data-idx"), 10);
                window.toggleDate(i);
            });
        });
        taskEl.querySelectorAll(".task-edit-btn").forEach((btn) => {
            btn.addEventListener("click", () => showTaskEditForm(parseInt(btn.getAttribute("data-idx"), 10)));
        });
        taskEl.querySelectorAll(".task-del-btn").forEach((btn) => {
            btn.addEventListener("click", () => removeTask(parseInt(btn.getAttribute("data-idx"), 10)));
        });
    }

    function escapeHtml(s) {
        const div = document.createElement("div");
        div.textContent = s;
        return div.innerHTML;
    }

    function showTaskEditForm(idx) {
        const taskEl = document.getElementById("task-list");
        const tasks = resultTasksForSave;
        if (idx < 0 || idx >= tasks.length || !taskEl) return;
        const t = tasks[idx];
        const li = taskEl.querySelector(`li[data-task-idx="${idx}"]`);
        if (!li) return;

        const catOpts = CATEGORIES.map((c) => `<option value="${escapeHtml(c)}" ${c === t.cat ? "selected" : ""}>${escapeHtml(c)}</option>`).join("");
        const durOpts = DURATIONS.map((d) => {
            const display = `~${d}`;
            const match = t.dur && (t.dur === display || t.dur === d);
            return `<option value="${escapeHtml(d)}" ${match ? "selected" : ""}>${escapeHtml(display)}</option>`;
        }).join("");
        const prioOpts = PRIORITIES.map((p) => `<option value="${p}" ${p === t.prio ? "selected" : ""}>${p}</option>`).join("");

        li.innerHTML = (
            `<div style="display:flex;flex-direction:column;gap:8px;width:100%">` +
            `<input type="text" class="task-edit-name" value="${escapeHtml(t.name)}" placeholder="Task name" style="font-size:14px;padding:8px 12px;border-radius:10px;border:1px solid #e2e8f0;width:100%">` +
            `<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">` +
            `<select class="task-edit-cat" style="font-size:12px;padding:6px 10px;border-radius:8px;border:1px solid #e2e8f0">${catOpts}</select>` +
            `<select class="task-edit-dur" style="font-size:12px;padding:6px 10px;border-radius:8px;border:1px solid #e2e8f0">${durOpts}</select>` +
            `<select class="task-edit-prio" style="font-size:12px;padding:6px 10px;border-radius:8px;border:1px solid #e2e8f0">${prioOpts}</select>` +
            `</div>` +
            `<div style="display:flex;gap:6px">` +
            `<button type="button" class="task-save-edit" data-idx="${idx}" style="padding:6px 14px;font-size:12px;font-weight:600;border-radius:8px;border:0;background:var(--accent);color:#fff;cursor:pointer">Done</button>` +
            `<button type="button" class="task-cancel-edit" data-idx="${idx}" style="padding:6px 14px;font-size:12px;font-weight:600;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#6b7a94;cursor:pointer">Cancel</button>` +
            `</div></div>`
        );

        const saveBtn = li.querySelector(".task-save-edit");
        const cancelBtn = li.querySelector(".task-cancel-edit");
        saveBtn.addEventListener("click", () => {
            const name = li.querySelector(".task-edit-name").value.trim();
            const cat = li.querySelector(".task-edit-cat").value;
            const dur = li.querySelector(".task-edit-dur").value;
            const prio = li.querySelector(".task-edit-prio").value;
            if (name) {
                resultTasksForSave[idx] = { name, dur: dur.startsWith("~") ? dur : `~${dur}`, cat, prio };
                renderTaskList(resultTasksForSave, taskEl, false);
                updateTaskCountLabel();
            }
        });
        cancelBtn.addEventListener("click", () => {
            renderTaskList(resultTasksForSave, taskEl, false);
        });
    }

    function removeTask(idx) {
        resultTasksForSave.splice(idx, 1);
        const taskEl = document.getElementById("task-list");
        renderTaskList(resultTasksForSave, taskEl, false);
        updateTaskCountLabel();
    }

    function addNewTask() {
        resultTasksForSave.push({ name: "New task", dur: "~15 min", cat: "Work", prio: "MED" });
        const taskEl = document.getElementById("task-list");
        renderTaskList(resultTasksForSave, taskEl, false);
        updateTaskCountLabel();
        showTaskEditForm(resultTasksForSave.length - 1);
    }

    function updateTaskCountLabel() {
        const el = document.getElementById("task-count-label");
        if (el) {
            const n = resultTasksForSave.length;
            el.textContent = n === 0 ? "No tasks" : `${n} Task${n === 1 ? "" : "s"} queued`;
        }
    }

    function importanceToPrio(importance) {
        const i = Number(importance);
        if (i >= 7) return "HIGH";
        if (i >= 4) return "MED";
        return "LOW";
    }

    function mapExtractedTaskToDisplay(extracted) {
        const importance = extracted.importance ?? 5;
        const mins = extracted.estimatedTimeToComplete;
        const dur = mins != null ? `~${mins} min` : "~15 min";
        return {
            name: extracted.title || "Task",
            dur,
            cat: extracted.category || "Work",
            prio: importanceToPrio(importance),
        };
    }

    async function showResults() {
        const resultsScreen = document.getElementById("results-screen");
        const loadingEl = document.getElementById("results-loading");
        const contentEl = document.getElementById("results-content");

        if (loadingEl) loadingEl.classList.remove("hidden");
        if (contentEl) contentEl.classList.add("hidden");
        resultsScreen.classList.remove("hidden");
        window.scrollTo(0, 0);

        let resultTasks = [];
        const transcript = combinedTranscript.trim();
        const isUrgent = body.classList.contains("mode-urgent");

        if (transcript) {
            try {
                const res = await fetch("/speech/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: transcript, userId }),
                });
                const payload = await res.json();
                const extracted = payload.extractedTasks || [];
                if (extracted.length > 0) {
                    resultTasks = extracted.map(mapExtractedTaskToDisplay);
                    if (isUrgent) {
                        resultTasks = resultTasks.map((t) => ({ ...t, prio: "HIGH" }));
                    }
                }
            } catch (_) {
                /* fall through to fallback */
            }
        }

        const emptyTranscript = !transcript;
        if (resultTasks.length === 0 && !emptyTranscript) {
            resultTasks = isUrgent
                ? DEMO_TASKS.map((t) => ({ ...t, prio: "HIGH" }))
                : DEMO_TASKS;
        }

        resultTasksForSave = resultTasks;

        if (loadingEl) loadingEl.classList.add("hidden");
        if (contentEl) contentEl.classList.remove("hidden");

        const themeEl = document.getElementById("theme-chips");
        if (themeEl) {
            themeEl.innerHTML = DEMO_THEMES.map((t) =>
                `<span style="border-radius:9999px;padding:4px 12px;font-size:12px;font-weight:600;` +
                `background:color-mix(in srgb,var(--accent) 12%,white 88%);color:var(--accent);` +
                `border:1px solid color-mix(in srgb,var(--accent) 25%,white 75%)">${t}</span>`
            ).join("");
        }

        const taskCountEl = document.getElementById("task-count-label");
        if (taskCountEl) {
            taskCountEl.textContent =
                resultTasks.length === 0
                    ? "No tasks"
                    : `${resultTasks.length} Task${resultTasks.length === 1 ? "" : "s"} queued`;
        }

        const taskEl = document.getElementById("task-list");
        renderTaskList(resultTasksForSave, taskEl, emptyTranscript);

        window.scrollTo(0, 0);
    }

    function applyTone(mode) {
        const isUrgent = mode === "urgent";
        body.classList.toggle("mode-urgent", isUrgent);
        modeIcon.textContent = isUrgent ? "\u26A1" : "\uD83C\uDF43";
        modeText.textContent = isUrgent ? "Urgent" : "Calm";
        activeQuestionSet = isUrgent ? urgentQuestions : calmQuestions;
        currentStep = 1;
        combinedTranscript = "";
        lastStepTranscript = "";
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
        if (recognition) {
            try {
                recognition.stop();
            } catch (_) {}
        }
        if (recordInterval) {
            clearInterval(recordInterval);
            recordInterval = null;
        }
        recordingStrip.classList.add("hidden");
        liveTranscriptWrap.classList.add("hidden");
        voiceReview.classList.remove("hidden");
        tapSpeakBtn.classList.add("hidden");
        // Use displayed text (fullTranscript + any interim) so we capture what user saw when stopping quickly
        const displayedText = (liveTranscript && liveTranscript.textContent || "").trim();
        const captured = displayedText || fullTranscript.trim();
        const responseText = captured || "No speech detected.";
        lastStepTranscript = captured;
        typeIntoTextarea(voiceOutput, responseText, 14, () => updateOrbState("ready"));
        resetRecordingUi();
    }

    function startRecording() {
        stopQuestionVoiceover();
        resetRecordingUi();
        voiceReview.classList.add("hidden");
        tapSpeakBtn.classList.add("hidden");
        recordingStrip.classList.remove("hidden");
        liveTranscriptWrap.classList.remove("hidden");
        liveTranscript.textContent = "";
        fullTranscript = "";
        updateOrbState("listening");

        if (!SpeechRecognition) {
            liveTranscript.textContent = "Voice input not supported in this browser. Try Chrome or Edge.";
            recordInterval = setInterval(() => {
                recordSecondsLeft -= 1;
                recordTimer.textContent = `${recordSecondsLeft}s`;
                if (recordSecondsLeft <= 0) {
                    finishRecording();
                }
            }, 1000);
            return;
        }

        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
            if (muted) return;
            let interim = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    fullTranscript += transcript + " ";
                } else {
                    interim += transcript;
                }
            }
            liveTranscript.textContent = fullTranscript + interim;
        };

        recognition.onerror = (event) => {
            if (event.error === "no-speech" && fullTranscript) return;
            if (event.error !== "aborted") {
                liveTranscript.textContent = liveTranscript.textContent || `Listening… (${event.error})`;
            }
        };

        recognition.onend = () => {
            if (recordInterval && recordSecondsLeft > 0 && !muted) {
                try {
                    recognition.start();
                } catch (_) {}
            }
        };

        try {
            recognition.start();
        } catch (_) {
            liveTranscript.textContent = "Could not start voice input.";
        }

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
        if (recognition) {
            if (muted) {
                try {
                    recognition.stop();
                } catch (_) {}
                liveTranscript.textContent = fullTranscript + " (paused)";
            } else {
                try {
                    recognition.start();
                } catch (_) {}
            }
        }
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
        const stepText = (lastStepTranscript || voiceOutput.value.trim() || "").trim();
        if (stepText) {
            combinedTranscript += (combinedTranscript ? "\n\n" : "") + stepText;
        }
        lastStepTranscript = "";
        demoNote.textContent = "Saved for demo. Moving to next question...";
        setTimeout(moveToNextQuestion, 520);
    });

    typeSubmitBtn.addEventListener("click", () => {
        if (!typedInput.value.trim()) {
            typedInput.focus();
            return;
        }
        const stepText = typedInput.value.trim();
        combinedTranscript += (combinedTranscript ? "\n\n" : "") + stepText;
        demoNote.textContent = "Submitted for demo. Moving to next question...";
        setTimeout(moveToNextQuestion, 520);
    });

    applyTone("calm");
    setInputMode("voice");
    updateStepUi();

    if (speechSynthesisApi) {
        cacheVoices();
        speechSynthesisApi.onvoiceschanged = cacheVoices;
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                stopQuestionVoiceover();
            }
        });
        window.addEventListener("beforeunload", stopQuestionVoiceover);
    }

    const openTeamBtn = document.getElementById("open-team");
    const teamDialog = document.getElementById("team-dialog");
    if (openTeamBtn && teamDialog) {
        openTeamBtn.addEventListener("click", () => teamDialog.showModal());
    }

    const addTaskBtn = document.getElementById("add-task-btn");
    if (addTaskBtn) {
        addTaskBtn.addEventListener("click", addNewTask);
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
