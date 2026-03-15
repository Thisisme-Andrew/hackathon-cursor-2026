document.addEventListener("DOMContentLoaded", () => {
    const root = document.querySelector("[data-auth-root]");
    if (!root) {
        return;
    }

    const tabLogin = document.getElementById("tab-login");
    const tabSignup = document.getElementById("tab-signup");

    const viewLogin = document.getElementById("view-login");
    const viewSignup1 = document.getElementById("view-signup-step1");
    const viewSignup2 = document.getElementById("view-signup-step2");

    const authMessage = document.getElementById("auth-message");

    const priorities = [
        "Work",
        "Health",
        "Relationships",
        "Finance",
        "Personal Growth",
        "Spirituality",
        "Family",
    ];

    const priorityState = {
        Work: 3,
        Health: 3,
        Relationships: 3,
        Finance: 3,
        "Personal Growth": 2,
        Spirituality: 2,
        Family: 3,
    };

    const priorityIcons = {
        Work: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></svg>',
        Health: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 20c4-3 6-8 6-15"/><path d="M12 15c4 0 7-3 7-7"/><path d="M4 12c2 0 4 1 5 3"/></svg>',
        Relationships: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 18v-8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9l-5 3v-4Z"/></svg>',
        Finance: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M9 9c0-1.1 1.3-2 3-2s3 .9 3 2-1.3 2-3 2-3 .9-3 2 1.3 2 3 2 3-.9 3-2"/></svg>',
        "Personal Growth": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19h16"/><path d="M5 16l4-4 3 2 6-6"/><path d="M16 8h2v2"/></svg>',
        Spirituality: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3c0 4-4 5-4 9a4 4 0 0 0 8 0c0-4-4-5-4-9Z"/><path d="M8 16h8"/><path d="M9 19h6"/></svg>',
        Family: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg>',
    };

    const priorityIconColors = {
        Work: "#a67a84",
        Health: "#a7cf72",
        Relationships: "#9b9bd9",
        Finance: "#d1a54e",
        "Personal Growth": "#8ca0d6",
        Spirituality: "#d8a656",
        Family: "#7ecda8",
    };

    function setTabState(button, active) {
        button.classList.toggle("active", active);
    }

    function hideAllViews() {
        viewLogin.classList.add("hidden");
        viewSignup1.classList.add("hidden");
        viewSignup2.classList.add("hidden");
    }

    function showLogin() {
        hideAllViews();
        viewLogin.classList.remove("hidden");
        setTabState(tabLogin, true);
        setTabState(tabSignup, false);
    }

    function showSignupStep1() {
        hideAllViews();
        viewSignup1.classList.remove("hidden");
        setTabState(tabLogin, false);
        setTabState(tabSignup, true);
    }

    function showSignupStep2() {
        hideAllViews();
        viewSignup2.classList.remove("hidden");
        setTabState(tabLogin, false);
        setTabState(tabSignup, true);
        renderPriorities();
    }

    function setMessage(text, isSuccess) {
        authMessage.textContent = text;
        authMessage.classList.remove("hidden", "auth-msg-success", "auth-msg-error");
        if (isSuccess) {
            authMessage.classList.add("auth-msg-success");
        } else {
            authMessage.classList.add("auth-msg-error");
        }
    }

    function clearMessage() {
        authMessage.textContent = "";
        authMessage.classList.add("hidden");
    }

    function renderPriorities() {
        const container = document.getElementById("priority-list");
        container.innerHTML = "";

        priorities.forEach((area) => {
            const row = document.createElement("div");
            row.className = "priority-row";

            const label = document.createElement("span");
            label.className = "priority-name";

            const icon = document.createElement("span");
            icon.className = "priority-icon";
            icon.innerHTML = priorityIcons[area] || priorityIcons.Work;
            icon.style.color = priorityIconColors[area] || "#8796b1";

            const text = document.createElement("span");
            text.textContent = area;

            label.appendChild(icon);
            label.appendChild(text);

            const group = document.createElement("div");
            group.className = "priority-score-group";

            for (let i = 1; i <= 5; i += 1) {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "priority-score";
                btn.classList.toggle("active", i === priorityState[area]);
                btn.textContent = String(i);
                btn.addEventListener("click", () => {
                    priorityState[area] = i;
                    renderPriorities();
                });
                group.appendChild(btn);
            }

            row.appendChild(label);
            row.appendChild(group);
            container.appendChild(row);
        });
    }

    /**
     * Hash password with SHA-256 before sending to backend.
     * Returns hex-encoded hash string.
     */
    async function hashPassword(plainPassword) {
        const encoder = new TextEncoder();
        const data = encoder.encode(plainPassword);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    const API_BASE = "/users";

    tabLogin.addEventListener("click", showLogin);
    tabSignup.addEventListener("click", showSignupStep1);
    document.getElementById("go-signup").addEventListener("click", showSignupStep1);

    document.getElementById("login-submit").addEventListener("click", async () => {
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value.trim();

        if (!email || !password) {
            setMessage("Email and password are required.", false);
            return;
        }

        try {
            const passwordHash = await hashPassword(password);
            const res = await fetch(`${API_BASE}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password: passwordHash }),
            });
            const data = await res.json();

            if (res.ok) {
                setMessage(`Welcome back, ${data.firstName || "User"}!`, true);
            } else {
                setMessage(data.error || "Login failed.", false);
            }
        } catch (err) {
            setMessage("Network error. Please try again.", false);
        }
    });

    document.getElementById("signup-next").addEventListener("click", showSignupStep2);
    document.getElementById("signup-back").addEventListener("click", showSignupStep1);

    document.getElementById("signup-create").addEventListener("click", async () => {
        const firstName = document.getElementById("signup-firstname").value.trim();
        const lastName = document.getElementById("signup-lastname").value.trim();
        const email = document.getElementById("signup-email").value.trim();
        const password = document.getElementById("signup-password").value.trim();

        if (!firstName || !lastName || !email || !password) {
            setMessage("All fields are required.", false);
            return;
        }
        if (password.length < 6) {
            setMessage("Password must be at least 6 characters.", false);
            return;
        }

        try {
            const passwordHash = await hashPassword(password);

            const categoryWeights = {
                work: priorityState.Work,
                health: priorityState.Health,
                relationships: priorityState.Relationships,
                finance: priorityState.Finance,
                personalGrowth: priorityState["Personal Growth"],
                spirituality: priorityState.Spirituality,
                family: priorityState.Family,
            };

            const res = await fetch(`${API_BASE}/create-user`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    passwordHash,
                    firstName,
                    lastName,
                    settings: { categoryWeights },
                }),
            });
            const data = await res.json();

            if (res.ok) {
                setMessage("Account created successfully! You can log in now.", true);
                showSignupStep1();
            } else {
                setMessage(data.error || "Signup failed.", false);
            }
        } catch (err) {
            setMessage("Network error. Please try again.", false);
        }
    });

    clearMessage();
    if (root.dataset.initialMode === "login") {
        showLogin();
    } else {
        showSignupStep1();
    }
});
