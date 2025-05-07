# Cage Soundscape Installation Guide

This guide provides step-by-step instructions for setting up and running the Cage Soundscape application on your local machine or a server.

## Prerequisites

Before you begin, ensure you have the following:

- Python 3.11 or newer
- pip (Python package installer)
- Git (optional, for cloning the repository)
- OpenWeatherMap API key (sign up at [OpenWeatherMap](https://openweathermap.org/api))

## Installation Steps

### 1. Get the Code

#### Option A: Clone the Repository

```bash
git clone https://github.com/yourusername/cage-soundscape.git
cd cage-soundscape
```

#### Option B: Download the Source Code

Download the source code as a ZIP file and extract it to a folder of your choice.

### 2. Set Up Python Environment

It's recommended to use a virtual environment:

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install flask flask-socketio flask-sqlalchemy gunicorn numpy python-dotenv requests email-validator psycopg2-binary
```

Or if you prefer to use the pyproject.toml file:

```bash
pip install -e .
```

### 4. Set Environment Variables

Create a `.env` file in the root directory with the following content:

```
WEATHER_API_KEY=your_openweathermap_api_key
SESSION_SECRET=a_secure_random_string_for_sessions
```

Replace `your_openweathermap_api_key` with your actual API key and `a_secure_random_string_for_sessions` with a random string for securing Flask sessions.

### 5. Run the Application

#### Development Mode

```bash
python app.py
```

This will start the application in development mode on http://localhost:5000.

#### Production Mode with Gunicorn

```bash
gunicorn --bind 0.0.0.0:5000 --reuse-port --reload main:app
```

## Deployment Options

### Deploying on Replit

1. Create a new Replit project
2. Upload the project files or connect your GitHub repository
3. Add the environment secrets:
   - Go to "Secrets" in the sidebar
   - Add `WEATHER_API_KEY` with your OpenWeatherMap API key
   - Add `SESSION_SECRET` with a secure random string
4. Run the application using the provided configuration

### Deploying on a VPS or Cloud Server

1. Set up a server with Python installed
2. Clone or upload the application code
3. Install dependencies as described above
4. Set environment variables:
   ```bash
   export WEATHER_API_KEY=your_openweathermap_api_key
   export SESSION_SECRET=a_secure_random_string_for_sessions
   ```
5. Run with Gunicorn:
   ```bash
   gunicorn --bind 0.0.0.0:5000 --workers 4 main:app
   ```
6. (Optional) Set up Nginx as a reverse proxy

### Using Docker

If you prefer to use Docker, create a Dockerfile in the root directory:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1
ENV PORT=5000

EXPOSE 5000

CMD gunicorn --bind 0.0.0.0:$PORT main:app
```

Then build and run the Docker container:

```bash
docker build -t cage-soundscape .
docker run -p 5000:5000 --env-file .env cage-soundscape
```

## Troubleshooting

### Common Issues

#### Application won't start

- Check if all dependencies are installed
- Verify the correct Python version (3.11+)
- Ensure the `.env` file exists with the required variables

#### Weather API not working

- Verify your OpenWeatherMap API key is valid
- Check internet connectivity
- Look for error messages in the server logs

#### No sound in the browser

- Make sure your browser supports Web Audio API (most modern browsers do)
- Check if JavaScript is enabled
- Try a different browser (Chrome or Firefox recommended)

#### Socket.IO connection issues

- Check for firewall or proxy restrictions
- Ensure the correct port is open
- Try disabling browser extensions that might interfere

### Getting Help

If you encounter issues not covered here:

1. Check the server logs for error messages
2. Look for similar issues in the repository's issue tracker
3. Review the API documentation for the external services being used

## Updating the Application

To update to the latest version:

1. Pull the latest changes or download the newest version
2. Install any new dependencies that might have been added
3. Check for changes to the required environment variables
4. Restart the application

## Additional Resources

- [OpenWeatherMap API Documentation](https://openweathermap.org/api)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Tone.js Documentation](https://tonejs.github.io/)
- [D3.js Documentation](https://d3js.org/)