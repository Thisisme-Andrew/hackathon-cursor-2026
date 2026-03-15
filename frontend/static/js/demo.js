document.addEventListener("DOMContentLoaded", () => {
    const seedNode = document.getElementById("demo-seed");
    const seed = seedNode ? JSON.parse(seedNode.textContent) : {
        calmQuestions: ["What's on your mind today?"],
        urgentQuestions: ["What needs attention first?"],
        voiceSamples: { calm: "", urgent: "" },
        steps: 4,
    };

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
        }
        cycleQuestion();
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
        tapSpeakBtn.classList.remove("hidden");
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
});
