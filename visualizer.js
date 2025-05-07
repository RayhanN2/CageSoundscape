/**
 * Soundscape Visualizer 
 * Creates real-time visualizations of the sound generation process
 */
class Visualizer {
    constructor() {
        this.container = document.getElementById('visualizer-canvas');
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        this.isPlaying = false;
        this.currentNotes = [];
        this.noteHistory = [];
        this.historyMaxLength = 100;
        
        // D3 visualization setup
        this.setupVisualization();
        
        // Window resize event
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    /**
     * Set up the D3 visualization
     */
    setupVisualization() {
        // Create SVG container
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${this.width} ${this.height}`)
            .style('background-color', 'transparent');
        
        // Create group for musical notes
        this.notesGroup = this.svg.append('g')
            .attr('class', 'notes-group');
            
        // Create time axis
        this.timeAxisGroup = this.svg.append('g')
            .attr('class', 'time-axis')
            .attr('transform', `translate(0, ${this.height - 30})`);
            
        // Create pitch axis
        this.pitchAxisGroup = this.svg.append('g')
            .attr('class', 'pitch-axis')
            .attr('transform', 'translate(30, 0)');
            
        // Create scales
        this.setupScales();
    }
    
    /**
     * Set up the D3 scales for visualization
     */
    setupScales() {
        // X scale (time)
        this.xScale = d3.scaleLinear()
            .domain([0, 10000]) // 10 seconds of history
            .range([50, this.width - 20]);
            
        // Y scale (pitch)
        this.yScale = d3.scaleLinear()
            .domain([30, 90]) // MIDI note range
            .range([this.height - 50, 20]);
            
        // Size scale (velocity/volume)
        this.sizeScale = d3.scaleLinear()
            .domain([0, 1])
            .range([5, 15]);
            
        // Create axes
        this.xAxis = d3.axisBottom(this.xScale)
            .ticks(5)
            .tickFormat(d => `${d/1000}s`);
            
        this.yAxis = d3.axisLeft(this.yScale)
            .ticks(5)
            .tickFormat(d => this.midiToNoteName(d));
            
        // Draw axes
        this.timeAxisGroup.call(this.xAxis);
        this.pitchAxisGroup.call(this.yAxis);
    }
    
    /**
     * Convert MIDI note number to note name
     */
    midiToNoteName(midi) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const note = noteNames[midi % 12];
        const octave = Math.floor(midi / 12) - 1;
        return `${note}${octave}`;
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        
        // Update scales
        this.xScale.range([50, this.width - 20]);
        this.yScale.range([this.height - 50, 20]);
        
        // Update svg viewBox
        this.svg.attr('viewBox', `0 0 ${this.width} ${this.height}`);
        
        // Update axes
        this.timeAxisGroup
            .attr('transform', `translate(0, ${this.height - 30})`)
            .call(this.xAxis);
            
        this.pitchAxisGroup.call(this.yAxis);
        
        // Redraw
        this.updateVisualization();
    }
    
    /**
     * Start the visualization
     */
    start() {
        this.isPlaying = true;
        this.container.classList.add('active');
        this.startTime = Date.now();
        this.animationFrame = requestAnimationFrame(this.updateTime.bind(this));
    }
    
    /**
     * Stop the visualization
     */
    stop() {
        this.isPlaying = false;
        this.container.classList.remove('active');
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.clear();
    }
    
    /**
     * Clear the visualization
     */
    clear() {
        this.currentNotes = [];
        this.noteHistory = [];
        this.notesGroup.selectAll('*').remove();
    }
    
    /**
     * Update the time for all notes
     */
    updateTime() {
        if (!this.isPlaying) return;
        
        const now = Date.now();
        const elapsed = now - this.startTime;
        
        // Shift time domain if necessary
        if (elapsed > this.xScale.domain()[1] - 2000) {
            const newDomain = [
                elapsed - 8000, 
                elapsed + 2000
            ];
            this.xScale.domain(newDomain);
            this.timeAxisGroup.call(this.xAxis);
        }
        
        // Update visualization
        this.updateVisualization();
        
        // Schedule next update
        this.animationFrame = requestAnimationFrame(this.updateTime.bind(this));
    }
    
    /**
     * Add a new note to visualize
     */
    addNote(midiNote, velocity, duration) {
        const now = Date.now();
        const elapsed = now - this.startTime;
        
        const note = {
            id: `note-${now}-${Math.random()}`,
            midiNote: midiNote,
            velocity: velocity,
            startTime: elapsed,
            duration: duration,
            endTime: elapsed + duration
        };
        
        this.currentNotes.push(note);
        this.noteHistory.push(note);
        
        // Limit history length
        if (this.noteHistory.length > this.historyMaxLength) {
            this.noteHistory.shift();
        }
        
        // Schedule removal of note from current notes
        setTimeout(() => {
            this.currentNotes = this.currentNotes.filter(n => n.id !== note.id);
        }, duration);
    }
    
    /**
     * Update the data visualizations
     */
    updateVisualization() {
        if (!this.isPlaying) return;
        
        const now = Date.now();
        const elapsed = now - this.startTime;
        
        // Update notes display
        const notes = this.notesGroup.selectAll('.note')
            .data(this.noteHistory, d => d.id);
            
        // Exit
        notes.exit().remove();
        
        // Enter
        const noteEnter = notes.enter()
            .append('rect')
            .attr('class', 'note')
            .attr('rx', 3)
            .attr('ry', 3)
            .style('fill', d => this.getNoteFill(d.midiNote))
            .style('opacity', 0.7);
            
        // Update all notes
        noteEnter.merge(notes)
            .attr('x', d => this.xScale(d.startTime))
            .attr('y', d => this.yScale(d.midiNote) - this.sizeScale(d.velocity) / 2)
            .attr('width', d => {
                const width = Math.max(
                    3,
                    (d.endTime < elapsed ? 
                        this.xScale(d.endTime) - this.xScale(d.startTime) : 
                        this.xScale(elapsed) - this.xScale(d.startTime))
                );
                return width;
            })
            .attr('height', d => this.sizeScale(d.velocity))
            .style('stroke', d => d.endTime > elapsed ? '#fff' : 'none')
            .style('stroke-width', d => d.endTime > elapsed ? 1 : 0);
    }
    
    /**
     * Get fill color for a note based on its pitch
     */
    getNoteFill(midiNote) {
        // Map note to color (octave determines hue, note within octave determines brightness)
        const octave = Math.floor(midiNote / 12) - 1;
        const note = midiNote % 12;
        
        const hue = (note * 30) % 360; // Map 12 notes to color wheel
        const lightness = 50 + (octave - 2) * 5; // Adjust lightness by octave
        
        return `hsl(${hue}, 70%, ${lightness}%)`;
    }
    
    /**
     * Update the sound parameters display
     */
    updateParamsDisplay(params) {
        const paramsDisplay = document.getElementById('sound-params-display');
        
        if (!params) {
            paramsDisplay.innerHTML = '<p>Waiting for sound engine...</p>';
            return;
        }
        
        // Format the parameters for display
        let html = `
            <p>Pitch Base: <span class="param-value">${this.midiToNoteName(Math.round(params.pitch_base))}</span></p>
            <p>Tempo: <span class="param-value">${Math.round(params.tempo)} BPM</span></p>
            <p>Note Density: <span class="param-value">${Math.round(params.note_density * 100)}%</span></p>
            <p>Reverb: <span class="param-value">${Math.round(params.reverb * 100)}%</span></p>
            <p>Scale: <span class="param-value">${this.formatScale(params.scale)}</span></p>
        `;
        
        paramsDisplay.innerHTML = html;
    }
    
    /**
     * Format a scale array for display
     */
    formatScale(scale) {
        if (!scale || !scale.length) return 'None';
        
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        return scale.map(note => noteNames[note]).join(', ');
    }
}

// Create and export visualizer instance
window.visualizer = new Visualizer();
