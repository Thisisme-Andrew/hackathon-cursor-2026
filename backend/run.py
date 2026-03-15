from app import create_app
from app.db.checkconnection import check_connection

app = create_app()

if __name__ == "__main__":
    # Best-effort DB check for local visibility; never block app startup.
    try:
        check_connection()
    except Exception as exc:
        print(f"[WARN] DB check skipped: {exc}")
    app.run(debug=True)
