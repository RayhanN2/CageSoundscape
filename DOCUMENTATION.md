# Cage Soundscape Documentation

Welcome to the documentation for the Cage Soundscape project, an indeterministic music generator inspired by John Cage.

## Documentation Index

### For Users

- [**README.md**](README.md) - Project overview and general information
- [**USER_GUIDE.md**](USER_GUIDE.md) - Detailed guide on how to use the application
- [**INSTALLATION.md**](INSTALLATION.md) - Instructions for installing and setting up the application

### For Developers

- [**ARCHITECTURE.md**](ARCHITECTURE.md) - Technical architecture and codebase overview
- [**API_DOCUMENTATION.md**](API_DOCUMENTATION.md) - API endpoints and Socket.IO event documentation

## Quick Start

1. Ensure you have Python 3.11+ installed
2. Get an OpenWeatherMap API key
3. Set up environment variables:
   ```
   WEATHER_API_KEY=your_api_key
   SESSION_SECRET=your_session_secret
   ```
4. Install dependencies:
   ```bash
   pip install flask flask-socketio flask-sqlalchemy gunicorn numpy python-dotenv requests email-validator psycopg2-binary
   ```
5. Run the application:
   ```bash
   gunicorn --bind 0.0.0.0:5000 --reuse-port --reload main:app
   ```
6. Open http://localhost:5000 in your browser

## About John Cage

John Cage (1912-1992) was an American composer, music theorist, and artist known for his innovative approaches to composition. Cage embraced chance, indeterminacy, and environmental sounds in his work, challenging traditional notions of music and composition.

His most famous piece, 4'33", consists of a performer not playing their instrument for the specified duration, drawing attention to the ambient sounds that constitute an unintended musical experience.

The Cage Soundscape application honors his legacy by creating indeterministic compositions that incorporate environmental data (weather) and chance operations, allowing each listener to experience a unique, unrepeatable musical performance.

## Project Philosophy

This project is built on several key principles inspired by Cage's work:

1. **Indeterminism**: The music generated is never the same twice
2. **Environmental influence**: External data shapes the musical output
3. **Listener participation**: Users can influence the composition through their choices
4. **Process over product**: The system of generation is more important than any single output

## Contributing

Contributions to the Cage Soundscape project are welcome. Please see the documentation files for technical details about the codebase.

## License

This project is licensed under the MIT License.