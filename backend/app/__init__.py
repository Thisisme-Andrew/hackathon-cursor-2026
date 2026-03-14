from flask import Flask

def create_app():
    app = Flask(__name__)

    @app.route("/")
    def home():
        return "Server is running please"

    from app.routes.user_routes import user_bp
    app.register_blueprint(user_bp, url_prefix="/users")

    return app
