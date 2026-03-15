import os
from flask import Flask, render_template, request
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config


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
        # Render the frontend landing page for quick local testing.
        return render_template("index.html")

    @app.route("/auth")
    def auth_page():
        initial_mode = request.args.get("mode", "signup")
        if initial_mode not in {"login", "signup"}:
            initial_mode = "signup"
        return render_template("auth.html", initial_mode=initial_mode)

    try:
        from app.routes.user_routes import user_bp
        from app.routes.auth_routes import auth_bp

        app.register_blueprint(user_bp, url_prefix="/users")
        app.register_blueprint(auth_bp,url_prefix="/auth")
    except Exception:
        # Keep the app bootable even when database env vars are not set.
        pass

    return app
