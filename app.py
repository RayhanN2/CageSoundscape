import os
import logging
import json
import requests
import numpy as np
from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv
from utils.data_processor import process_weather_data, normalize_data

# Configure logging
logging.basicConfig(level=logging.DEBUG)
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "cage_soundscape_secret")
socketio = SocketIO(app, cors_allowed_origins="*")

# API Keys and configs
WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY", "")
logging.debug(f"Weather API Key length: {len(WEATHER_API_KEY)}")
logging.debug(f"Weather API Key first 4 chars: {WEATHER_API_KEY[:4] if WEATHER_API_KEY else 'None'}")

@app.route("/")
def index():
    """Render the main soundscape page"""
    return render_template("index.html")

@app.route("/about")
def about():
    """Render the about page with information on John Cage and the project concept"""
    return render_template("about.html")

@app.route("/api/weather/<city>")
def get_weather_data(city):
    """Get weather data for specified city"""
    try:
        logging.debug(f"Fetching weather data for city: {city}")
        
        # Make sure we have an API key
        if not WEATHER_API_KEY:
            logging.error("Weather API key is missing or empty")
            return jsonify({"status": "error", "message": "Weather API key is missing. Please check your environment variables."}), 400
        
        # Construct the URL with proper encoding
        url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_API_KEY}&units=metric"
        logging.debug(f"Weather API URL: {url.replace(WEATHER_API_KEY, 'API_KEY_HIDDEN')}")
        
        # Make the request with explicit timeout
        response = requests.get(url, timeout=10)
        logging.debug(f"Weather API response status: {response.status_code}")
        
        # Log the full response for debugging
        logging.debug(f"Weather API response content: {response.text[:500]}")
        
        if response.status_code == 200:
            weather_data = response.json()
            processed_data = process_weather_data(weather_data)
            return jsonify({"status": "success", "data": processed_data})
        else:
            error_text = response.text
            logging.error(f"Weather API error: Status {response.status_code}, Response: {error_text}")
            return jsonify({"status": "error", "message": f"Weather API error: {response.status_code} - {error_text}"}), 400
    except requests.exceptions.Timeout:
        logging.error("Weather API request timed out")
        return jsonify({"status": "error", "message": "Weather API request timed out. Please try again."}), 500
    except requests.exceptions.RequestException as e:
        logging.error(f"Request error fetching weather data: {str(e)}")
        return jsonify({"status": "error", "message": f"Network error: {str(e)}"}), 500
    except Exception as e:
        logging.error(f"Error fetching weather data: {str(e)}")
        return jsonify({"status": "error", "message": f"An unexpected error occurred: {str(e)}"}), 500

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logging.debug("Client connected")
    emit('connection_response', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logging.debug("Client disconnected")

@socketio.on('get_random_data')
def handle_random_data():
    """Generate random data for the soundscape when requested"""
    # Generate some random data as a fallback or additional source
    random_data = {
        'values': np.random.normal(0, 1, 10).tolist(),
        'tempo': np.random.randint(60, 180),
        'density': np.random.random(),
        'timbre': np.random.random()
    }
    emit('random_data', random_data)

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
