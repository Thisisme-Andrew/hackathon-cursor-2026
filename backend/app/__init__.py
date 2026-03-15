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
        return render_template("demo.html", demo_seed=demo_seed)

    try:
        from app.routes.user_routes import user_bp

        app.register_blueprint(user_bp, url_prefix="/users")
    except Exception:
        # Keep the app bootable even when database env vars are not set.
        pass

    return app
