# Cage Soundscape API Documentation

This document outlines the API endpoints and Socket.IO events available in the Cage Soundscape application.

## RESTful API Endpoints

### Weather Data

#### GET `/api/weather/<city>`

Fetches weather data for a specified city and transforms it into musical parameters.

**Parameters:**
- `city` (path parameter): The name of the city to fetch weather data for

**Response:**
```json
{
  "status": "success",
  "data": {
    "pitch_base": 70,
    "tempo": 90,
    "reverb": 0.2,
    "filter_freq": 200,
    "note_density": 0.56,
    "scale": [0, 2, 4, 5, 7, 9, 11],
    "raw_temperature": 22.89,
    "raw_humidity": 22,
    "raw_wind": 7.72,
    "raw_clouds": 0,
    "raw_pressure": 1016,
    "weather_code": 800,
    "weather_main": "Clear",
    "weather_description": "clear sky",
    "location": "New York, US"
  }
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Error message details"
}
```

**Status Codes:**
- `200 OK`: Weather data fetched successfully
- `400 Bad Request`: Invalid city name or weather API error
- `500 Internal Server Error`: Server-side errors

## Socket.IO Events

### Client to Server Events

#### `connect`

Emitted automatically when a client connects to the Socket.IO server.

**Response:**
```json
{
  "status": "connected"
}
```

#### `disconnect`

Emitted automatically when a client disconnects from the Socket.IO server.

#### `get_random_data`

Request random data to be used as a data source for the soundscape.

**Parameters:** None

### Server to Client Events

#### `connection_response`

Sent in response to a client connection.

**Data:**
```json
{
  "status": "connected"
}
```

#### `random_data`

Sent in response to a `get_random_data` event.

**Data:**
```json
{
  "values": [0.5, -0.2, 1.1, ...],
  "tempo": 120,
  "density": 0.65,
  "timbre": 0.33
}
```

## Data Processing

### Weather Data Mapping

The application maps weather data to musical parameters as follows:

| Weather Parameter | Musical Parameter | Range |
|-------------------|-------------------|-------|
| Temperature | Pitch Base | 36-84 (MIDI notes, C2-C6) |
| Humidity | Reverb | 0-0.9 |
| Wind Speed | Tempo | 60-180 BPM |
| Cloud Coverage | Filter Frequency | 200-10000 Hz |
| Pressure | Note Density | 0.1-0.9 |
| Weather Condition | Musical Scale | Various scales (major, minor, etc.) |

### Scale Selection by Weather Condition

| Weather Code | Description | Scale |
|--------------|-------------|-------|
| 2xx | Thunderstorm | Diminished [0, 3, 6, 9] |
| 3xx | Drizzle | Minor Pentatonic [0, 3, 5, 7, 10] |
| 5xx | Rain | Minor Pentatonic [0, 3, 5, 7, 10] |
| 7xx | Atmospheric | Whole Tone [0, 2, 4, 6, 8, 10] |
| 800 | Clear | Major [0, 2, 4, 5, 7, 9, 11] |
| 8xx | Clouds | Minor [0, 2, 3, 5, 7, 8, 10] |
| 9xx | Extreme | Chromatic Fragments [0, 1, 3, 7, 8, 11] |

## Microphone Data Processing

When microphone input is enabled, the application:

1. Captures audio using the Web Audio API
2. Analyzes amplitude and frequency data
3. Maps audio characteristics to musical parameters:
   - Amplitude → Pitch modification (±12 semitones)
   - Amplitude → Note density modifier (0-1)
   - Amplitude → Volume modifier (0-1)

## Data Combination Logic

When multiple data sources are active, the application combines them as follows:

1. Weather data provides the base parameters
2. Microphone data modifies pitch, density, and volume
3. Random data subtly influences tempo and occasionally adds random notes
4. User controls provide final adjustments to all parameters