import os
from flask import Flask, render_template, request


def create_app():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    app = Flask(
        __name__,
        template_folder=os.path.join(project_root, "frontend", "templates"),
        static_folder=os.path.join(project_root, "frontend", "static"),
    )

    @app.route("/")
    def home():
        # Render the frontend landing page for quick local testing.
        return render_template("index.html")

    @app.route("/auth")
    def auth_page():
        initial_mode = request.args.get("mode", "signup")
        if initial_mode not in {"login", "signup"}:
            initial_mode = "signup"
        return render_template("auth.html", initial_mode=initial_mode)

    @app.route("/demo")
    def demo_page():
        demo_seed = {
            "calmQuestions": [
                "Let's keep it simple - what's been sitting at the top of your mind this morning?",
                "What's one thing you want to make clearer before the day ends?",
                "If today felt 20% lighter, what would change first?",
                "What is one next step that would help you feel grounded?",
            ],
            "urgentQuestions": [
                "If you could only fix one thing in the next hour, what would it be?",
                "What is the highest-risk issue right now?",
                "What is the fastest move that reduces pressure immediately?",
                "What must be done first to stop things from getting worse?",
            ],
            "voiceSamples": {
                "calm": "I have this big project deadline next week and I cannot focus on where to begin.",
                "urgent": "Everything feels urgent and I need a clear first action right now.",
            },
            "steps": 4,
        }
        return render_template(
            "demo.html",
            demo_seed=demo_seed,
            session_mode=False,
            board_href="",
        )

    @app.route("/session")
    def session_page():
        demo_seed = {
            "calmQuestions": [
                "Let's keep it simple - what's been sitting at the top of your mind this morning?",
                "What's one thing you want to make clearer before the day ends?",
                "If today felt 20% lighter, what would change first?",
                "What is one next step that would help you feel grounded?",
            ],
            "urgentQuestions": [
                "If you could only fix one thing in the next hour, what would it be?",
                "What is the highest-risk issue right now?",
                "What is the fastest move that reduces pressure immediately?",
                "What must be done first to stop things from getting worse?",
            ],
            "voiceSamples": {
                "calm": "I have this big project deadline next week and I cannot focus on where to begin.",
                "urgent": "Everything feels urgent and I need a clear first action right now.",
            },
            "steps": 4,
        }
        return render_template(
            "demo.html",
            demo_seed=demo_seed,
            session_mode=True,
            board_href="/dashboard",
        )

    @app.route("/dashboard")
    def dashboard_page():
        dashboard_seed = {
            "user": {
                "name": "sagesse",
                "email": "sagesse@gmail.com",
            },
            "quotes": [
                "Progress, not perfection.",
                "Clarity comes from action, not thought.",
                "Your future self is cheering you on.",
                "Small steps still move you forward.",
            ],
            "tasks": [
                {
                    "id": 1,
                    "title": "Open project document - write one sentence",
                    "duration": "~5 min",
                    "category": "Work",
                    "priority": "HIGH",
                    "due": "",
                    "done": False,
                },
                {
                    "id": 2,
                    "title": "Reply to manager's email",
                    "duration": "~5 min",
                    "category": "Work",
                    "priority": "MED",
                    "due": "",
                    "done": False,
                },
                {
                    "id": 3,
                    "title": "Set a 25-minute Pomodoro timer",
                    "duration": "~1 min",
                    "category": "Work",
                    "priority": "LOW",
                    "due": "",
                    "done": False,
                },
                {
                    "id": 4,
                    "title": "Write section outline (bullet points only)",
                    "duration": "~20 min",
                    "category": "Work",
                    "priority": "LOW",
                    "due": "",
                    "done": False,
                },
                {
                    "id": 5,
                    "title": "Drink water and take a 5-min walk",
                    "duration": "~10 min",
                    "category": "Health",
                    "priority": "LOW",
                    "due": "",
                    "done": False,
                },
                {
                    "id": 6,
                    "title": "Deep work block: draft first full section",
                    "duration": "~25 min",
                    "category": "Work",
                    "priority": "LOW",
                    "due": "",
                    "done": False,
                },
            ],
            "priorityWeights": {
                "Work": 3,
                "Health": 3,
                "Relationships": 3,
                "Finance": 3,
                "Personal Growth": 2,
                "Spirituality": 2,
                "Family": 3,
            },
        }
        return render_template("dashboard.html", dashboard_seed=dashboard_seed)

    try:
        from app.routes.user_routes import user_bp
        from app.routes.task_routes import task_bp

        app.register_blueprint(user_bp, url_prefix="/users")
        app.register_blueprint(task_bp, url_prefix="/tasks")
    except Exception:
        # Keep the app bootable even when database env vars are not set.
        pass

    return app
