/**
 * Cellular Automata Music Composer
 * 
 * This module implements a 2D cellular automata that generates musical compositions.
 * The CA grid is mapped to musical notes where:
 * - Columns represent time steps (generations)
 * - Rows represent different pitches in a chosen scale
 * - Living cells trigger notes to play
 */

// ============================================================================
// CELLULAR AUTOMATA ENGINE
// ============================================================================

class CellularAutomata {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = this.createEmptyGrid();
        this.history = []; // Store all generations for playback
        
        // Default to Game of Life rules (B3/S23)
        this.birthRule = [3];
        this.surviveRule = [2, 3];
    }
    
    /**
     * Create an empty grid filled with zeros
     */
    createEmptyGrid() {
        return Array(this.height).fill(null).map(() => 
            Array(this.width).fill(0)
        );
    }
    
    /**
     * Initialize grid with random cells based on density percentage
     */
    randomize(density = 0.3) {
        this.grid = this.grid.map(row => 
            row.map(() => Math.random() < density ? 1 : 0)
        );
        this.history = [this.copyGrid(this.grid)];
    }
    
    /**
     * Create a deep copy of a grid
     */
    copyGrid(grid) {
        return grid.map(row => [...row]);
    }
    
    /**
     * Set the rules for the CA
     * @param {number[]} birth - Array of neighbor counts that cause birth
     * @param {number[]} survive - Array of neighbor counts that allow survival
     */
    setRules(birth, survive) {
        this.birthRule = birth;
        this.surviveRule = survive;
    }
    
    /**
     * Count living neighbors for a cell (Moore neighborhood - 8 neighbors)
     */
    countNeighbors(x, y) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                // Wrap around edges (toroidal topology)
                const nx = (x + dx + this.width) % this.width;
                const ny = (y + dy + this.height) % this.height;
                count += this.grid[ny][nx];
            }
        }
        return count;
    }
    
    /**
     * Compute the next generation based on current rules
     */
    nextGeneration() {
        const newGrid = this.createEmptyGrid();
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const neighbors = this.countNeighbors(x, y);
                const alive = this.grid[y][x] === 1;
                
                if (alive) {
                    // Cell survives if neighbor count is in survive rule
                    newGrid[y][x] = this.surviveRule.includes(neighbors) ? 1 : 0;
                } else {
                    // Cell is born if neighbor count is in birth rule
                    newGrid[y][x] = this.birthRule.includes(neighbors) ? 1 : 0;
                }
            }
        }
        
        this.grid = newGrid;
        this.history.push(this.copyGrid(this.grid));
    }
    
    /**
     * Generate multiple generations
     */
    generateGenerations(count) {
        for (let i = 0; i < count; i++) {
            this.nextGeneration();
        }
    }
    
    /**
     * Get a column from a specific generation (for music playback)
     * Returns array of row indices where cells are alive
     */
    getActiveRowsForGeneration(genIndex, column) {
        if (genIndex >= this.history.length) return [];
        const generation = this.history[genIndex];
        const activeRows = [];
        for (let y = 0; y < this.height; y++) {
            if (generation[y][column] === 1) {
                activeRows.push(y);
            }
        }
        return activeRows;
    }
    
    /**
     * Get all active cells for a generation
     */
    getGenerationGrid(genIndex) {
        if (genIndex >= this.history.length) return null;
        return this.history[genIndex];
    }
    
    /**
     * Reset to initial state
     */
    reset() {
        this.grid = this.createEmptyGrid();
        this.history = [];
    }
}

// ============================================================================
// MUSIC THEORY - SCALES AND NOTE MAPPING
// ============================================================================

const SCALES = {
    pentatonic: [0, 2, 4, 7, 9],           // Major pentatonic
    pentatonic_minor: [0, 3, 5, 7, 10],    // Minor pentatonic
    major: [0, 2, 4, 5, 7, 9, 11],         // Major scale
    minor: [0, 2, 3, 5, 7, 8, 10],         // Natural minor
    dorian: [0, 2, 3, 5, 7, 9, 10],        // Dorian mode
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    whole_tone: [0, 2, 4, 6, 8, 10],       // Whole tone scale
    blues: [0, 3, 5, 6, 7, 10],            // Blues scale
    harmonic_minor: [0, 2, 3, 5, 7, 8, 11], // Harmonic minor
    phrygian: [0, 1, 3, 5, 7, 8, 10],      // Phrygian mode (Spanish/Eastern)
    lydian: [0, 2, 4, 6, 7, 9, 11],        // Lydian mode (dreamy)
    mixolydian: [0, 2, 4, 5, 7, 9, 10],    // Mixolydian (funk/rock)
    japanese: [0, 1, 5, 7, 8],             // Japanese Hirajoshi
    diminished: [0, 2, 3, 5, 6, 8, 9, 11]  // Diminished (horror)
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// CA rule presets
const RULE_PRESETS = {
    life: { birth: [3], survive: [2, 3] },
    highlife: { birth: [3, 6], survive: [2, 3] },
    daynight: { birth: [3, 6, 7, 8], survive: [3, 4, 6, 7, 8] },
    seeds: { birth: [2], survive: [] },
    diamoeba: { birth: [3, 5, 6, 7, 8], survive: [5, 6, 7, 8] }
};

// Genre presets - configure scale, root, bpm, waveform for different musical styles
const GENRE_PRESETS = {
    ambient: {
        scale: 'pentatonic',
        root: 'A',
        bpm: 45,
        waveform: 'sine',
        description: 'Slow, peaceful pentatonic tones'
    },
    jazz: {
        scale: 'dorian',
        root: 'D',
        bpm: 90,
        waveform: 'triangle',
        description: 'Smooth dorian mode, medium tempo'
    },
    electronic: {
        scale: 'minor',
        root: 'A',
        bpm: 128,
        waveform: 'sawtooth',
        description: 'Fast-paced minor key with rich harmonics'
    },
    classical: {
        scale: 'major',
        root: 'C',
        bpm: 72,
        waveform: 'triangle',
        description: 'Traditional major scale, moderate tempo'
    },
    blues: {
        scale: 'blues',
        root: 'E',
        bpm: 80,
        waveform: 'triangle',
        description: 'Soulful blues scale with bent notes feel'
    },
    horror: {
        scale: 'diminished',
        root: 'D#',
        bpm: 50,
        waveform: 'sawtooth',
        description: 'Unsettling diminished patterns'
    },
    funk: {
        scale: 'mixolydian',
        root: 'E',
        bpm: 110,
        waveform: 'square',
        description: 'Groovy mixolydian with punchy tones'
    }
};

/**
 * Convert MIDI note number to frequency
 */
function midiToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Get MIDI note number from note name
 */
function noteNameToMidi(name) {
    const octaveMatch = name.match(/\d+/);
    const octave = octaveMatch ? parseInt(octaveMatch[0]) : 4;
    const noteName = name.replace(/\d+/, '');
    const noteIndex = NOTE_NAMES.indexOf(noteName);
    return (octave + 1) * 12 + noteIndex;
}

/**
 * Generate an array of MIDI notes for a given scale and range
 */
function generateScaleNotes(rootNote, scaleType, numNotes) {
    const scale = SCALES[scaleType];
    const rootMidi = noteNameToMidi(rootNote + '3'); // Start from octave 3
    const notes = [];
    
    let octaveOffset = 0;
    let scaleIndex = 0;
    
    for (let i = 0; i < numNotes; i++) {
        const midi = rootMidi + octaveOffset * 12 + scale[scaleIndex];
        notes.push(midi);
        
        scaleIndex++;
        if (scaleIndex >= scale.length) {
            scaleIndex = 0;
            octaveOffset++;
        }
    }
    
    return notes;
}

/**
 * Get the note names for display
 */
function getScaleNoteNames(rootNote, scaleType) {
    const scale = SCALES[scaleType];
    const rootIndex = NOTE_NAMES.indexOf(rootNote);
    return scale.map(interval => NOTE_NAMES[(rootIndex + interval) % 12]);
}

// ============================================================================
// WEB AUDIO SYNTHESIZER
// ============================================================================

class Synthesizer {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.waveform = 'triangle';
        this.volume = 0.5;
        this.activeOscillators = [];
        this.sustainedNotes = new Map(); // frequency -> {osc, gainNode} for held notes
    }
    
    /**
     * Initialize or resume the audio context
     */
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.volume;
            
            // Create a compressor to prevent clipping
            this.compressor = this.audioContext.createDynamicsCompressor();
            this.compressor.threshold.value = -24;
            this.compressor.knee.value = 30;
            this.compressor.ratio.value = 12;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;
            this.compressor.connect(this.masterGain);
        }
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    /**
     * Set master volume
     */
    setVolume(value) {
        this.volume = value;
        if (this.masterGain) {
            this.masterGain.gain.value = value;
        }
    }
    
    /**
     * Set waveform type
     */
    setWaveform(type) {
        this.waveform = type;
    }
    
    /**
     * Play a note with ADSR envelope
     * @param {number} velocity - Volume multiplier 0-1 (default 0.5)
     * @param {boolean} accented - If true, use sharper attack for emphasis
     */
    playNote(frequency, duration = 0.3, startTime = null, velocity = 0.5, accented = false) {
        if (!this.audioContext) return;
        
        // Rule 2: Clamp frequency below Nyquist (sampleRate / 2)
        const nyquist = this.audioContext.sampleRate / 2;
        const safeFreq = Math.min(frequency, nyquist - 100);
        if (safeFreq <= 20) return; // Don't play inaudible frequencies
        
        const now = startTime || this.audioContext.currentTime;
        
        // Create oscillator
        const osc = this.audioContext.createOscillator();
        osc.type = this.waveform;
        osc.frequency.value = safeFreq;
        
        // Create gain for envelope
        const gainNode = this.audioContext.createGain();
        // Rule 3: Start at 0 amplitude
        gainNode.gain.setValueAtTime(0, now);
        
        // Connect: osc -> gain -> compressor
        osc.connect(gainNode);
        gainNode.connect(this.compressor);
        
        // Smooth ADSR envelope - longer attack and release for smoother sound
        const attack = accented ? 0.02 : 0.08;
        const decay = 0.1;
        const sustainLevel = 0.6;
        const release = Math.min(duration * 0.4, 0.5); // Release is 40% of duration, max 0.5s
        
        // Rule 1: Clamp velocity and ensure amplitude never exceeds 0.8 (safe headroom)
        const safeVelocity = Math.min(Math.max(velocity, 0), 1);
        const noteVolume = Math.min(0.12 * safeVelocity, 0.8);
        
        // Attack - smooth ramp from 0
        gainNode.gain.linearRampToValueAtTime(noteVolume, now + attack);
        
        // Decay to sustain level
        gainNode.gain.linearRampToValueAtTime(noteVolume * sustainLevel, now + attack + decay);
        
        // Hold sustain for most of the note
        const sustainEnd = now + duration - release;
        if (sustainEnd > now + attack + decay) {
            gainNode.gain.setValueAtTime(noteVolume * sustainLevel, sustainEnd);
        }
        
        // Rule 3: Smooth exponential release to near-zero, then linear to 0
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration - 0.02);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);
        
        // Start and stop oscillator - stop AFTER gain reaches 0
        osc.start(now);
        osc.stop(now + duration + 0.1);
        
        // Track active oscillator for cleanup
        this.activeOscillators.push({ osc, gainNode });
        
        // Cleanup after note ends
        osc.onended = () => {
            const index = this.activeOscillators.findIndex(o => o.osc === osc);
            if (index !== -1) {
                this.activeOscillators.splice(index, 1);
            }
        };
    }
    
    /**
     * Play multiple notes with individual velocities and accents
     * @param {Array} notes - Array of {frequency, velocity, accented}
     */
    playNotes(notes, duration = 0.3, startTime = null) {
        notes.forEach(({ frequency, velocity, accented }) => {
            this.playNote(frequency, duration, startTime, velocity, accented);
        });
    }
    
    /**
     * Stop all playing notes
     */
    stopAll() {
        const now = this.audioContext ? this.audioContext.currentTime : 0;
        this.activeOscillators.forEach(({ osc, gainNode }) => {
            try {
                gainNode.gain.cancelScheduledValues(now);
                gainNode.gain.setValueAtTime(gainNode.gain.value, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
                osc.stop(now + 0.1);
            } catch (e) {
                // Oscillator may have already stopped
            }
        });
        this.activeOscillators = [];
    }
    
    /**
     * Get current audio time
     */
    getCurrentTime() {
        return this.audioContext ? this.audioContext.currentTime : 0;
    }
    
    // ========================================================================
    // PERCUSSION SOUNDS (noise-based)
    // ========================================================================
    
    /**
     * Create white noise buffer
     */
    createNoiseBuffer(duration = 1) {
        const sampleRate = this.audioContext.sampleRate;
        const bufferSize = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }
    
    /**
     * Play a kick drum sound
     */
    playKick(velocity = 0.7) {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        
        // Rule 1: Clamp velocity
        const safeVelocity = Math.min(Math.max(velocity, 0), 1);
        const peakGain = Math.min(safeVelocity * 0.6, 0.8);
        
        // Kick uses a sine oscillator with pitch drop
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        
        // Rule 3: Start at 0, quick attack, decay to 0 before stop
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(peakGain, now + 0.005); // 5ms attack
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.3); // Ensure 0 at end
        
        osc.connect(gainNode);
        gainNode.connect(this.compressor);
        
        osc.start(now);
        osc.stop(now + 0.35); // Stop after gain is 0
    }
    
    /**
     * Play a hi-hat sound (filtered noise)
     */
    playHiHat(velocity = 0.5, open = false) {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const duration = open ? 0.3 : 0.08;
        
        // Rule 1: Clamp velocity
        const safeVelocity = Math.min(Math.max(velocity, 0), 1);
        const peakGain = Math.min(safeVelocity * 0.25, 0.8);
        
        // Create noise source
        const noise = this.audioContext.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.5);
        
        // High-pass filter for metallic sound (Rule 2: keep below Nyquist)
        const nyquist = this.audioContext.sampleRate / 2;
        const highpass = this.audioContext.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = Math.min(7000, nyquist - 1000);
        
        // Bandpass for character
        const bandpass = this.audioContext.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = Math.min(10000, nyquist - 1000);
        bandpass.Q.value = 1;
        
        const gainNode = this.audioContext.createGain();
        // Rule 3: Start at 0, quick attack
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(peakGain, now + 0.002); // 2ms attack
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration - 0.01);
        gainNode.gain.linearRampToValueAtTime(0, now + duration); // Ensure 0 at end
        
        noise.connect(highpass);
        highpass.connect(bandpass);
        bandpass.connect(gainNode);
        gainNode.connect(this.compressor);
        
        noise.start(now);
        noise.stop(now + duration + 0.02); // Stop after gain is 0
    }
    
    /**
     * Play a snare drum sound (noise + tone)
     */
    playSnare(velocity = 0.6) {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        
        // Rule 1: Clamp velocity
        const safeVelocity = Math.min(Math.max(velocity, 0), 1);
        const noisePeak = Math.min(safeVelocity * 0.35, 0.8);
        const oscPeak = Math.min(safeVelocity * 0.4, 0.8);
        
        // Noise component
        const noise = this.audioContext.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.3);
        
        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;
        
        const noiseGain = this.audioContext.createGain();
        // Rule 3: Start at 0
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(noisePeak, now + 0.002);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        noiseGain.gain.linearRampToValueAtTime(0, now + 0.2);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.compressor);
        
        // Tone component (body of the snare)
        const osc = this.audioContext.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        
        const oscGain = this.audioContext.createGain();
        // Rule 3: Start at 0
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(oscPeak, now + 0.002);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
        oscGain.gain.linearRampToValueAtTime(0, now + 0.15);
        
        osc.connect(oscGain);
        oscGain.connect(this.compressor);
        
        noise.start(now);
        noise.stop(now + 0.25); // Stop after gain is 0
        osc.start(now);
        osc.stop(now + 0.2); // Stop after gain is 0
    }
    
    /**
     * Play a click/rimshot sound
     */
    playClick(velocity = 0.5) {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        
        // Rule 1: Clamp velocity
        const safeVelocity = Math.min(Math.max(velocity, 0), 1);
        const peakGain = Math.min(safeVelocity * 0.25, 0.8);
        
        const osc = this.audioContext.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1500, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.02);
        
        const gainNode = this.audioContext.createGain();
        // Rule 3: Start at 0
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(peakGain, now + 0.001); // 1ms attack
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.05); // Ensure 0 at end
        
        osc.connect(gainNode);
        gainNode.connect(this.compressor);
        
        osc.start(now);
        osc.stop(now + 0.06); // Stop after gain is 0
    }
}

// ============================================================================
// VISUALIZATION
// ============================================================================

class CAVisualizer {
    constructor(canvas, ca) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ca = ca;
        this.currentGeneration = 0;
        this.currentColumn = 0;
        this.playingNotes = [];
        
        // Colors - Classic Game of Life green terminal style
        this.colors = {
            background: '#000000',
            dead: '#0a0a0a',
            alive: '#00ff00',
            aliveDim: '#00aa00',
            playhead: 'rgba(255, 255, 0, 0.2)',
            playingNote: '#ffffff',
            grid: '#0a1f0a'
        };
    }
    
    /**
     * Draw the current state of the CA - Classic Game of Life style
     */
    draw(generation = null, playColumn = -1, playingRows = []) {
        const grid = generation !== null 
            ? this.ca.getGenerationGrid(generation)
            : this.ca.grid;
            
        if (!grid) return;
        
        const cellWidth = this.canvas.width / this.ca.width;
        const cellHeight = this.canvas.height / this.ca.height;
        const padding = 1;
        
        // Clear canvas with black background
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines (subtle green)
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.ca.width; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(Math.floor(x * cellWidth) + 0.5, 0);
            this.ctx.lineTo(Math.floor(x * cellWidth) + 0.5, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.ca.height; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, Math.floor(y * cellHeight) + 0.5);
            this.ctx.lineTo(this.canvas.width, Math.floor(y * cellHeight) + 0.5);
            this.ctx.stroke();
        }
        
        // Draw playhead column highlight first (behind cells)
        if (playColumn >= 0 && playColumn < this.ca.width) {
            this.ctx.fillStyle = this.colors.playhead;
            this.ctx.fillRect(
                playColumn * cellWidth,
                0,
                cellWidth,
                this.canvas.height
            );
        }
        
        // Draw cells
        for (let y = 0; y < this.ca.height; y++) {
            for (let x = 0; x < this.ca.width; x++) {
                const alive = grid[y][x] === 1;
                
                if (alive) {
                    // Check if this cell is currently playing
                    const isPlaying = x === playColumn && playingRows.includes(y);
                    
                    const cx = Math.floor(x * cellWidth) + padding;
                    const cy = Math.floor(y * cellHeight) + padding;
                    const cw = Math.floor(cellWidth) - padding * 2;
                    const ch = Math.floor(cellHeight) - padding * 2;
                    
                    if (isPlaying) {
                        // Playing note - bright white with glow effect
                        this.ctx.shadowColor = '#00ff00';
                        this.ctx.shadowBlur = 15;
                        this.ctx.fillStyle = this.colors.playingNote;
                        this.ctx.fillRect(cx, cy, cw, ch);
                        this.ctx.shadowBlur = 0;
                        
                        // Add a bright border
                        this.ctx.strokeStyle = '#00ff00';
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(cx - 1, cy - 1, cw + 2, ch + 2);
                    } else {
                        // Regular alive cell - classic green
                        // Add subtle glow for alive cells
                        this.ctx.shadowColor = '#00ff00';
                        this.ctx.shadowBlur = 4;
                        this.ctx.fillStyle = this.colors.alive;
                        this.ctx.fillRect(cx, cy, cw, ch);
                        this.ctx.shadowBlur = 0;
                    }
                }
            }
        }
    }
    
    /**
     * Draw the live CA grid - all alive cells shown, playing rows highlighted
     */
    drawLive(playingRows = []) {
        const grid = this.ca.grid;
        if (!grid) return;
        
        const cellWidth = this.canvas.width / this.ca.width;
        const cellHeight = this.canvas.height / this.ca.height;
        const padding = 1;
        
        // Clear canvas with black background
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid lines (subtle green)
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.ca.width; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(Math.floor(x * cellWidth) + 0.5, 0);
            this.ctx.lineTo(Math.floor(x * cellWidth) + 0.5, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.ca.height; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, Math.floor(y * cellHeight) + 0.5);
            this.ctx.lineTo(this.canvas.width, Math.floor(y * cellHeight) + 0.5);
            this.ctx.stroke();
        }
        
        // Draw cells
        for (let y = 0; y < this.ca.height; y++) {
            for (let x = 0; x < this.ca.width; x++) {
                const alive = grid[y][x] === 1;
                
                if (alive) {
                    // Check if this row is currently playing (has alive cells)
                    const isPlayingRow = playingRows.includes(y);
                    
                    const cx = Math.floor(x * cellWidth) + padding;
                    const cy = Math.floor(y * cellHeight) + padding;
                    const cw = Math.floor(cellWidth) - padding * 2;
                    const ch = Math.floor(cellHeight) - padding * 2;
                    
                    if (isPlayingRow) {
                        // Playing row - bright green with strong glow
                        this.ctx.shadowColor = '#00ff00';
                        this.ctx.shadowBlur = 10;
                        this.ctx.fillStyle = '#00ff00';
                        this.ctx.fillRect(cx, cy, cw, ch);
                        this.ctx.shadowBlur = 0;
                    } else {
                        // Regular alive cell - dimmer green
                        this.ctx.fillStyle = this.colors.aliveDim;
                        this.ctx.fillRect(cx, cy, cw, ch);
                    }
                }
            }
        }
    }
}

// ============================================================================
// MAIN APPLICATION
// ============================================================================

class CellularAutomataComposer {
    constructor() {
        // CA dimensions - larger board for classic Game of Life feel
        // Rows still map to pitches
        this.gridWidth = 80;  // Board width
        this.gridHeight = 48; // Board height (also number of pitch rows)
        
        // Initialize components
        this.ca = new CellularAutomata(this.gridWidth, this.gridHeight);
        this.synth = new Synthesizer();
        this.canvas = document.getElementById('caCanvas');
        this.visualizer = new CAVisualizer(this.canvas, this.ca);
        
        // Playback state
        this.isPlaying = false;
        this.playbackTimer = null;
        this.generationCount = 0;
        this.scaleNotes = [];
        this.previousRowCounts = new Map(); // Track previous state for detecting births
        this.previousTotalCells = 0; // Track total for percussion triggers
        this.bpm = 60; // Beats per minute (generations per minute)
        
        // Initialize UI
        this.initUI();
        this.updateScaleDisplay();
        
        // Add canvas click handler for toggling cells
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.style.cursor = 'crosshair';
        
        // Initial random grid
        this.ca.randomize(0.10);
        this.visualizer.drawLive([]);
    }
    
    /**
     * Handle click on canvas to toggle cell state
     */
    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        
        // Get click position relative to canvas
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const canvasX = (event.clientX - rect.left) * scaleX;
        const canvasY = (event.clientY - rect.top) * scaleY;
        
        // Calculate which cell was clicked
        const cellWidth = this.canvas.width / this.gridWidth;
        const cellHeight = this.canvas.height / this.gridHeight;
        
        const cellX = Math.floor(canvasX / cellWidth);
        const cellY = Math.floor(canvasY / cellHeight);
        
        // Ensure within bounds
        if (cellX >= 0 && cellX < this.gridWidth && cellY >= 0 && cellY < this.gridHeight) {
            // Toggle the cell
            this.ca.grid[cellY][cellX] = this.ca.grid[cellY][cellX] === 1 ? 0 : 1;
            
            // Redraw
            if (this.isPlaying) {
                // Will be redrawn on next generation
            } else {
                this.visualizer.drawLive([]);
            }
        }
    }
    
    /**
     * Initialize UI event listeners
     */
    initUI() {
        // Playback controls
        document.getElementById('playBtn').addEventListener('click', () => this.play());
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        
        // Rule selection
        document.getElementById('ruleSelect').addEventListener('change', (e) => {
            const customGroup = document.getElementById('customRuleGroup');
            if (e.target.value === 'custom') {
                customGroup.style.display = 'block';
            } else {
                customGroup.style.display = 'none';
                const preset = RULE_PRESETS[e.target.value];
                if (preset) {
                    this.ca.setRules(preset.birth, preset.survive);
                }
            }
        });
        
        // Density slider
        document.getElementById('density').addEventListener('input', (e) => {
            document.getElementById('densityValue').textContent = e.target.value;
        });
        
        // Volume slider
        document.getElementById('volume').addEventListener('input', (e) => {
            const volume = parseInt(e.target.value) / 100;
            this.synth.setVolume(volume);
            document.getElementById('volumeValue').textContent = e.target.value;
        });
        
        // Scale and root note
        document.getElementById('scaleSelect').addEventListener('change', () => {
            document.getElementById('genreSelect').value = 'custom'; // Switch to custom when manually changing
            this.updateScaleDisplay();
        });
        document.getElementById('rootSelect').addEventListener('change', () => {
            document.getElementById('genreSelect').value = 'custom';
            this.updateScaleDisplay();
        });
        
        // Genre preset selector
        document.getElementById('genreSelect').addEventListener('change', (e) => {
            this.applyGenrePreset(e.target.value);
        });
        
        // Waveform
        document.getElementById('waveformSelect').addEventListener('change', (e) => {
            document.getElementById('genreSelect').value = 'custom';
            this.synth.setWaveform(e.target.value);
        });
        
        // BPM slider
        document.getElementById('bpm').addEventListener('input', (e) => {
            document.getElementById('genreSelect').value = 'custom';
            this.bpm = parseInt(e.target.value);
            document.getElementById('bpmValue').textContent = e.target.value;
            
            // If playing, restart the timer with new BPM
            if (this.isPlaying) {
                clearInterval(this.playbackTimer);
                const intervalMs = 60000 / this.bpm;
                this.playbackTimer = setInterval(() => this.evolveAndPlay(), intervalMs);
            }
        });
        
        // Apply default genre preset (ambient)
        this.applyGenrePreset('ambient');
    }
    
    /**
     * Apply a genre preset - updates scale, root, bpm, and waveform
     */
    applyGenrePreset(genreName) {
        if (genreName === 'custom') return;
        
        const preset = GENRE_PRESETS[genreName];
        if (!preset) return;
        
        // Update scale
        document.getElementById('scaleSelect').value = preset.scale;
        
        // Update root note
        document.getElementById('rootSelect').value = preset.root;
        
        // Update BPM
        this.bpm = preset.bpm;
        document.getElementById('bpm').value = preset.bpm;
        document.getElementById('bpmValue').textContent = preset.bpm;
        
        // Update waveform
        document.getElementById('waveformSelect').value = preset.waveform;
        this.synth.setWaveform(preset.waveform);
        
        // If playing, restart with new BPM
        if (this.isPlaying) {
            clearInterval(this.playbackTimer);
            const intervalMs = 60000 / this.bpm;
            this.playbackTimer = setInterval(() => this.evolveAndPlay(), intervalMs);
        }
        
        // Update scale display
        this.updateScaleDisplay();
    }
    
    /**
     * Update the scale display
     */
    updateScaleDisplay() {
        const root = document.getElementById('rootSelect').value;
        const scale = document.getElementById('scaleSelect').value;
        const noteNames = getScaleNoteNames(root, scale);
        document.getElementById('scaleDisplay').textContent = noteNames.join(' - ');
        
        // Generate scale notes for playback
        this.scaleNotes = generateScaleNotes(root, scale, this.gridHeight);
    }
    
    /**
     * Parse custom CA rules from input
     */
    parseCustomRules() {
        const birthInput = document.getElementById('birthRule').value;
        const surviveInput = document.getElementById('surviveRule').value;
        
        const parseRule = (str) => {
            return str.split(',')
                .map(s => parseInt(s.trim()))
                .filter(n => !isNaN(n) && n >= 0 && n <= 8);
        };
        
        return {
            birth: parseRule(birthInput),
            survive: parseRule(surviveInput)
        };
    }
    
    /**
     * Start live CA evolution and playback
     */
    play() {
        // Initialize audio context (must be done in response to user gesture)
        this.synth.init();
        
        // Stop any existing playback
        this.stop();
        
        // Setup rules
        const ruleSelect = document.getElementById('ruleSelect').value;
        if (ruleSelect === 'custom') {
            const rules = this.parseCustomRules();
            this.ca.setRules(rules.birth, rules.survive);
        } else {
            const preset = RULE_PRESETS[ruleSelect];
            if (preset) {
                this.ca.setRules(preset.birth, preset.survive);
            }
        }
        
        // Reset and randomize
        const density = parseInt(document.getElementById('density').value) / 100;
        this.ca.reset();
        this.ca.randomize(density);
        
        // Update scale notes
        this.updateScaleDisplay();
        
        // Start live evolution
        this.isPlaying = true;
        this.generationCount = 0;
        this.previousRowCounts = new Map(); // Reset birth tracking
        this.previousTotalCells = 0; // Reset percussion tracking
        
        // Play initial state
        this.playCurrentGeneration();
        
        // Start evolution loop based on BPM
        const intervalMs = 60000 / this.bpm;
        this.playbackTimer = setInterval(() => this.evolveAndPlay(), intervalMs);
        
        document.getElementById('statusText').textContent = 'Evolving...';
    }
    
    /**
     * Get all alive rows in the current grid with cell counts
     */
    getAliveRows() {
        const rowCounts = new Map(); // row -> count of alive cells
        
        for (let y = 0; y < this.gridHeight; y++) {
            let count = 0;
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.ca.grid[y][x] === 1) {
                    count++;
                }
            }
            if (count > 0) {
                rowCounts.set(y, count);
            }
        }
        
        return rowCounts;
    }
    
    /**
     * Play notes for the current CA state with dynamic velocity and births detection
     */
    playCurrentGeneration() {
        const currentRowCounts = this.getAliveRows();
        
        // Build array of playable rows with metadata
        const playableRows = [];
        const maxCellsInRow = Math.max(...Array.from(currentRowCounts.values()), 1);
        
        // Play ALL rows that have any alive cells - no threshold
        currentRowCounts.forEach((count, row) => {
            const prevCount = this.previousRowCounts.get(row) || 0;
            const isBirth = prevCount === 0; // Row just became active
            const isGrowing = count > prevCount; // Row is gaining cells
            
            // Velocity based on density (how many cells in this row)
            const velocity = 0.2 + (count / maxCellsInRow) * 0.8;
            
            playableRows.push({
                row,
                count,
                velocity,
                accented: isBirth || isGrowing // Accent births and growing rows
            });
        });
        
        // Sort by cell count - play ALL rows, no limit
        playableRows.sort((a, b) => b.count - a.count);
        
        // Convert to notes - play all rows with alive cells
        const notes = playableRows.map(({ row, velocity, accented }) => {
            const midiNote = this.scaleNotes[this.gridHeight - 1 - row];
            return {
                frequency: midiToFrequency(midiNote),
                velocity,
                accented
            };
        });
        
        const activeRowIndices = playableRows.map(r => r.row);
        
        // Play the notes - extend slightly past beat for overlap/legato feel
        const noteDuration = (60 / this.bpm) * 1.1; // 110% of beat = slight overlap
        if (notes.length > 0) {
            this.synth.playNotes(notes, noteDuration);
        }
        
        // Calculate cell population changes for percussion
        const totalAlive = Array.from(currentRowCounts.values()).reduce((a, b) => a + b, 0);
        const cellDelta = totalAlive - this.previousTotalCells;
        const birthCount = playableRows.filter(r => r.accented).length;
        
        // PERCUSSION LOGIC
        // Kick on every 4th generation (downbeat feel)
        if (this.generationCount % 4 === 0) {
            this.synth.playKick(0.7);
        }
        
        // Hi-hat on births (new rows becoming active)
        if (birthCount > 0) {
            const hihatVelocity = Math.min(0.3 + birthCount * 0.15, 0.7);
            this.synth.playHiHat(hihatVelocity, birthCount > 2);
        }
        
        // Snare on significant population changes
        if (Math.abs(cellDelta) > 15) {
            this.synth.playSnare(0.5);
        } else if (this.generationCount % 8 === 4) {
            // Backbeat snare every 8 generations
            this.synth.playSnare(0.4);
        }
        
        // Click on odd generations with few notes (adds texture)
        if (this.generationCount % 2 === 1 && notes.length <= 2 && notes.length > 0) {
            this.synth.playClick(0.3);
        }
        
        // Store current state for next comparison
        this.previousRowCounts = currentRowCounts;
        this.previousTotalCells = totalAlive;
        
        // Update visualization - highlight playing rows
        this.visualizer.drawLive(activeRowIndices);
        
        // Update UI
        document.getElementById('genCount').textContent = this.generationCount;
        
        // Display playing notes
        const noteNames = [];
        const seenNotes = new Set();
        activeRowIndices.forEach(row => {
            const midiNote = this.scaleNotes[this.gridHeight - 1 - row];
            const noteName = NOTE_NAMES[midiNote % 12];
            const octave = Math.floor(midiNote / 12) - 1;
            const fullName = noteName + octave;
            if (!seenNotes.has(fullName)) {
                seenNotes.add(fullName);
                noteNames.push(fullName);
            }
        });
        
        document.getElementById('notesDisplay').textContent = 
            noteNames.length > 0 ? noteNames.join(', ') : '-';
        
        // Update status with more info
        document.getElementById('statusText').textContent = 
            `Cells: ${totalAlive} | Notes: ${notes.length}` + (birthCount > 0 ? ` | New: ${birthCount}` : '');
    }
    
    /**
     * Evolve CA one generation and play
     */
    evolveAndPlay() {
        if (!this.isPlaying) return;
        
        // Evolve to next generation
        this.ca.nextGeneration();
        this.generationCount++;
        
        // Play the new state
        this.playCurrentGeneration();
    }
    
    /**
     * Stop playback
     */
    stop() {
        this.isPlaying = false;
        if (this.playbackTimer) {
            clearInterval(this.playbackTimer);
            this.playbackTimer = null;
        }
        this.synth.stopAll();
        document.getElementById('statusText').textContent = 'Stopped';
        document.getElementById('notesDisplay').textContent = '-';
        
        // Redraw current state
        this.visualizer.drawLive([]);
    }
    
    /**
     * Reset the grid
     */
    reset() {
        this.stop();
        const density = parseInt(document.getElementById('density').value) / 100;
        this.ca.reset();
        this.ca.randomize(density);
        this.generationCount = 0;
        this.visualizer.drawLive([]);
        document.getElementById('genCount').textContent = '0';
        document.getElementById('statusText').textContent = 'Ready';
    }
}

// ============================================================================
// INITIALIZE APPLICATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    window.composer = new CellularAutomataComposer();
});
