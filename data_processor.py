import numpy as np
import logging

def normalize_data(data, min_val, max_val, target_min=0, target_max=1):
    """
    Normalize data to a specific range
    
    Args:
        data: The data to normalize
        min_val: The minimum value in the source range
        max_val: The maximum value in the source range
        target_min: The minimum value in the target range
        target_max: The maximum value in the target range
        
    Returns:
        Normalized data in the target range
    """
    if max_val == min_val:
        return 0.5  # Return middle value if range is zero
    
    normalized = (data - min_val) / (max_val - min_val)
    scaled = normalized * (target_max - target_min) + target_min
    return scaled

def process_weather_data(weather_data):
    """
    Process weather data to extract values useful for sound generation
    
    Args:
        weather_data: Raw weather data from OpenWeatherMap API
        
    Returns:
        Dictionary of processed values for sound generation
    """
    try:
        # Extract key parameters that will influence the soundscape
        temperature = weather_data.get('main', {}).get('temp', 20)
        humidity = weather_data.get('main', {}).get('humidity', 50)
        wind_speed = weather_data.get('wind', {}).get('speed', 5)
        clouds = weather_data.get('clouds', {}).get('all', 50)
        pressure = weather_data.get('main', {}).get('pressure', 1013)
        
        # Get weather condition code
        weather_code = weather_data.get('weather', [{}])[0].get('id', 800)
        
        # Map temperature to pitch range (C2 to C6 - in MIDI notes)
        # Colder = lower pitch, warmer = higher pitch
        pitch_base = normalize_data(temperature, -20, 40, 36, 84)
        
        # Map humidity to reverb
        reverb = normalize_data(humidity, 0, 100, 0, 0.9)
        
        # Map wind speed to tempo (60-180 BPM)
        tempo = normalize_data(wind_speed, 0, 30, 60, 180)
        
        # Map cloud coverage to filter frequency
        filter_freq = normalize_data(clouds, 0, 100, 200, 10000)
        
        # Map pressure to note density
        note_density = normalize_data(pressure, 970, 1050, 0.1, 0.9)
        
        # Generate a scale based on weather condition
        # Different weather types = different scales/modes
        scales = {
            # Thunderstorm (2xx) - diminished scale
            '2': [0, 3, 6, 9],
            # Drizzle/Rain (3xx, 5xx) - minor pentatonic
            '3': [0, 3, 5, 7, 10],
            '5': [0, 3, 5, 7, 10],
            # Atmospheric (7xx) - whole tone scale
            '7': [0, 2, 4, 6, 8, 10],
            # Clear (800) - major scale
            '800': [0, 2, 4, 5, 7, 9, 11],
            # Clouds (8xx) - minor scale
            '8': [0, 2, 3, 5, 7, 8, 10],
            # Extreme (9xx) - chromatic fragments
            '9': [0, 1, 3, 7, 8, 11]
        }
        
        # Select appropriate scale based on weather code
        scale_key = str(weather_code)
        if scale_key not in scales:
            # Get first digit for general category
            scale_key = scale_key[0]
        if scale_key not in scales:
            scale_key = '800'  # Default to major scale
            
        # Return processed and normalized values
        return {
            'pitch_base': int(pitch_base),
            'tempo': int(tempo),
            'reverb': float(reverb),
            'filter_freq': float(filter_freq),
            'note_density': float(note_density),
            'scale': scales[scale_key],
            'raw_temperature': temperature,
            'raw_humidity': humidity,
            'raw_wind': wind_speed,
            'raw_clouds': clouds,
            'raw_pressure': pressure,
            'weather_code': weather_code,
            'weather_main': weather_data.get('weather', [{}])[0].get('main', 'Clear'),
            'weather_description': weather_data.get('weather', [{}])[0].get('description', 'clear sky'),
            'location': weather_data.get('name', 'Unknown') + ', ' + weather_data.get('sys', {}).get('country', '')
        }
        
    except Exception as e:
        logging.error(f"Error processing weather data: {str(e)}")
        # Return default values if processing fails
        return {
            'pitch_base': 60,
            'tempo': 120,
            'reverb': 0.3,
            'filter_freq': 2000,
            'note_density': 0.5,
            'scale': [0, 2, 4, 5, 7, 9, 11],
            'error': str(e)
        }

def convert_mic_data_to_sound_params(audio_data):
    """
    Process microphone input data to extract sound generation parameters
    
    Args:
        audio_data: Raw audio data from the microphone
        
    Returns:
        Dictionary of processed values for sound generation
    """
    try:
        # Convert audio data to numpy array if needed
        if not isinstance(audio_data, np.ndarray):
            audio_data = np.array(audio_data)
        
        # Calculate some basic audio features
        amplitude = np.abs(audio_data).mean()
        spectral_centroid = np.sum(np.abs(audio_data) * np.arange(len(audio_data))) / np.sum(np.abs(audio_data)) if np.sum(np.abs(audio_data)) > 0 else 0
        
        # Normalize and map to sound parameters
        volume = normalize_data(amplitude, 0, 1, 0.1, 1.0)
        pitch_shift = normalize_data(spectral_centroid, 0, len(audio_data)/2, -12, 12)
        
        return {
            'volume': float(volume),
            'pitch_shift': float(pitch_shift),
            'raw_amplitude': float(amplitude),
            'raw_spectral_centroid': float(spectral_centroid) if not np.isnan(spectral_centroid) else 0
        }
        
    except Exception as e:
        logging.error(f"Error processing microphone data: {str(e)}")
        return {
            'volume': 0.5,
            'pitch_shift': 0,
            'error': str(e)
        }
