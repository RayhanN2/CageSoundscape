/**
 * Cage Soundscape Generator
 * Generates indeterministic music inspired by John Cage
 * using real-time data from various sources
 */
class SoundscapeGenerator {
    constructor() {
        // Tone.js components
        this.synths = [];
        this.effects = {};
        this.isPlaying = false;
        this.nextNoteTime = 0;
        this.interval = null;
        this.currentParams = null;
        
        // User control elements
        this.startButton = document.getElementById('startButton');
        this.stopButton = document.getElementById('stopButton');
        this.masterVolumeSlider = document.getElementById('masterVolumeSlider');
        this.masterVolumeValue = document.getElementById('masterVolumeValue');
        this.densitySlider = document.getElementById('densitySlider');
        this.densityValue = document.getElementById('densityValue');
        this.tempoOffsetSlider = document.getElementById('tempoOffsetSlider');
        this.tempoOffsetValue = document.getElementById('tempoOffsetValue');
        this.reverbSlider = document.getElementById('reverbSlider');
        this.reverbValue = document.getElementById('reverbValue');
        
        // Configure UI
        this.configureControls();
        
        // Initialize data sources
        this.dataSources = window.dataSources;
        this.dataSources.onDataUpdated(this.handleDataUpdate.bind(this));
        
        // Initialize visualizer
        this.visualizer = window.visualizer;
    }
    
    /**
     * Configure the UI controls for the soundscape
     */
    configureControls() {
        // Start/stop buttons
        this.startButton.addEventListener('click', () => this.start());
        this.stopButton.addEventListener('click', () => this.stop());
        
        // Master volume control
        this.masterVolumeSlider.addEventListener('input', () => {
            const volume = this.masterVolumeSlider.value / 100;
            this.masterVolumeValue.textContent = `${this.masterVolumeSlider.value}%`;
            if (this.isPlaying) {
                Tone.Destination.volume.value = Tone.gainToDb(volume);
            }
        });
        
        // Density control
        this.densitySlider.addEventListener('input', () => {
            this.densityValue.textContent = `${this.densitySlider.value}%`;
        });
        
        // Tempo offset control
        this.tempoOffsetSlider.addEventListener('input', () => {
            this.tempoOffsetValue.textContent = `${this.tempoOffsetSlider.value > 0 ? '+' : ''}${this.tempoOffsetSlider.value}`;
        });
        
        // Reverb control
        this.reverbSlider.addEventListener('input', () => {
            const reverb = this.reverbSlider.value / 100;
            this.reverbValue.textContent = `${this.reverbSlider.value}%`;
            if (this.isPlaying && this.effects.reverb) {
                this.effects.reverb.wet.value = reverb;
            }
        });
    }
    
    /**
     * Initialize Tone.js and audio components
     */
    async initAudio() {
        try {
            // Start audio context
            await Tone.start();
            console.log('Audio initialized');
            
            // Create synths
            this.createSynths();
            
            // Create effects
            this.createEffects();
            
            // Set initial volume
            const volume = this.masterVolumeSlider.value / 100;
            Tone.Destination.volume.value = Tone.gainToDb(volume);
            
        } catch (error) {
            console.error('Audio initialization error:', error);
            alert('Error initializing audio: ' + error.message);
        }
    }
    
    /**
     * Create synth instruments for sound generation
     */
    createSynths() {
        // Clear any existing synths
        this.synths.forEach(synth => synth.dispose());
        this.synths = [];
        
        // Create 8 synths with different settings
        const synthTypes = [
            {
                type: 'synth',
                options: {
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
                }
            },
            {
                type: 'synth',
                options: {
                    oscillator: { type: 'triangle' },
                    envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 2 }
                }
            },
            {
                type: 'fm',
                options: {
                    harmonicity: 1.5,
                    modulationIndex: 2,
                    envelope: { attack: 0.1, decay: 0.2, sustain: 0.2, release: 1.5 }
                }
            },
            {
                type: 'am',
                options: {
                    harmonicity: 2,
                    envelope: { attack: 0.3, decay: 0.5, sustain: 0.3, release: 2 }
                }
            },
            {
                type: 'synth',
                options: {
                    oscillator: { type: 'square' },
                    envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.5 }
                }
            },
            {
                type: 'pluck',
                options: {
                    attackNoise: 2,
                    dampening: 4000,
                    resonance: 0.95
                }
            },
            {
                type: 'synth',
                options: {
                    oscillator: { type: 'sawtooth' },
                    envelope: { attack: 0.02, decay: 0.15, sustain: 0.2, release: 1 }
                }
            },
            {
                type: 'metal',
                options: {
                    harmonicity: 5.1,
                    modulationIndex: 32,
                    resonance: 4000,
                    octaves: 1.5
                }
            }
        ];
        
        // Create each synth and connect to effects chain
        synthTypes.forEach(config => {
            let synth;
            
            switch (config.type) {
                case 'fm':
                    synth = new Tone.FMSynth(config.options);
                    break;
                case 'am':
                    synth = new Tone.AMSynth(config.options);
                    break;
                case 'pluck':
                    synth = new Tone.PluckSynth(config.options);
                    break;
                case 'metal':
                    synth = new Tone.MetalSynth(config.options);
                    break;
                default:
                    synth = new Tone.Synth(config.options);
            }
            
            // Set initial volume (will be adjusted based on instrument)
            synth.volume.value = -12;
            
            this.synths.push(synth);
        });
    }
    
    /**
     * Create audio effects chain
     */
    createEffects() {
        // Dispose any existing effects
        Object.values(this.effects).forEach(effect => {
            if (effect && typeof effect.dispose === 'function') {
                effect.dispose();
            }
        });
        
        this.effects = {};
        
        // Create filter
        this.effects.filter = new Tone.Filter({
            type: 'lowpass',
            frequency: 5000,
            rolloff: -24
        });
        
        // Create reverb
        this.effects.reverb = new Tone.Reverb({
            decay: 5,
            wet: this.reverbSlider.value / 100
        });
        
        // Create delay
        this.effects.delay = new Tone.FeedbackDelay({
            delayTime: 0.25,
            feedback: 0.2,
            wet: 0.3
        });
        
        // Create compressor
        this.effects.compressor = new Tone.Compressor({
            threshold: -20,
            ratio: 6
        });
        
        // Connect effects chain
        this.effects.reverb.generate().then(() => {
            // Connect synths to effects chain
            this.synths.forEach(synth => {
                synth.connect(this.effects.filter);
            });
            
            // Connect effects in chain
            this.effects.filter.connect(this.effects.delay);
            this.effects.delay.connect(this.effects.reverb);
            this.effects.reverb.connect(this.effects.compressor);
            this.effects.compressor.toDestination();
        });
    }
    
    /**
     * Start the soundscape generation
     */
    async start() {
        if (this.isPlaying) return;
        
        // Initialize audio system
        await this.initAudio();
        
        // Update UI
        this.startButton.disabled = true;
        this.stopButton.disabled = false;
        document.getElementById('visualizer-container').classList.add('soundscape-active');
        
        // Start sound generation
        this.isPlaying = true;
        this.nextNoteTime = Tone.now();
        
        // Start visualizer
        this.visualizer.start();
        
        // Request initial data if needed
        if (this.dataSources.randomDataToggle.checked && !this.dataSources.randomData) {
            this.dataSources.fetchRandomData();
        }
        
        if (this.dataSources.weatherToggle.checked && !this.dataSources.weatherData) {
            this.dataSources.fetchWeatherData(this.dataSources.cityInput.value);
        }
        
        // Start background processes
        this.scheduleNotes();
        this.interval = setInterval(() => this.scheduleNotes(), 1000);
    }
    
    /**
     * Stop the soundscape generation
     */
    stop() {
        if (!this.isPlaying) return;
        
        // Update UI
        this.isPlaying = false;
        this.startButton.disabled = false;
        this.stopButton.disabled = true;
        document.getElementById('visualizer-container').classList.remove('soundscape-active');
        
        // Stop sound generation
        clearInterval(this.interval);
        this.interval = null;
        
        // Stop and dispose synths - handle different synth types
        this.synths.forEach(synth => {
            try {
                // Different synth types have different methods to release all notes
                if (typeof synth.releaseAll === 'function') {
                    synth.releaseAll();
                } else if (typeof synth.triggerRelease === 'function') {
                    synth.triggerRelease();
                }
                // Allow a small amount of time for release before disconnecting
                // This prevents clicks and pops
            } catch (e) {
                console.log('Error stopping synth:', e);
            }
        });
        
        // Stop visualizer
        this.visualizer.stop();
    }
    
    /**
     * Handle data updates from the data sources
     */
    handleDataUpdate(data) {
        if (!this.isPlaying) return;
        
        // Apply user control modifications
        const params = { ...data.combined };
        
        // Apply density adjustment
        params.note_density = params.note_density * (this.densitySlider.value / 50);
        
        // Apply tempo adjustment
        params.tempo += parseInt(this.tempoOffsetSlider.value);
        
        // Apply reverb adjustment
        params.reverb = this.reverbSlider.value / 100;
        
        // Update effects
        if (this.effects.filter) {
            this.effects.filter.frequency.value = params.filter_freq || 2000;
        }
        
        if (this.effects.reverb) {
            this.effects.reverb.wet.value = params.reverb;
        }
        
        // Store current parameters
        this.currentParams = params;
        
        // Update visualizer params display
        this.visualizer.updateParamsDisplay(params);
    }
    
    /**
     * Schedule notes to be played
     */
    scheduleNotes() {
        if (!this.isPlaying || !this.currentParams) return;
        
        const now = Tone.now();
        const params = this.currentParams;
        
        // Calculate note scheduling details
        const tempo = params.tempo || 120;
        const secondsPerBeat = 60 / tempo;
        const noteProbability = params.note_density || 0.5;
        const scale = params.scale || [0, 2, 4, 5, 7, 9, 11]; // Default to major scale
        const pitchBase = params.pitch_base || 60; // Middle C
        
        // Schedule for the next 2 seconds
        for (let t = this.nextNoteTime; t < now + 2; t += secondsPerBeat / 4) {
            // Determine if we should play a note at this time (based on density)
            if (Math.random() < noteProbability * 0.4) {
                // Schedule notes with some randomness
                this.scheduleNote(t, scale, pitchBase);
            }
        }
        
        // Update next note time
        this.nextNoteTime = now + 2;
    }
    
    /**
     * Schedule a note to be played at a specific time
     */
    scheduleNote(time, scale, pitchBase) {
        if (!this.isPlaying || !this.synths.length) return;
        
        // Randomly select a synth
        const synthIndex = Math.floor(Math.random() * this.synths.length);
        const synth = this.synths[synthIndex];
        
        // Select a note from the scale
        const scaleIndex = Math.floor(Math.random() * scale.length);
        const scaleNote = scale[scaleIndex];
        
        // Determine octave variation (-1, 0, or 1 octaves from base)
        const octaveVariation = Math.floor(Math.random() * 3) - 1;
        
        // Calculate final MIDI note number
        const midiNote = pitchBase + scaleNote + (octaveVariation * 12);
        
        // Convert MIDI note to frequency
        const frequency = Tone.Frequency(midiNote, "midi");
        
        // Determine velocity (volume) and duration
        let velocity = 0.3 + Math.random() * 0.5;
        let duration = (0.1 + Math.random() * 0.9) * 2;
        
        // Adjust velocity and duration based on synth type
        if (synthIndex === 5) { // PluckSynth needs special handling
            velocity = 0.8;
            duration = 1.5;
        }
        
        // Schedule the note
        synth.triggerAttackRelease(frequency, duration, time, velocity);
        
        // Add note to visualizer
        this.visualizer.addNote(midiNote, velocity, duration * 1000);
    }
}

// Create the soundscape generator when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.soundscapeGenerator = new SoundscapeGenerator();
});
