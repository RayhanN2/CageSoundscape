# Cage Soundscape Technical Architecture

This document outlines the technical architecture of the Cage Soundscape application, designed to aid developers in understanding and extending the codebase.

## System Overview

The Cage Soundscape application is built on a client-server architecture:

- **Backend**: Python Flask application providing API endpoints and Socket.IO support
- **Frontend**: JavaScript modules for data processing, sound generation, and visualization

## Directory Structure

```
├── static/
│   ├── css/
│   │   └── custom.css
│   └── js/
│       ├── data_sources.js
│       ├── soundscape.js
│       └── visualizer.js
├── templates/
│   ├── about.html
│   └── index.html
├── utils/
│   └── data_processor.py
├── app.py
└── main.py
```

## Backend Architecture

### Application Initialization (`app.py`)

The main Flask application is defined in `app.py`:

- Initializes Flask and Socket.IO
- Configures API endpoints
- Sets up Socket.IO event handlers
- Loads environment variables (including API keys)

### Data Processing (`utils/data_processor.py`)

Contains utility functions for processing and transforming data:

- `normalize_data()`: Normalizes values to specific ranges
- `process_weather_data()`: Transforms raw weather API data into musical parameters
- `convert_mic_data_to_sound_params()`: Processes microphone input data

### API Endpoints

The application provides the following RESTful endpoints:

- `GET /`: Serves the main application page
- `GET /about`: Serves the about page
- `GET /api/weather/<city>`: Returns processed weather data for a specified city

### Socket.IO Events

Real-time communication is handled via Socket.IO:

- `connect`: Handles client connection
- `disconnect`: Handles client disconnection
- `get_random_data`: Generates and returns random data

## Frontend Architecture

The frontend is organized into three main JavaScript modules:

### Data Sources Module (`data_sources.js`)

Responsible for retrieving and processing data from various sources:

- Weather API integration
- Microphone input processing
- Random data generation
- Socket.IO communication
- Data transformation and normalization

Key classes and methods:
- `DataSources` class: Manages all data sources
  - `fetchWeatherData()`: Retrieves weather data
  - `startMicrophoneCapture()`: Captures microphone input
  - `fetchRandomData()`: Requests random data from server
  - `getCombinedData()`: Combines data from all active sources

### Soundscape Generator (`soundscape.js`)

Creates the musical composition using Tone.js:

- Initializes audio components
- Creates synth instruments
- Establishes audio effects chain
- Schedules and plays notes based on data inputs

Key classes and methods:
- `SoundscapeGenerator` class: Manages sound generation
  - `initAudio()`: Sets up Tone.js audio context
  - `createSynths()`: Initializes the synthesizers
  - `createEffects()`: Sets up reverb, delay, and filters
  - `scheduleNotes()`: Plans which notes will play and when
  - `handleDataUpdate()`: Processes incoming data

### Visualizer (`visualizer.js`)

Creates real-time visualizations using D3.js:

- Sets up the visualization canvas
- Renders notes as they're played
- Updates the display of current sound parameters
- Handles responsive resizing

Key classes and methods:
- `Visualizer` class: Manages the visual representation
  - `setupVisualization()`: Initializes D3.js visualization
  - `addNote()`: Adds a new note to the visualization
  - `updateVisualization()`: Redraws the visualization
  - `updateParamsDisplay()`: Shows current sound parameters

## Data Flow

1. User interacts with the interface (toggling data sources, adjusting controls)
2. `data_sources.js` retrieves data from selected sources
3. Data is processed and normalized (both in backend and frontend)
4. `soundscape.js` receives the processed data and updates sound parameters
5. Notes are scheduled and played through Tone.js
6. `visualizer.js` renders the notes and updates the parameter display

## Key Technologies

### Backend
- **Flask**: Web framework
- **Flask-SocketIO**: Real-time communication
- **NumPy**: Numerical computing for data processing
- **Requests**: HTTP requests to external APIs

### Frontend
- **Tone.js**: Audio synthesis and processing
- **D3.js**: Data visualization
- **Socket.IO Client**: Real-time communication
- **Web Audio API**: Microphone input processing
- **Bootstrap**: UI framework

## Design Patterns

The application implements several design patterns:

### Observer Pattern
- Used for notifying components about data updates
- `onDataUpdated()` and `notifyDataUpdated()` methods in `DataSources` class

### Factory Pattern
- Used for creating synth instruments and effects in `SoundscapeGenerator`

### Strategy Pattern
- Different data sources can be toggled on/off, providing different strategies for sound generation

### MVC Pattern
- **Model**: Data sources and processing (`data_sources.js`)
- **View**: Visualization and UI (`visualizer.js`)
- **Controller**: Sound generation and business logic (`soundscape.js`)

## Extending the Application

### Adding a New Data Source

1. Create a new method in `DataSources` class to fetch/process the data
2. Add a toggle control in the UI (index.html)
3. Update the `getCombinedData()` method to include the new source
4. Update the `calculateCombinedParameters()` method to apply the data

### Adding New Sound Parameters

1. Add the parameter to the result of `calculateCombinedParameters()`
2. Update the `handleDataUpdate()` method in `SoundscapeGenerator`
3. Add any new UI controls in index.html
4. Update the visualization in `Visualizer.updateParamsDisplay()`

### Adding a New Visualization Type

1. Create a new method in the `Visualizer` class
2. Initialize any necessary D3.js components
3. Connect it to the data flow via the observer pattern
4. Add any UI controls for toggling or configuring the visualization

## Performance Considerations

- Audio processing is CPU-intensive
- D3.js visualizations can be memory-intensive with many elements
- Socket.IO connections may experience latency on slow networks
- Microphone input processing might add additional CPU load

## Security Considerations

- API keys are stored in environment variables
- No user authentication is implemented (not required for current functionality)
- Cross-Origin Resource Sharing (CORS) is enabled for Socket.IO
- No personal data is collected or stored