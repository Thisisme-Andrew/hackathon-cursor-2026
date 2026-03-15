document.addEventListener("DOMContentLoaded", () => {
    const seedNode = document.getElementById("dashboard-seed");
    const seed = seedNode
        ? JSON.parse(seedNode.textContent)
        : {
              user: { name: "sagesse", email: "sagesse@gmail.com" },
              quotes: ["Progress, not perfection."],
              tasks: [],
              priorityWeights: {
                  Work: 3,
                  Health: 3,
                  Relationships: 3,
                  Finance: 3,
                  "Personal Growth": 2,
                  Spirituality: 2,
                  Family: 3,
              },
          };

    const PRIORITY_ORDER = { HIGH: 3, MED: 2, LOW: 1 };
    const CAT_KEY = {
        Work: "cat-work",
        Health: "cat-health",
        Relationships: "cat-rel",
        Finance: "cat-fin",
        "Personal Growth": "cat-grow",
        Spirituality: "cat-spirit",
        Family: "cat-family",
    };
    const CAT_ICONS = {
        Work: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></svg>',
        Health: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 20c4-3 6-8 6-15"/><path d="M12 15c4 0 7-3 7-7"/><path d="M4 12c2 0 4 1 5 3"/></svg>',
        Relationships: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 18v-8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9l-5 3v-4Z"/></svg>',
        Finance: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M9 9c0-1.1 1.3-2 3-2s3 .9 3 2-1.3 2-3 2-3 .9-3 2 1.3 2 3 2 3-.9 3-2"/></svg>',
        "Personal Growth": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19h16"/><path d="M5 16l4-4 3 2 6-6"/><path d="M16 8h2v2"/></svg>',
        Spirituality: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3c0 4-4 5-4 9a4 4 0 0 0 8 0c0-4-4-5-4-9Z"/><path d="M8 16h8"/><path d="M9 19h6"/></svg>',
        Family: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg>',
    };

    const user = seed.user || { name: "sagesse", email: "sagesse@gmail.com" };
    const quotes = Array.isArray(seed.quotes) && seed.quotes.length ? seed.quotes : ["Progress, not perfection."];
    let tasks = Array.isArray(seed.tasks) ? seed.tasks.map((t) => ({ ...t })) : [];
    const weights = { ...(seed.priorityWeights || {}) };

    let quoteIndex = 0;
    let showAll = false;
    let newTaskPriority = "MED";
    let focusIndex = 0;
    let doneExpanded = false;

    const heroGreeting = document.getElementById("hero-greeting");
    const heroName = document.getElementById("hero-name");
    const userNameTop = document.getElementById("user-name-top");
    const userNameMenu = document.getElementById("user-name-menu");
    const userEmailMenu = document.getElementById("user-email-menu");
    const userAvatar = document.getElementById("user-avatar");

    const quoteText = document.getElementById("quote-text");
    const refreshQuote = document.getElementById("refresh-quote");

    const userMenuBtn = document.getElementById("user-menu-btn");
    const userDropdown = document.getElementById("user-dropdown");
    const openPrioritySettings = document.getElementById("open-priority-settings");
    const priorityModal = document.getElementById("priority-modal");

    const addTaskCard = document.getElementById("add-task-card");
    const openAdd = document.getElementById("open-add");
    const closeAdd = document.getElementById("close-add");
    const newTitle = document.getElementById("new-title");
    const newDuration = document.getElementById("new-duration");
    const newCategory = document.getElementById("new-category");
    const newDue = document.getElementById("new-due");
    const addTaskBtn = document.getElementById("add-task-btn");
    const prioPicks = Array.from(document.querySelectorAll("[data-prio-pick]"));

    const emptyCard = document.getElementById("empty-card");
    const todoCount = document.getElementById("todo-count");
    const todoList = document.getElementById("todo-list");
    const showMoreBtn = document.getElementById("show-more-btn");
    const doneWrap = document.getElementById("done-wrap");
    const doneTitle = document.getElementById("done-title");
    const doneList = document.getElementById("done-list");
    const doneToggle = document.getElementById("done-toggle");
    const doneContent = document.getElementById("done-content");
    const doneChevron = document.getElementById("done-chevron");
    const clearDoneBtn = document.getElementById("clear-done");

    const progressRing = document.getElementById("progress-ring");
    const progressPercent = document.getElementById("progress-percent");
    const progressTitle = document.getElementById("progress-title");
    const progressSubtitle = document.getElementById("progress-subtitle");

    const emailSummary = document.getElementById("email-summary");
    const sendEmail = document.getElementById("send-email");

    const focusEnter = document.getElementById("focus-enter");
    const focusOverlay = document.getElementById("focus-overlay");
    const focusExit = document.getElementById("focus-exit");
    const focusCounter = document.getElementById("focus-counter");
    const focusDots = document.getElementById("focus-dots");
    const focusCard = document.getElementById("focus-card");
    const focusPrio = document.getElementById("focus-prio");
    const focusDur = document.getElementById("focus-dur");
    const focusTitle = document.getElementById("focus-title");
    const focusDone = document.getElementById("focus-done");
    const focusNext = document.getElementById("focus-next");

    const weightList = document.getElementById("weight-list");
    const saveWeights = document.getElementById("save-weights");

    function getGreeting() {
        const h = new Date().getHours();
        if (h < 12) return "Good morning";
        if (h < 18) return "Good afternoon";
        return "Good evening";
    }

    function applyUserIdentity() {
        const compactName = String(user.name || "SG").replace(/\s+/g, "").trim();
        const initials = (compactName.slice(0, 2) || "SG").toUpperCase();

        if (heroGreeting) heroGreeting.textContent = getGreeting();
        heroName.textContent = user.name;
        userNameTop.textContent = user.name;
        userNameMenu.textContent = user.name;
        userEmailMenu.textContent = user.email;
        emailSummary.value = user.email;
        userAvatar.textContent = initials;
    }

    function getOpenTasks() {
        return tasks
            .filter((task) => !task.done)
            .sort((a, b) => {
                const diff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
                if (diff !== 0) {
                    return diff;
                }
                return a.id - b.id;
            });
    }

    function getDoneTasks() {
        return tasks.filter((task) => task.done);
    }

    function prioClass(priority) {
        return String(priority || "LOW").toLowerCase();
    }

    function categoryChip(category) {
        const key = CAT_KEY[category] || "cat-work";
        const svg = CAT_ICONS[category] || "";
        const iconHtml = svg
            ? `<span style="display:inline-flex;width:11px;height:11px;flex:none;vertical-align:middle">${svg}</span> `
            : "";
        return `<span class="meta-chip ${key}">${iconHtml}${category}</span>`;
    }

    function formatDue(due) {
        if (!due) {
            return "date";
        }

        const dt = new Date(`${due}T00:00:00`);
        if (Number.isNaN(dt.getTime())) {
            return due;
        }

        return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }

    function renderQuote() {
        quoteText.textContent = `"${quotes[quoteIndex % quotes.length]}"`;
    }

    function nextQuote() {
        quoteIndex = (quoteIndex + 1) % quotes.length;
        renderQuote();
    }

    function setRing(percent) {
        const bounded = Math.max(0, Math.min(100, percent));
        const deg = Math.round((bounded / 100) * 360);
        progressRing.style.background = deg === 0
            ? "#e8edf2"
            : `conic-gradient(var(--accent) ${deg}deg, #e8edf2 ${deg}deg)`;
        progressPercent.textContent = `${Math.round(bounded)}%`;
    }

    function renderSummary() {
        const total = tasks.length;
        const done = getDoneTasks().length;
        const open = total - done;
        const percent = total ? (done / total) * 100 : 0;

        setRing(percent);
        progressTitle.textContent = `${done} of ${total} tasks done`;
        progressSubtitle.textContent = `${open} remaining`;
        todoCount.textContent = String(open);

        if (open === 0) {
            emptyCard.classList.remove("hide");
            focusEnter.classList.add("hide");
        } else {
            emptyCard.classList.add("hide");
            focusEnter.classList.remove("hide");
        }

        if (done > 0) {
            doneWrap.classList.remove("hide");
            clearDoneBtn.classList.remove("hide");
        } else {
            doneWrap.classList.add("hide");
            clearDoneBtn.classList.add("hide");
            doneExpanded = false;
        }
    }

    function renderTodo() {
        const openTasks = getOpenTasks();
        const visible = showAll ? openTasks : openTasks.slice(0, 3);

        todoList.innerHTML = visible
            .map((task) => {
                const cls = prioClass(task.priority);
                const dueText = formatDue(task.due);
                const dueValue = task.due || "";
                return `
                    <article class="task-row ${cls}" data-task-id="${task.id}">
                        <span class="dot ${cls}"></span>
                        <input type="checkbox" class="checkbox checkbox-sm mt-1 border-[#d2ddeb]" data-done-id="${task.id}" />
                        <div style="flex:1">
                            <p style="font-size:14px;font-weight:600;color:#2f426c;line-height:1.35;margin:0">${task.title}</p>
                            <div style="margin-top:5px;display:flex;flex-wrap:wrap;gap:5px;align-items:center">
                                <span class="meta-chip">${task.duration}</span>
                                ${categoryChip(task.category)}
                                <button type="button" class="meta-chip date-chip-btn" data-date-btn-id="${task.id}" title="Edit due date">&#128197; ${dueText}</button>
                                <input type="date" class="task-date-input hide" data-date-input-id="${task.id}" value="${dueValue}" />
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:7px">
                            <select class="prio-select ${cls}" data-prio-id="${task.id}">
                                <option value="LOW" style="color:#8ea4c3;background:#f4f6f9" ${task.priority === "LOW" ? "selected" : ""}>LOW</option>
                                <option value="MED" style="color:#c38f37;background:#fff8ee" ${task.priority === "MED" ? "selected" : ""}>MED</option>
                                <option value="HIGH" style="color:#cf5a3f;background:#fff3f0" ${task.priority === "HIGH" ? "selected" : ""}>HIGH</option>
                            </select>
                            <button type="button" class="task-delete-btn" data-delete-open-id="${task.id}" title="Delete task">&#10005;</button>
                        </div>
                    </article>
                `;
            })
            .join("");

        showMoreBtn.classList.toggle("hide", openTasks.length <= 3);
        if (!showMoreBtn.classList.contains("hide")) {
            showMoreBtn.textContent = showAll ? "Show less" : `Show ${openTasks.length - 3} more tasks`;
        }

        todoList.querySelectorAll("[data-done-id]").forEach((el) => {
            el.addEventListener("change", () => {
                const id = Number(el.getAttribute("data-done-id"));
                const task = tasks.find((item) => item.id === id);
                if (task) {
                    task.done = true;
                    renderAll();
                }
            });
        });

        todoList.querySelectorAll("[data-prio-id]").forEach((el) => {
            el.addEventListener("change", () => {
                const id = Number(el.getAttribute("data-prio-id"));
                const task = tasks.find((item) => item.id === id);
                if (task) {
                    task.priority = el.value;
                    renderAll();
                }
            });
        });

        todoList.querySelectorAll("[data-delete-open-id]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const id = Number(btn.getAttribute("data-delete-open-id"));
                tasks = tasks.filter((task) => task.id !== id);
                renderAll();
            });
        });

        todoList.querySelectorAll("[data-date-btn-id]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-date-btn-id");
                const input = todoList.querySelector(`[data-date-input-id="${id}"]`);
                if (!input) {
                    return;
                }
                input.classList.remove("hide");
                input.showPicker?.();
                input.focus();
            });
        });

        todoList.querySelectorAll("[data-date-input-id]").forEach((input) => {
            input.addEventListener("change", () => {
                const id = Number(input.getAttribute("data-date-input-id"));
                const task = tasks.find((item) => item.id === id);
                if (task) {
                    task.due = input.value || "";
                    renderAll();
                }
            });

            input.addEventListener("blur", () => {
                input.classList.add("hide");
            });
        });
    }

    function renderDone() {
        const doneTasks = getDoneTasks();
        doneTitle.textContent = `DONE (${doneTasks.length})`;
        doneChevron.textContent = doneExpanded ? "v" : ">";
        doneContent.classList.toggle("hide", !doneExpanded);

        doneList.innerHTML = doneTasks
            .map(
                (task) => `
                    <article class="task-row low" style="opacity:.82">
                        <span class="dot low"></span>
                        <span style="flex:1;font-size:13px;font-weight:600;color:#8ca0bc">${task.title}</span>
                        <button type="button" data-delete-id="${task.id}"
                                style="border:0;background:transparent;cursor:pointer;color:#c8d4e2;font-size:14px;padding:0;line-height:1"
                                title="Delete">&#128465;</button>
                    </article>
                `,
            )
            .join("");

        doneList.querySelectorAll("[data-delete-id]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const id = Number(btn.getAttribute("data-delete-id"));
                tasks = tasks.filter((t) => t.id !== id);
                renderAll();
            });
        });
    }

    function stylePriorityPickButtons() {
        prioPicks.forEach((btn) => {
            const active = btn.getAttribute("data-prio-pick") === newTaskPriority;
            btn.style.boxShadow = active ? "0 0 0 2px rgba(51,71,114,.22)" : "none";
        });
    }

    function renderWeights() {
        const entries = Object.entries(weights);
        weightList.innerHTML = entries
            .map(([label, value]) => {
                const scores = [1, 2, 3, 4, 5]
                    .map((score) => {
                        const active = score === value;
                        const cls = active ? "priority-score active" : "priority-score";
                        return `<button class="${cls}" data-w-label="${label}" data-w-num="${score}">${score}</button>`;
                    })
                    .join("");

                return `
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                        <span style="font-size:13px;font-weight:600;color:#334772;display:flex;align-items:center;gap:6px">
                            <span style="display:inline-flex;width:14px;height:14px;flex:none">${CAT_ICONS[label] || ""}</span>
                            ${label}
                        </span>
                        <div style="display:flex;gap:6px">${scores}</div>
                    </div>
                `;
            })
            .join("");

        weightList.querySelectorAll("[data-w-num]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const label = btn.getAttribute("data-w-label");
                const num = Number(btn.getAttribute("data-w-num"));
                weights[label] = num;
                renderWeights();
            });
        });
    }

    function openFocus() {
        const openTasks = getOpenTasks();
        if (!openTasks.length) {
            return;
        }

        focusIndex = 0;
        focusOverlay.style.display = "flex";
        renderFocus();
    }

    function closeFocus() {
        focusOverlay.style.display = "none";
    }

    function renderFocus() {
        const openTasks = getOpenTasks();
        if (!openTasks.length) {
            closeFocus();
            renderAll();
            return;
        }

        if (focusIndex >= openTasks.length) {
            focusIndex = 0;
        }

        const task = openTasks[focusIndex];
        const cls = prioClass(task.priority);

        focusCounter.textContent = `${focusIndex + 1} of ${openTasks.length}`;
        const borderMap = { high: "var(--high)", med: "var(--med)", low: "#c9d5e3" };
        focusPrio.className = `focus-prio ${cls} badge border text-[11px] font-bold`;
        focusPrio.textContent = `\u25cf ${task.priority}`;
        focusDur.textContent = task.duration;
        focusTitle.textContent = task.title;
        focusCard.style.borderTopColor = borderMap[cls] || "#c9d5e3";

        if (cls === "high") {
            focusDone.style.background = "var(--high)";
        } else if (cls === "med") {
            focusDone.style.background = "var(--med)";
        } else {
            focusDone.style.background = "#89a3c5";
        }

        focusDots.innerHTML = openTasks
            .map((item, idx) => {
                const itemCls = prioClass(item.priority);
                const active = idx === focusIndex ? `active ${itemCls}` : "";
                return `<span class="${active}"></span>`;
            })
            .join("");
    }

    function toggleUserMenu(force) {
        const show = typeof force === "boolean" ? force : userDropdown.classList.contains("hide");
        userDropdown.classList.toggle("hide", !show);
    }

    function addTaskFromForm() {
        const title = newTitle.value.trim();
        if (!title) {
            newTitle.focus();
            return;
        }

        const nextId = tasks.length ? Math.max(...tasks.map((task) => task.id)) + 1 : 1;
        tasks.push({
            id: nextId,
            title,
            duration: newDuration.value,
            category: newCategory.value,
            priority: newTaskPriority,
            due: newDue.value || "",
            done: false,
        });

        newTitle.value = "";
        newDue.value = "";
        showAll = false;
        renderAll();
    }

    function renderAll() {
        renderSummary();
        renderTodo();
        renderDone();
        stylePriorityPickButtons();
    }

    refreshQuote.addEventListener("click", nextQuote);
    setInterval(nextQuote, 9000);

    openAdd.addEventListener("click", () => {
        addTaskCard.classList.toggle("hide");
        if (!addTaskCard.classList.contains("hide")) newTitle.focus();
    });
    closeAdd.addEventListener("click", () => addTaskCard.classList.add("hide"));
    addTaskBtn.addEventListener("click", addTaskFromForm);

    prioPicks.forEach((btn) => {
        btn.addEventListener("click", () => {
            newTaskPriority = btn.getAttribute("data-prio-pick");
            stylePriorityPickButtons();
        });
    });

    showMoreBtn.addEventListener("click", () => {
        showAll = !showAll;
        renderTodo();
    });

    doneToggle.addEventListener("click", () => {
        doneExpanded = !doneExpanded;
        renderDone();
    });

    clearDoneBtn.addEventListener("click", () => {
        tasks = tasks.filter((task) => !task.done);
        doneExpanded = false;
        renderAll();
    });

    sendEmail.addEventListener("click", () => {
        const email = emailSummary.value.trim();
        if (!email) {
            emailSummary.focus();
            return;
        }
        sendEmail.textContent = "Sent";
        setTimeout(() => {
            sendEmail.textContent = "Send";
        }, 1200);
    });

    focusEnter.addEventListener("click", openFocus);
    focusExit.addEventListener("click", closeFocus);

    focusDone.addEventListener("click", () => {
        const openTasks = getOpenTasks();
        const task = openTasks[focusIndex];
        if (!task) {
            return;
        }

        const found = tasks.find((item) => item.id === task.id);
        if (found) {
            found.done = true;
        }

        renderFocus();
        renderAll();
    });

    focusNext.addEventListener("click", () => {
        const openTasks = getOpenTasks();
        if (!openTasks.length) {
            closeFocus();
            return;
        }

        focusIndex = (focusIndex + 1) % openTasks.length;
        renderFocus();
    });

    userMenuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleUserMenu();
    });

    document.addEventListener("click", () => toggleUserMenu(false));

    openPrioritySettings.addEventListener("click", () => {
        toggleUserMenu(false);
        renderWeights();
        priorityModal.showModal();
    });

    saveWeights.addEventListener("click", () => {
        priorityModal.close();
    });

    applyUserIdentity();
    quoteIndex = Math.floor(Math.random() * quotes.length);
    renderQuote();
    renderAll();

    const openTeamBtn = document.getElementById("open-team");
    const teamDialog = document.getElementById("team-dialog");
    if (openTeamBtn && teamDialog) {
        openTeamBtn.addEventListener("click", () => teamDialog.showModal());
    }
});
