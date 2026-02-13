document.addEventListener("DOMContentLoaded", function(event) {

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // RULE #2: No frequencies over Nyquist frequency
    const NYQUIST_FREQUENCY = audioCtx.sampleRate / 2;

    // RULE #1: No amplitudes over 1.0
    const globalGain = audioCtx.createGain();
    globalGain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    globalGain.connect(audioCtx.destination);
    
    let sampleBuffer = null;
    const BASE_FREQUENCY = 440; 
    
    fetch('synth.mp3')
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            sampleBuffer = audioBuffer;
            console.log('Sample loaded successfully');
        })
        .catch(e => console.error('Error loading sample:', e));

    const keyboardFrequencyMap = {
        '90': 261.625565300598634,  //Z - C
        '83': 277.182630976872096,  //S - C#
        '88': 293.664767917407560,  //X - D
        '68': 311.126983722080910,  //D - D#
        '67': 329.627556912869929,  //C - E
        '86': 349.228231433003884,  //V - F
        '71': 369.994422711634398,  //G - F#
        '66': 391.995435981749294,  //B - G
        '72': 415.304697579945138,  //H - G#
        '78': 440.000000000000000,  //N - A
        '74': 466.163761518089916,  //J - A#
        '77': 493.883301256124111,  //M - B
        '81': 523.251130601197269,  //Q - C
        '50': 554.365261953744192,  //2 - C#
        '87': 587.329535834815120,  //W - D
        '51': 622.253967444161821,  //3 - D#
        '69': 659.255113825739859,  //E - E
        '82': 698.456462866007768,  //R - F
        '53': 739.988845423268797,  //5 - F#
        '84': 783.990871963498588,  //T - G
        '54': 830.609395159890277,  //6 - G#
        '89': 880.000000000000000,  //Y - A
        '55': 932.327523036179832,  //7 - A#
        '85': 987.766602512248223,  //U - B
    }

    // part 4: "AI generated color mapping for each key"
    const keyColorMap = {
        '90': [255, 0, 0],      //Z - C - Red
        '83': [255, 64, 0],     //S - C# - Red-Orange
        '88': [255, 128, 0],    //X - D - Orange
        '68': [255, 191, 0],    //D - D# - Orange-Yellow
        '67': [255, 255, 0],    //C - E - Yellow
        '86': [128, 255, 0],    //V - F - Yellow-Green
        '71': [0, 255, 0],      //G - F# - Green
        '66': [0, 255, 128],    //B - G - Green-Cyan
        '72': [0, 255, 255],    //H - G# - Cyan
        '78': [0, 128, 255],    //N - A - Cyan-Blue
        '74': [0, 0, 255],      //J - A# - Blue
        '77': [128, 0, 255],    //M - B - Blue-Purple
        '81': [255, 0, 128],    //Q - C - Purple-Red
        '50': [255, 32, 96],    //2 - C# - Pink-Red
        '87': [255, 96, 32],    //W - D - Orange-Red
        '51': [255, 160, 32],   //3 - D# - Light Orange
        '69': [255, 255, 64],   //E - E - Light Yellow
        '82': [192, 255, 64],   //R - F - Lime
        '53': [64, 255, 64],    //5 - F# - Light Green
        '84': [64, 255, 192],   //T - G - Aqua-Green
        '54': [64, 192, 255],   //6 - G# - Light Cyan
        '89': [64, 64, 255],    //Y - A - Light Blue
        '55': [192, 64, 255],   //7 - A# - Light Purple
        '85': [255, 64, 192],   //U - B - Magenta
    }

    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);
    activeOscillators = {}
    
    const waveformSelect = document.getElementById('waveform');
    
    const numPartialsSlider = document.getElementById('numPartials');
    const numPartialsValue = document.getElementById('numPartialsValue');
    const amDepthSlider = document.getElementById('amDepth');
    const amDepthValue = document.getElementById('amDepthValue');
    const amRateSlider = document.getElementById('amRate');
    const amRateValue = document.getElementById('amRateValue');
    const fmIndexSlider = document.getElementById('fmIndex');
    const fmIndexValue = document.getElementById('fmIndexValue');
    const fmRatioSlider = document.getElementById('fmRatio');
    const fmRatioValue = document.getElementById('fmRatioValue');
    
    // LFO controls
    const lfoEnabled = document.getElementById('lfoEnabled');
    const lfoRateSlider = document.getElementById('lfoRate');
    const lfoRateValue = document.getElementById('lfoRateValue');
    const lfoDepthSlider = document.getElementById('lfoDepth');
    const lfoDepthValue = document.getElementById('lfoDepthValue');
    
    // ADSR controls
    const attackTimeSlider = document.getElementById('attackTime');
    const attackTimeValue = document.getElementById('attackTimeValue');
    const decayTimeSlider = document.getElementById('decayTime');
    const decayTimeValue = document.getElementById('decayTimeValue');
    const sustainLevelSlider = document.getElementById('sustainLevel');
    const sustainLevelValue = document.getElementById('sustainLevelValue');
    const releaseTimeSlider = document.getElementById('releaseTime');
    const releaseTimeValue = document.getElementById('releaseTimeValue');
    
    const additiveControls = document.getElementById('additiveControls');
    const amControls = document.getElementById('amControls');
    const fmControls = document.getElementById('fmControls');
    
    waveformSelect.addEventListener('change', function() {
        additiveControls.style.display = (waveformSelect.value === 'additive') ? 'block' : 'none';
        amControls.style.display = (waveformSelect.value === 'am') ? 'block' : 'none';
        fmControls.style.display = (waveformSelect.value === 'fm') ? 'block' : 'none';
    });
    
    numPartialsSlider.addEventListener('input', function() {
        numPartialsValue.textContent = numPartialsSlider.value;
    });
    amDepthSlider.addEventListener('input', function() {
        amDepthValue.textContent = amDepthSlider.value;
    });
    amRateSlider.addEventListener('input', function() {
        amRateValue.textContent = amRateSlider.value;
    });
    fmIndexSlider.addEventListener('input', function() {
        fmIndexValue.textContent = fmIndexSlider.value;
    });
    fmRatioSlider.addEventListener('input', function() {
        fmRatioValue.textContent = fmRatioSlider.value;
    });
    lfoRateSlider.addEventListener('input', function() {
        lfoRateValue.textContent = lfoRateSlider.value;
    });
    lfoDepthSlider.addEventListener('input', function() {
        lfoDepthValue.textContent = lfoDepthSlider.value;
    });
    attackTimeSlider.addEventListener('input', function() {
        attackTimeValue.textContent = parseFloat(attackTimeSlider.value).toFixed(3);
    });
    decayTimeSlider.addEventListener('input', function() {
        decayTimeValue.textContent = parseFloat(decayTimeSlider.value).toFixed(3);
    });
    sustainLevelSlider.addEventListener('input', function() {
        sustainLevelValue.textContent = sustainLevelSlider.value;
    });
    releaseTimeSlider.addEventListener('input', function() {
        releaseTimeValue.textContent = parseFloat(releaseTimeSlider.value).toFixed(3);
    });
    lfoRateSlider.addEventListener('input', function() {
        lfoRateValue.textContent = lfoRateSlider.value;
    });
    lfoDepthSlider.addEventListener('input', function() {
        lfoDepthValue.textContent = lfoDepthSlider.value;
    });
    attackTimeSlider.addEventListener('input', function() {
        attackTimeValue.textContent = parseFloat(attackTimeSlider.value).toFixed(3);
    });
    decayTimeSlider.addEventListener('input', function() {
        decayTimeValue.textContent = parseFloat(decayTimeSlider.value).toFixed(3);
    });
    sustainLevelSlider.addEventListener('input', function() {
        sustainLevelValue.textContent = sustainLevelSlider.value;
    });
    releaseTimeSlider.addEventListener('input', function() {
        releaseTimeValue.textContent = parseFloat(releaseTimeSlider.value).toFixed(3);
    });

    function updateBackgroundColor() {
        const activeKeys = Object.keys(activeOscillators);
        
        //reset 
        if (activeKeys.length === 0) {
            document.body.style.backgroundColor = '#ffffffff';
            return;
        }
        
        let r = 0, g = 0, b = 0;
        for (const key of activeKeys) {
            const [kr, kg, kb] = keyColorMap[key];
            r += kr;
            g += kg;
            b += kb;
        }
        r = Math.round(r / activeKeys.length);
        g = Math.round(g / activeKeys.length);
        b = Math.round(b / activeKeys.length);
        document.body.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
        document.body.style.transition = 'background-color 0.1s ease';
    }

    function updatePolyphonicGains() {
        const numVoices = Object.keys(activeOscillators).length;
        if (numVoices === 0) return;
        
        const gainPerVoice = 1.0 / numVoices;
        const maxGain = Math.min(gainPerVoice * 0.7, 1.0); // so the amp doesnt get over 1.0
        
        for (const key in activeOscillators) {
            const { gainNode } = activeOscillators[key];
            const now = audioCtx.currentTime;
            
            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.setValueAtTime(gainNode.gain.value, now);
            gainNode.gain.linearRampToValueAtTime(maxGain, now + 0.01);
        }
    }

    function keyDown(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
            playNote(key);
            updatePolyphonicGains(); 
            updateBackgroundColor(); 
        }
    }

    function keyUp(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && activeOscillators[key]) {
            const now = audioCtx.currentTime;
            const oscillatorData = activeOscillators[key];
            const { osc, gainNode, modulator, bufferSource, partials, lfo } = oscillatorData;
            
            const releaseTime = parseFloat(releaseTimeSlider.value);
            
            // NO NO RULE #3: Never stop oscillator at non-zero amplitude (prevents popping)
            // Fade to near-zero before stopping
            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.setValueAtTime(gainNode.gain.value, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);
            
            if (bufferSource) {
                bufferSource.stop(now + releaseTime);
            } else if (osc) {
                osc.stop(now + releaseTime);
            }
            if (modulator) {
                modulator.stop(now + releaseTime);
            }
            if (lfo) {
                lfo.stop(now + releaseTime);
            }
            if (partials) {
                partials.forEach(partial => partial.stop(now + releaseTime));
            }
            delete activeOscillators[key];
            
            updatePolyphonicGains();
            updateBackgroundColor(); 
        }
    }

    
    function playNote(key) {
        const frequency = keyboardFrequencyMap[key];
        // NO NO RULE #2: Clamp frequency to Nyquist limit
        const clampedFrequency = Math.min(frequency, NYQUIST_FREQUENCY);
        const mode = waveformSelect.value;
        const now = audioCtx.currentTime;
        
        let osc, gainNode, modulator, bufferSource, lfo;
        let partialOscillators = []; 
        
        if (mode === 'additive') {
            // Additive Synthesis:
            const numPartials = parseInt(numPartialsSlider.value);
            const mixer = audioCtx.createGain();
            mixer.gain.value = 1.0 / numPartials; 
            

            for (let i = 1; i <= numPartials; i++) {
                const partial = audioCtx.createOscillator();
                const partialGain = audioCtx.createGain();
                
                partial.frequency.setValueAtTime(clampedFrequency * i, now);
                partial.type = 'sine';
                
                partialGain.gain.value = 1.0 / i;
                
                partial.connect(partialGain);
                partialGain.connect(mixer);
                partial.start();
                
                partialOscillators.push(partial);
            }
            
            gainNode = audioCtx.createGain();
            mixer.connect(gainNode);
            
        } else if (mode === 'sample') {

            if (!sampleBuffer) {
                console.error('Sample not loaded yet');
                return;
            }
            
            bufferSource = audioCtx.createBufferSource();
            bufferSource.buffer = sampleBuffer;
            bufferSource.loop = true;
            

            const playbackRate = clampedFrequency / BASE_FREQUENCY;
            bufferSource.playbackRate.setValueAtTime(playbackRate, now);
            
            gainNode = audioCtx.createGain();
            bufferSource.connect(gainNode);
            
            bufferSource.start();
            
        } else if (mode === 'am') {

            const carrier = audioCtx.createOscillator();
            carrier.frequency.setValueAtTime(clampedFrequency, now);
            carrier.type = 'sine';
            
            const modulatorFreq = audioCtx.createOscillator();
            modulatorFreq.frequency.setValueAtTime(parseFloat(amRateSlider.value), now);
            modulatorFreq.type = 'sine';
            
            const depth = audioCtx.createGain();
            const depthValue = parseFloat(amDepthSlider.value);
            depth.gain.value = depthValue;
            
            const modulated = audioCtx.createGain();
            modulated.gain.value = 1.0 - depthValue;
            
            modulatorFreq.connect(depth);
            depth.connect(modulated.gain);
            carrier.connect(modulated);
            
            gainNode = audioCtx.createGain();
            modulated.connect(gainNode);
            
            carrier.start();
            modulatorFreq.start();
            
            osc = carrier;
            modulator = modulatorFreq;
            
        } else if (mode === 'fm') {

            const carrier = audioCtx.createOscillator();
            carrier.frequency.setValueAtTime(clampedFrequency, now);
            carrier.type = 'sine';
            
            const modulatorFreq = audioCtx.createOscillator();
            const fmRatio = parseFloat(fmRatioSlider.value);
            modulatorFreq.frequency.setValueAtTime(clampedFrequency * fmRatio, now);
            modulatorFreq.type = 'sine';
            
            const modulationIndex = audioCtx.createGain();
            modulationIndex.gain.value = parseFloat(fmIndexSlider.value);
            
            modulatorFreq.connect(modulationIndex);
            modulationIndex.connect(carrier.frequency);
            
            gainNode = audioCtx.createGain();
            carrier.connect(gainNode);
            
            carrier.start();
            modulatorFreq.start();
            
            osc = carrier;
            modulator = modulatorFreq;
            
        } else {

            osc = audioCtx.createOscillator();
            osc.frequency.setValueAtTime(clampedFrequency, now);
            osc.type = mode;
            
            gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            
            osc.start();
        }
        
        // Add LFO (vibrato) if enabled
        if (lfoEnabled.checked && (osc || bufferSource)) {
            lfo = audioCtx.createOscillator();
            const lfoGain = audioCtx.createGain();
            
            lfo.frequency.setValueAtTime(parseFloat(lfoRateSlider.value), now);
            
            // Convert cents to frequency deviation
            const depthCents = parseFloat(lfoDepthSlider.value);
            const depthHz = clampedFrequency * (Math.pow(2, depthCents / 1200) - 1);
            lfoGain.gain.value = depthHz;
            
            lfo.connect(lfoGain);
            if (osc) {
                lfoGain.connect(osc.frequency);
            } else if (bufferSource) {
                // For sample playback, modulate playback rate
                lfoGain.gain.value = depthCents / 1200; // Small pitch variation
                lfoGain.connect(bufferSource.playbackRate);
            }
            
            lfo.start();
        }

        // ADSR envelope (using slider values)
        const attackTime = parseFloat(attackTimeSlider.value);
        const decayTime = parseFloat(decayTimeSlider.value);
        const sustainLevel = parseFloat(sustainLevelSlider.value);
        
        // RULE #1: Ensure total amplitude never exceeds 1.0
        // Divide by number of voices to prevent clipping in polyphonic mode
        const numVoices = Object.keys(activeOscillators).length + 1;
        const gainPerVoice = 1.0 / numVoices;
        const targetGain = Math.min(gainPerVoice * 0.7, 1.0); // Cap at 70% for safety
        
        //  RULE #3: Always start oscillator at zero amplitude (prevents popping)
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(targetGain, now + attackTime);
        
        // RULE #1: Ensure sustain level also respects amplitude limit
        const sustainGain = Math.min(targetGain * sustainLevel, 1.0);
        gainNode.gain.linearRampToValueAtTime(sustainGain, now + attackTime + decayTime);
        
        gainNode.connect(globalGain);
        
        activeOscillators[key] = { 
            osc, 
            gainNode, 
            modulator, 
            bufferSource, 
            partials: partialOscillators.length > 0 ? partialOscillators : null,
            lfo: lfo
        };
    }

});