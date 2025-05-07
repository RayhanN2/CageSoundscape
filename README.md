# Cage Soundscape Generator

A web-based indeterministic soundscape generator inspired by John Cage's work that creates unique musical experiences from real-time data streams.

![Cage Soundscape Screenshot](https://i.imgur.com/6WUOuLy.png)

## About the Project

Cage Soundscape reimagines "The Pavilion" by creating tailored musical experiences that adapt to each listener, emphasizing personal exploration and choice in the listening experience. Drawing inspiration from John Cage's indeterministic composition techniques, this application transforms real-time environmental data into ever-changing soundscapes.

### Features

- **Multiple Data Sources**: Uses weather data, microphone input, and random data to influence the music generation
- **Real-time Visualization**: Visual representation of the notes and musical parameters
- **Interactive Controls**: Adjust various parameters like volume, reverb, and note density
- **Indeterministic Composition**: True to John Cage's aesthetic, no two listening experiences are the same

## Technical Overview

### Architecture

The application follows a client-server architecture:

- **Backend**: Python Flask server with RESTful API endpoints and Socket.IO for real-time communication
- **Frontend**: JavaScript with modular components for data processing, sound generation, and visualization

### Key Components

1. **Data Sources Module**: Manages retrieval and processing of data from various sources
   - Weather API integration
   - Microphone input processing
   - Random data generation

2. **Soundscape Generator**: Creates the musical composition
   - Uses Tone.js for sound synthesis
   - Maps environmental parameters to musical elements
   - Implements indeterministic algorithms inspired by Cage

3. **Visualizer**: Creates real-time visualizations
   - Uses D3.js for data representation
   - Shows note events and sound parameters

### Data Mapping

| Environmental Data | Musical Parameter |
|-------------------|-------------------|
| Temperature | Pitch range (colder = lower pitch, warmer = higher pitch) |
| Humidity | Reverb (higher humidity = more reverb) |
| Wind Speed | Tempo (stronger wind = faster tempo) |
| Cloud Coverage | Filter frequency |
| Pressure | Note density |
| Weather Condition | Musical scale (clear = major, clouds = minor, etc.) |

## Setup and Installation

### Prerequisites

- Python 3.11+
- OpenWeatherMap API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install flask flask-socketio flask-sqlalchemy gunicorn numpy python-dotenv requests
   ```
3. Set environment variables:
   - `WEATHER_API_KEY`: Your OpenWeatherMap API key
   - `SESSION_SECRET`: Secret key for Flask session

### Running the Application

1. Start the application:
   ```bash
   gunicorn --bind 0.0.0.0:5000 --reuse-port --reload main:app
   ```
2. Access the application at `http://localhost:5000`

## Usage Guide

1. **Data Sources**:
   - **Weather Data**: Enter a city name and click "Fetch" to load current weather data
   - **Microphone Input**: Toggle to use your microphone's audio input to influence the sound
   - **Random Data**: Toggle to add randomization to the sound parameters

2. **Controls**:
   - Use the sliders to adjust master volume, note density, tempo offset, and reverb
   - Click "Start" to begin generating sound
   - Click "Stop" to end the sound generation

3. **Visualization**:
   - The visualization area displays notes as they're played
   - The right panel shows current data sources and sound parameters

## Technical Details

### Backend

- Flask application with Socket.IO integration for real-time communication
- RESTful API endpoints for data retrieval
- Data processing utilities for normalizing and mapping data to musical parameters

### Frontend

- Modular JavaScript architecture:
  - `data_sources.js`: Manages data retrieval and processing
  - `soundscape.js`: Handles sound generation using Tone.js
  - `visualizer.js`: Creates visualizations with D3.js

### Dependencies

- **Backend**:
  - Flask
  - Flask-SocketIO
  - NumPy
  - Requests

- **Frontend**:
  - Socket.IO client
  - Tone.js
  - D3.js
  - Bootstrap

## Design Philosophy

The application embodies John Cage's philosophy of indeterminism in several ways:

1. **Environmental Influence**: Just as Cage used environmental sounds as music, this application uses environmental data (weather) to shape the composition.

2. **Chance Operations**: Random elements and unpredictable data sources introduce chance into the composition process.

3. **Non-intentionality**: The composer (in this case, the program) sets up a system of rules but doesn't determine the exact outcome.

4. **Listener as Co-creator**: By choosing data sources and adjusting parameters, the listener participates in shaping the music.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by John Cage's innovative composition techniques
- Weather data provided by OpenWeatherMap API
- Built with Tone.js, D3.js, and Flask