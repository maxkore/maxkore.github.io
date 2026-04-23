document.addEventListener("DOMContentLoaded", function(event) {

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const NYQUIST_FREQUENCY = audioCtx.sampleRate / 2; // makes sure we dont break rule of nyquist

    const globalGain = audioCtx.createGain();
    globalGain.gain.setValueAtTime(0.8, audioCtx.currentTime);
    globalGain.connect(audioCtx.destination);

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
    
    // part 1 
    const waveformSelect = document.getElementById('waveform');

    // part 4: idea from class, update background color based on the notes, but i added color blending
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

    // part 3:
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
            const { osc, gainNode } = activeOscillators[key];
            
            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.setValueAtTime(gainNode.gain.value, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.stop(now + 0.1);
            delete activeOscillators[key];
            
            updatePolyphonicGains();
            updateBackgroundColor(); 
        }
    }

    
    function playNote(key) {
        const osc = audioCtx.createOscillator();
        
        const frequency = keyboardFrequencyMap[key];
        const clampedFrequency = Math.min(frequency, NYQUIST_FREQUENCY);
        osc.frequency.setValueAtTime(clampedFrequency, audioCtx.currentTime);
        osc.type = waveformSelect.value;

        const gainNode = audioCtx.createGain();
        
        const now = audioCtx.currentTime;
        const attackTime = 0.05;
        const decayTime = 0.1;
        const sustainLevel = 0.7;
        
        const numVoices = Object.keys(activeOscillators).length + 1;
        const gainPerVoice = 1.0 / numVoices;
        const targetGain = Math.min(gainPerVoice, 1.0);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(targetGain, now + attackTime);
        
        const sustainGain = Math.min(targetGain * sustainLevel, 1.0);
        gainNode.gain.linearRampToValueAtTime(sustainGain, now + attackTime + decayTime);
        
        osc.connect(gainNode);
        gainNode.connect(globalGain);
        
        osc.start();
        activeOscillators[key] = { osc, gainNode };
    }

});