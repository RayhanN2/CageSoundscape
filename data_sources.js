/**
 * Data Sources Module
 * Manages the retrieval and processing of data from various sources
 */
class DataSources {
    constructor() {
        this.socket = io();
        this.weatherData = null;
        this.microphoneData = null;
        this.randomData = null;
        this.microphoneStream = null;
        this.audioContext = null;
        this.analyzer = null;
        this.microphoneDataArray = null;
        this.isProcessingMic = false;
        this.dataCallbacks = [];

        // DOM Elements
        this.cityInput = document.getElementById('cityInput');
        this.fetchWeatherBtn = document.getElementById('fetchWeatherBtn');
        this.weatherToggle = document.getElementById('weatherDataToggle');
        this.microphoneToggle = document.getElementById('microphoneToggle');
        this.randomDataToggle = document.getElementById('randomDataToggle');
        this.currentDataDisplay = document.getElementById('current-data-display');

        // Initialize
        this.setupEventListeners();
        this.setupSocketListeners();
    }

    setupEventListeners() {
        // Weather data fetch
        this.fetchWeatherBtn.addEventListener('click', () => {
            this.fetchWeatherData(this.cityInput.value);
        });

        // Toggle event listeners
        this.weatherToggle.addEventListener('change', () => {
            if (this.weatherToggle.checked && !this.weatherData) {
                this.fetchWeatherData(this.cityInput.value);
            }
            this.notifyDataUpdated();
        });

        this.microphoneToggle.addEventListener('change', () => {
            if (this.microphoneToggle.checked) {
                this.startMicrophoneCapture();
            } else {
                this.stopMicrophoneCapture();
            }
            this.notifyDataUpdated();
        });

        this.randomDataToggle.addEventListener('change', () => {
            if (this.randomDataToggle.checked) {
                this.fetchRandomData();
            } else {
                this.randomData = null;
            }
            this.notifyDataUpdated();
        });
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            if (this.randomDataToggle.checked) {
                this.fetchRandomData();
            }
        });

        this.socket.on('random_data', (data) => {
            this.randomData = data;
            this.notifyDataUpdated();
            this.updateDataDisplay();
        });
    }

    /**
     * Fetch weather data for a given city
     */
    fetchWeatherData(city) {
        if (!city) {
            this.displayError('Please enter a city name');
            return;
        }

        // Show loading indicator
        this.displayMessage(`<i class="fa-solid fa-spinner fa-spin"></i> Fetching weather data for ${city}...`);
        console.log(`Fetching weather data for city: ${city}`);
        
        // Add cache-busting parameter to prevent cached responses
        const cacheBuster = new Date().getTime();
        
        fetch(`/api/weather/${encodeURIComponent(city)}?_=${cacheBuster}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            },
            credentials: 'same-origin'
        })
            .then(response => {
                console.log(`Weather API response status: ${response.status}`);
                return response.text().then(text => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}, Response: ${text}`);
                    }
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        throw new Error(`Invalid JSON response: ${text}`);
                    }
                });
            })
            .then(data => {
                console.log('Weather API response data:', data);
                if (data.status === 'success') {
                    this.weatherData = data.data;
                    this.updateDataDisplay();
                    this.notifyDataUpdated();
                    // Show success message
                    this.displayMessage(`<i class="fa-solid fa-check text-success"></i> Weather data loaded for ${city}`);
                    setTimeout(() => this.updateDataDisplay(), 2000);
                } else {
                    this.displayError(`Error: ${data.message}`);
                }
            })
            .catch(error => {
                this.displayError(`Failed to fetch weather data: ${error.message}`);
                console.error('Weather fetch error:', error);
                // Set weather data to null to prevent using stale data
                this.weatherData = null;
                this.updateDataDisplay();
                this.notifyDataUpdated();
            });
    }

    /**
     * Request random data from the server
     */
    fetchRandomData() {
        this.socket.emit('get_random_data');
    }

    /**
     * Start capturing audio from the microphone
     */
    async startMicrophoneCapture() {
        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.microphoneStream = stream;
            
            // Create audio context and analyzer
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaStreamSource(stream);
            this.analyzer = this.audioContext.createAnalyser();
            this.analyzer.fftSize = 2048;
            
            // Connect source to analyzer
            source.connect(this.analyzer);
            
            // Create data array for analyzer
            const bufferLength = this.analyzer.frequencyBinCount;
            this.microphoneDataArray = new Uint8Array(bufferLength);
            
            // Start processing microphone data
            this.isProcessingMic = true;
            this.processMicrophoneData();
            
            console.log('Microphone capture started');
        } catch (error) {
            this.displayError(`Microphone access error: ${error.message}`);
            console.error('Microphone access error:', error);
            this.microphoneToggle.checked = false;
        }
    }

    /**
     * Process microphone data continuously
     */
    processMicrophoneData() {
        if (!this.isProcessingMic) return;
        
        // Get data from analyzer
        this.analyzer.getByteTimeDomainData(this.microphoneDataArray);
        
        // Convert to normalized array (values 0-1)
        const normalizedData = Array.from(this.microphoneDataArray).map(v => (v - 128) / 128);
        
        // Basic audio analysis
        const amplitude = normalizedData.reduce((sum, val) => sum + Math.abs(val), 0) / normalizedData.length;
        
        // Create processed microphone data
        this.microphoneData = {
            amplitude: amplitude,
            pitch_modifier: Math.min(Math.max(amplitude * 24 - 12, -12), 12), // Range: -12 to 12
            density_modifier: Math.min(amplitude * 2, 1), // Range: 0 to 1
            raw_amplitude: amplitude
        };
        
        // Notify callbacks about data update
        this.notifyDataUpdated();
        this.updateDataDisplay();
        
        // Schedule next processing
        requestAnimationFrame(() => this.processMicrophoneData());
    }

    /**
     * Stop microphone capture
     */
    stopMicrophoneCapture() {
        this.isProcessingMic = false;
        
        if (this.microphoneStream) {
            this.microphoneStream.getTracks().forEach(track => track.stop());
            this.microphoneStream = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close().catch(err => console.error('Error closing audio context:', err));
            this.audioContext = null;
        }
        
        this.analyzer = null;
        this.microphoneDataArray = null;
        this.microphoneData = null;
        
        console.log('Microphone capture stopped');
        this.notifyDataUpdated();
    }

    /**
     * Register a callback to be notified when data is updated
     */
    onDataUpdated(callback) {
        this.dataCallbacks.push(callback);
    }

    /**
     * Notify all registered callbacks that data has been updated
     */
    notifyDataUpdated() {
        const data = this.getCombinedData();
        this.dataCallbacks.forEach(callback => callback(data));
    }

    /**
     * Get combined data from all active sources
     */
    getCombinedData() {
        const result = {
            sources: {
                weather: this.weatherToggle.checked && this.weatherData,
                microphone: this.microphoneToggle.checked && this.microphoneData,
                random: this.randomDataToggle.checked && this.randomData
            }
        };
        
        // Calculate combined parameters
        result.combined = this.calculateCombinedParameters(result.sources);
        
        return result;
    }

    /**
     * Calculate combined parameters from all active data sources
     */
    calculateCombinedParameters(sources) {
        // Default values
        let params = {
            pitch_base: 60,         // Middle C
            tempo: 120,             // BPM
            reverb: 0.3,            // 0-1
            filter_freq: 2000,      // Hz
            note_density: 0.5,      // 0-1
            scale: [0, 2, 4, 5, 7, 9, 11], // Major scale
            volume: 0.75            // 0-1
        };
        
        // Apply weather data if available
        if (sources.weather) {
            params.pitch_base = sources.weather.pitch_base;
            params.tempo = sources.weather.tempo;
            params.reverb = sources.weather.reverb;
            params.filter_freq = sources.weather.filter_freq;
            params.note_density = sources.weather.note_density;
            params.scale = sources.weather.scale;
        }
        
        // Apply microphone data if available
        if (sources.microphone) {
            // Modify parameters based on microphone input
            params.pitch_base += sources.microphone.pitch_modifier || 0;
            params.note_density = Math.min(
                params.note_density * (1 + sources.microphone.density_modifier || 0), 
                1
            );
            params.volume = Math.min(
                params.volume * (1 + sources.microphone.amplitude * 2), 
                1
            );
        }
        
        // Apply random data if available
        if (sources.random) {
            // Subtly modify parameters with random data
            params.tempo += (sources.random.tempo - 120) * 0.2;
            params.note_density = (params.note_density + sources.random.density * 0.3) / 1.3;
            
            // Occasionally add random notes to the scale
            if (Math.random() < 0.1) {
                const randomNote = Math.floor(Math.random() * 12);
                if (!params.scale.includes(randomNote)) {
                    params.scale = [...params.scale, randomNote].sort((a, b) => a - b);
                }
            }
        }
        
        // Apply user control modifiers
        // These will be connected in the soundscape.js module
        
        return params;
    }

    /**
     * Update the data display in the UI
     */
    updateDataDisplay() {
        const data = this.getCombinedData();
        let html = '';
        
        // Show active sources
        if (data.sources.weather) {
            html += `<p><strong>Weather:</strong> ${data.sources.weather.weather_main} in ${data.sources.weather.location}</p>`;
            html += `<p>Temp: ${data.sources.weather.raw_temperature}°C, Wind: ${data.sources.weather.raw_wind} m/s</p>`;
        }
        
        if (data.sources.microphone) {
            html += `<p><strong>Microphone:</strong> Active (amplitude: ${data.sources.microphone.raw_amplitude.toFixed(2)})</p>`;
        }
        
        if (data.sources.random) {
            html += `<p><strong>Random Data:</strong> Active</p>`;
        }
        
        if (html === '') {
            html = '<p>No data sources active</p>';
        }
        
        this.currentDataDisplay.innerHTML = html;
    }

    /**
     * Display an error message in the data display
     */
    displayError(message) {
        this.currentDataDisplay.innerHTML = `<p class="text-danger">${message}</p>`;
        setTimeout(() => this.updateDataDisplay(), 3000);
    }
    
    /**
     * Display an informational message in the data display
     */
    displayMessage(message) {
        this.currentDataDisplay.innerHTML = `<p>${message}</p>`;
    }
}

// Create and export data sources instance
window.dataSources = new DataSources();
