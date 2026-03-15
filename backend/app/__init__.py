import os
from flask import Flask, render_template


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

    try:
        from app.routes.user_routes import user_bp

        app.register_blueprint(user_bp, url_prefix="/users")
    except Exception:
        # Keep the app bootable even when database env vars are not set.
        pass

    return app
