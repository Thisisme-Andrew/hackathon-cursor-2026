from app import create_app
from app.db.checkconnection import check_connection

app = create_app()
check_connection()

if __name__ == "__main__":
    app.run(debug=True)
