# app.py
"""
Flask + Flask-SocketIO application for Cage Soundscape.

Gunicorn command for Cloud Run:
    gunicorn -k eventlet -b :$PORT app:app
"""

import os
import logging
import json
import requests
import numpy as np
from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv

from utils.data_processor import process_weather_data

load_dotenv()
logging.basicConfig(level=logging.INFO)

# ──────────────────────────────────────────────────────────
# Application factory (optional but recommended)
# ──────────────────────────────────────────────────────────
def create_app():
    app = Flask(__name__, static_folder="static", static_url_path="/static")
    app.secret_key = os.getenv("SESSION_SECRET", "cage_soundscape_secret")

    socketio = SocketIO(app, cors_allowed_origins="*")  # eventlet / gevent

    WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "")

    # ─── Routes ────────────────────────────────────────────
    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/about")
    def about():
        return render_template("about.html")

    @app.route("/api/weather/<city>")
    def get_weather(city):
        if not WEATHER_API_KEY:
            return jsonify(
                {"status": "error", "message": "Missing WEATHER_API_KEY"}
            ), 400

        url = (
            "https://api.openweathermap.org/data/2.5/weather"
            f"?q={city}&appid={WEATHER_API_KEY}&units=metric"
        )
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                data = process_weather_data(resp.json())
                return jsonify({"status": "success", "data": data})
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": f"Weather API error {resp.status_code}",
                    }
                ),
                resp.status_code,
            )
        except requests.exceptions.RequestException as e:
            logging.error(f"Weather API request failed: {e}")
            return (
                jsonify({"status": "error", "message": str(e)}),
                500,
            )

    # ─── SocketIO events ──────────────────────────────────
    @socketio.on("connect")
    def handle_connect():
        emit("connection_response", {"status": "connected"})

    @socketio.on("disconnect")
    def handle_disconnect():
        logging.info("Client disconnected")

    @socketio.on("get_random_data")
    def handle_random_data():
        random_data = {
            "values": np.random.normal(0, 1, 10).tolist(),
            "tempo": int(np.random.randint(60, 180)),
            "density": float(np.random.random()),
            "timbre": float(np.random.random()),
        }
        emit("random_data", random_data)

    # Expose socketio for Gunicorn eventlet worker
    app.socketio = socketio
    return app


# ──────────────────────────────────────────────────────────
# Global objects for simple "app:app" target
# ──────────────────────────────────────────────────────────
app = create_app()
socketio = app.socketio  # pylint: disable=invalid-name

# ──────────────────────────────────────────────────────────
# Local development entry-point
# ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Run with the integrated eventlet server locally
    socketio.run(app, host="0.0.0.0", port=8080, debug=True)
