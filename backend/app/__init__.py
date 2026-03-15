import os
from flask import Flask, render_template, request
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config


CALM_QUESTIONS = [
    "Let's keep it simple - what's been sitting at the top of your mind this morning?",
    "What's one thing you want to make clearer before the day ends?",
    "If today felt 20% lighter, what would change first?",
    "What is one next step that would help you feel grounded?",
    "What made you smile recently?",
]

URGENT_QUESTIONS = [
    "If you could only fix one thing in the next hour, what would it be?",
    "What is the highest-risk issue right now?",
    "What is the fastest move that reduces pressure immediately?",
]

# Activities for each mode
CALM_ACTIVITIES = [
    "Take a slow, deep breath for 20 seconds.",
    "Stretch your arms and relax your shoulders for 20 seconds.",
    "Close your eyes and count 10 slow breaths.",
    "Smile gently and notice how you feel for 20 seconds.",
    "Write down one thing you're grateful for.",
    "Stand up and do a gentle side stretch for 20 seconds.",
    "Sip some water and notice the sensation.",
    "Look out the window and notice something new.",
    "Roll your shoulders and neck gently for 20 seconds.",
    "Wiggle your fingers and toes for 20 seconds.",
]
URGENT_ACTIVITIES = [
    "Pause for a 20-second breathing session: inhale deeply, exhale slowly.",
    "Stand up and shake out your hands for 20 seconds.",
    "Look away from the screen and focus on a distant object for 20 seconds.",
    "Quickly write down your top priority for the next 10 minutes.",
    "Splash some water on your face or wash your hands.",
    "Do 10 jumping jacks or march in place for 20 seconds.",
    "Tense and relax your fists 5 times.",
    "Take 3 slow, deep breaths and exhale fully.",
    "Stretch your arms overhead and hold for 10 seconds.",
    "Close your eyes and count to 20 slowly.",
]

VOICE_SAMPLES = {
    "calm": "I have this big project deadline next week and I cannot focus on where to begin.",
    "urgent": "Everything feels urgent and I need a clear first action right now.",
}

DASHBOARD_QUOTES = [
    "Progress, not perfection.",
    "Clarity comes from action, not thought.",
    "Your future self is cheering you on.",
    "Small steps still move you forward.",
]

DEFAULT_PRIORITY_WEIGHTS = {
    "Work": 3,
    "Health": 3,
    "Relationships": 3,
    "Finance": 3,
    "Personal Growth": 2,
    "Spirituality": 2,
    "Family": 3,
}


def _safe_next_url(next_url):
    if isinstance(next_url, str) and next_url.startswith("/"):
        return next_url
    return "/dashboard"


def _build_demo_seed(include_user=False):
    seed = {
        "calmQuestions": CALM_QUESTIONS,
        "urgentQuestions": URGENT_QUESTIONS,
        "calmActivities": CALM_ACTIVITIES,
        "urgentActivities": URGENT_ACTIVITIES,
        "voiceSamples": VOICE_SAMPLES,
        "steps": 5,  # default to calm mode steps
    }
    if include_user:
        seed["user"] = Config.DEMO_USER
    return seed


def _build_dashboard_seed():
    return {
        "user": Config.DEMO_USER,
        "quotes": DASHBOARD_QUOTES,
        "tasks": [],
        "priorityWeights": DEFAULT_PRIORITY_WEIGHTS,
    }


def _register_blueprints(app):
    # Core CRUD/API blueprints.
    try:
        from app.routes.user_routes import user_bp
        from app.routes.task_routes import task_bp
        from app.routes.auth_routes import auth_bp

        app.register_blueprint(user_bp, url_prefix="/users")
        app.register_blueprint(task_bp, url_prefix="/tasks")
        app.register_blueprint(auth_bp, url_prefix="/auth")
    except Exception:
        # Keep the app bootable even when database env vars are not set.
        pass

    # NLP/speech routes are optional and should not block startup.
    try:
        from app.routes.speech_routes import speech_bp

        app.register_blueprint(speech_bp, url_prefix="/speech")
    except Exception:
        # Keep the app bootable even when GROQ_API_KEY/deps are not set.
        pass


def create_app():
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    app = Flask(
        __name__,
        template_folder=os.path.join(project_root, "frontend", "templates"),
        static_folder=os.path.join(project_root, "frontend", "static"),
    )
    CORS(app)
    JWTManager(app)
    app.config.from_object(Config)

    @app.route("/")
    def home():
        return render_template("index.html")

    @app.route("/auth")
    def auth_page():
        initial_mode = request.args.get("mode", "signup")
        if initial_mode not in {"login", "signup"}:
            initial_mode = "signup"
        next_url = _safe_next_url(request.args.get("next", "/dashboard"))
        return render_template(
            "auth.html", initial_mode=initial_mode, next_url=next_url
        )

    @app.route("/demo")
    def demo_page():
        return render_template(
            "demo.html",
            demo_seed=_build_demo_seed(include_user=False),
            session_mode=False,
            board_href="",
        )

    @app.route("/session")
    def session_page():
        return render_template(
            "demo.html",
            demo_seed=_build_demo_seed(include_user=True),
            session_mode=True,
            board_href="/dashboard",
        )

    @app.route("/dashboard")
    def dashboard_page():
        return render_template("dashboard.html", dashboard_seed=_build_dashboard_seed())

    _register_blueprints(app)
    return app
