/* 
 * Part I: Babbling Brook - WebAudio recreation of SuperCollider code
 * Original: {RHPF.ar(LPF.ar(BrownNoise.ar(), 400), LPF.ar(BrownNoise.ar(), 14) * 400 + 500, 0.03, 0.1)}.play
 * 
 * Signal flow:
 * - BrownNoise1 -> LPF(400Hz) -> RHPF input (audio signal)
 * - BrownNoise2 -> LPF(14Hz) -> *400 -> +500 -> RHPF.frequency (modulation)
 * - RHPF Q = 1/0.03 ≈ 33.33
 * - Output gain = 0.1
 * 
 * Partner: (I forgot my partner's name)
 */

// Create AudioContext
const audioCtx = new AudioContext();

// Function to create a brown noise buffer
function createBrownNoiseBuffer() {
    const bufferSize = 10 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const brown = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * brown)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
    }
    return noiseBuffer;
}

// Create two independent brown noise sources
const noiseBuffer = createBrownNoiseBuffer();

const brownNoise1 = audioCtx.createBufferSource();
brownNoise1.buffer = noiseBuffer;
brownNoise1.loop = true;

const brownNoise2 = audioCtx.createBufferSource();
brownNoise2.buffer = noiseBuffer;
brownNoise2.loop = true;

// LPF1: filters brown noise at 400Hz (audio path)
const LPFfilter1 = audioCtx.createBiquadFilter();
LPFfilter1.type = 'lowpass';
LPFfilter1.frequency.value = 400;

// LPF2: filters brown noise at 14Hz (modulation path)
const LPFfilter2 = audioCtx.createBiquadFilter();
LPFfilter2.type = 'lowpass';
LPFfilter2.frequency.value = 14;

// Gain node to multiply LPF2 output by 400
const modulationGain = audioCtx.createGain();
modulationGain.gain.value = 400;

// Constant source to add 500 Hz offset to the modulation
const frequencyOffset = audioCtx.createConstantSource();
frequencyOffset.offset.value = 500;

// RHPF: Resonant High Pass Filter
// Q in SuperCollider RHPF is reciprocal bandwidth (rq), so Q = 1/rq = 1/0.03 ≈ 33.33
const RHPFfilter = audioCtx.createBiquadFilter();
RHPFfilter.type = 'highpass';
RHPFfilter.frequency.value = 500;  // Base frequency, will be modulated
RHPFfilter.Q.value = 1 / 0.03;     // ~33.33

// Output gain (0.1 from original)
const outputGain = audioCtx.createGain();
outputGain.gain.value = 0.1;

// Connect the audio signal path:
// BrownNoise1 -> LPF1 -> RHPF -> outputGain -> destination
brownNoise1.connect(LPFfilter1);
LPFfilter1.connect(RHPFfilter);
RHPFfilter.connect(outputGain);
outputGain.connect(audioCtx.destination);

// Connect the modulation path:
// BrownNoise2 -> LPF2 -> modulationGain(*400) -> RHPF.frequency
// frequencyOffset(+500) -> RHPF.frequency
brownNoise2.connect(LPFfilter2);
LPFfilter2.connect(modulationGain);
modulationGain.connect(RHPFfilter.frequency);
frequencyOffset.connect(RHPFfilter.frequency);

// Start/stop functions for user interaction
function startBabblingBrook() {
    // Resume context if suspended (required for autoplay policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    brownNoise1.start(0);
    brownNoise2.start(0);
    frequencyOffset.start(0);
    console.log('Babbling brook started!');
}

function stopBabblingBrook() {
    brownNoise1.stop();
    brownNoise2.stop();
    frequencyOffset.stop();
    console.log('Babbling brook stopped.');
}

/* 
 * Part II: Red Alert Siren - Star Trek TOS style
 * Based on Farnell, Designing Sound, Practical 35
 * 
 * Signal flow:
 * 1. Sawtooth oscillator with parabolic frequency sweep (360Hz → 847Hz)
 * 2. Mix with second harmonic (2x frequency) at 0.3 level
 * 3. Distortion via WaveShaper
 * 4. Bandpass filters for formant coloring
 * 5. Output with amplitude envelope
 */

// Red Alert state
let redAlertInterval = null;

// Create hard clipper curve for WaveShaper
function createClipperCurve() {
    const samples = 256;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        // Soft clip with some overdrive
        curve[i] = Math.tanh(x * 2);
    }
    return curve;
}

// Create a single siren sweep
function createSirenSweep() {
    const startTime = audioCtx.currentTime;
    const sweepDuration = 0.9; // 900ms
    
    // Frequencies from Farnell analysis
    const startFreq = 360;
    const endFreq = 847;
    
    // Main sawtooth oscillator
    const sawOsc = audioCtx.createOscillator();
    sawOsc.type = 'sawtooth';
    sawOsc.frequency.value = startFreq;
    
    // Second harmonic oscillator (2x frequency)
    const secondHarmonic = audioCtx.createOscillator();
    secondHarmonic.type = 'sawtooth';
    secondHarmonic.frequency.value = startFreq * 2;
    
    // Mix the harmonics
    const mainGain = audioCtx.createGain();
    mainGain.gain.value = 0.7;
    const harmonicGain = audioCtx.createGain();
    harmonicGain.gain.value = 0.3;
    
    // Parabolic frequency sweep using sqrt curve
    const steps = 50;
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const freq = startFreq + (endFreq - startFreq) * Math.sqrt(t);
        const time = startTime + t * sweepDuration;
        sawOsc.frequency.setValueAtTime(freq, time);
        secondHarmonic.frequency.setValueAtTime(freq * 2, time);
    }
    
    // Clipper for distortion (adds harmonics and harsh character)
    const clipper = audioCtx.createWaveShaper();
    clipper.curve = createClipperCurve();
    clipper.oversample = '2x';
    
    // Bandpass filter to shape the tone (centered around 1kHz formant region)
    const bp1 = audioCtx.createBiquadFilter();
    bp1.type = 'bandpass';
    bp1.frequency.value = 800;
    bp1.Q.value = 1;
    
    // Second bandpass at higher formant
    const bp2 = audioCtx.createBiquadFilter();
    bp2.type = 'bandpass';
    bp2.frequency.value = 1500;
    bp2.Q.value = 2;
    
    // Mix filtered and direct signal
    const filterMix = audioCtx.createGain();
    filterMix.gain.value = 0.6;
    const directMix = audioCtx.createGain();
    directMix.gain.value = 0.4;
    
    // Amplitude envelope
    const envelope = audioCtx.createGain();
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(0.8, startTime + 0.02); // fast attack
    envelope.gain.setValueAtTime(0.8, startTime + sweepDuration - 0.15);
    envelope.gain.linearRampToValueAtTime(0, startTime + sweepDuration); // decay
    
    // Output gain
    const output = audioCtx.createGain();
    output.gain.value = 0.3;
    
    // Connect signal chain
    sawOsc.connect(mainGain);
    secondHarmonic.connect(harmonicGain);
    mainGain.connect(clipper);
    harmonicGain.connect(clipper);
    
    // Split to filters and direct
    clipper.connect(bp1);
    clipper.connect(bp2);
    clipper.connect(directMix);
    
    bp1.connect(filterMix);
    bp2.connect(filterMix);
    
    filterMix.connect(envelope);
    directMix.connect(envelope);
    
    envelope.connect(output);
    output.connect(audioCtx.destination);
    
    // Start oscillators
    sawOsc.start(startTime);
    secondHarmonic.start(startTime);
    sawOsc.stop(startTime + sweepDuration + 0.1);
    secondHarmonic.stop(startTime + sweepDuration + 0.1);
    
    console.log('Siren sweep created at', startTime);
    
    return { sawOsc, secondHarmonic };
}

function startRedAlert() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    // Create first sweep immediately
    createSirenSweep();
    
    // Repeat the sweep every 1.2 seconds (900ms sweep + 300ms gap)
    redAlertInterval = setInterval(() => {
        createSirenSweep();
    }, 1200);
    
    console.log('Red Alert started!');
}

function stopRedAlert() {
    if (redAlertInterval) {
        clearInterval(redAlertInterval);
        redAlertInterval = null;
    }
    console.log('Red Alert stopped.');
}

/* 
 * Part III: Air Raid Siren
 * Classic WWII-style wailing siren that sweeps up and down continuously
 * 
 * Signal flow:
 * - LFO (slow sine wave) modulates oscillator frequency
 * - Main oscillator sweeps between ~300Hz and ~1400Hz
 * - Light distortion for that mechanical speaker quality
 * - Bandpass filter for megaphone/horn character
 */

let airRaidNodes = null;

function startAirRaid() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    // LFO to control the pitch sweep (slow oscillation ~0.15Hz = 6-7 second cycle)
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15; // Full cycle every ~6.7 seconds
    
    // Scale the LFO output to control frequency range
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 300; // Sweep range: ±300Hz
    
    // Main siren oscillator - use sine for purer tone
    const sirenOsc = audioCtx.createOscillator();
    sirenOsc.type = 'sine';
    sirenOsc.frequency.value = 480; // Center frequency (180-780Hz range)
    
    // Connect LFO to modulate siren frequency
    lfo.connect(lfoGain);
    lfoGain.connect(sirenOsc.frequency);
    
    // Add second harmonic for mechanical richness (but quieter)
    const sirenOsc2 = audioCtx.createOscillator();
    sirenOsc2.type = 'sine';
    sirenOsc2.frequency.value = 480 * 2;
    
    // LFO also modulates second harmonic (at 2x)
    const lfoGain2 = audioCtx.createGain();
    lfoGain2.gain.value = 300 * 2;
    lfo.connect(lfoGain2);
    lfoGain2.connect(sirenOsc2.frequency);
    
    // Third harmonic for that grinding mechanical quality
    const sirenOsc3 = audioCtx.createOscillator();
    sirenOsc3.type = 'sine';
    sirenOsc3.frequency.value = 480 * 3;
    const lfoGain3 = audioCtx.createGain();
    lfoGain3.gain.value = 300 * 3;
    lfo.connect(lfoGain3);
    lfoGain3.connect(sirenOsc3.frequency);
    
    // Mix oscillators - fundamental loudest, harmonics quieter
    const oscGain1 = audioCtx.createGain();
    oscGain1.gain.value = 0.7;
    const oscGain2 = audioCtx.createGain();
    oscGain2.gain.value = 0.25;
    const oscGain3 = audioCtx.createGain();
    oscGain3.gain.value = 0.1;
    
    // Heavier distortion for mechanical speaker breakup
    const clipper = audioCtx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
        const x = (i * 2) / 256 - 1;
        // Harder clipping for more grit
        curve[i] = Math.tanh(x * 3) * 0.8;
    }
    clipper.curve = curve;
    
    // Lowpass to cut harsh highs
    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2000;
    lp.Q.value = 0.5;
    
    // Bandpass filter for horn/megaphone character
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 550;
    bp.Q.value = 0.6;
    
    // Second filter for presence
    const hp = audioCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 120;
    hp.Q.value = 0.5;
    
    // Output gain
    const output = audioCtx.createGain();
    output.gain.value = 0.3;
    
    // Connect signal chain
    sirenOsc.connect(oscGain1);
    sirenOsc2.connect(oscGain2);
    sirenOsc3.connect(oscGain3);
    oscGain1.connect(clipper);
    oscGain2.connect(clipper);
    oscGain3.connect(clipper);
    clipper.connect(lp);
    lp.connect(bp);
    bp.connect(hp);
    hp.connect(output);
    output.connect(audioCtx.destination);
    
    // Start oscillators
    lfo.start();
    sirenOsc.start();
    sirenOsc2.start();
    sirenOsc3.start();
    
    // Store nodes for stopping
    airRaidNodes = { lfo, sirenOsc, sirenOsc2, sirenOsc3, output };
    
    console.log('Air Raid siren started!');
}

function stopAirRaid() {
    if (airRaidNodes) {
        airRaidNodes.lfo.stop();
        airRaidNodes.sirenOsc.stop();
        airRaidNodes.sirenOsc2.stop();
        airRaidNodes.sirenOsc3.stop();
        airRaidNodes = null;
    }
    console.log('Air Raid siren stopped.');
}
