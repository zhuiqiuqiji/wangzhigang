class PianoAudio {
    constructor() {
        this.audioContext = null;
        this.activeOscillators = new Map();
        this.currentInstrument = 'piano';
        this.noteFrequencies = this.generateFrequencies();
        this.instrumentConfigs = this.getInstrumentConfigs();
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    generateFrequencies() {
        const notes = {};
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        for (let octave = 4; octave <= 5; octave++) {
            for (let i = 0; i < 12; i++) {
                const noteName = noteNames[i] + octave;
                const semitones = (octave - 4) * 12 + i;
                notes[noteName] = 261.63 * Math.pow(2, semitones / 12);
            }
        }
        
        return notes;
    }

    getInstrumentConfigs() {
        return {
            piano: {
                oscillators: [
                    { type: 'sine', detune: 0, gain: 0.6 },
                    { type: 'sine', detune: 0, gain: 0.3, harmonic: 2 },
                    { type: 'triangle', detune: 0, gain: 0.1, harmonic: 3 }
                ],
                envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 2 },
                filter: { type: 'lowpass', freq: 3000, q: 1 },
                vibrato: { rate: 0, depth: 0 }
            },
            organ: {
                oscillators: [
                    { type: 'square', detune: 0, gain: 0.3 },
                    { type: 'square', detune: 0, gain: 0.25, harmonic: 2 },
                    { type: 'square', detune: 0, gain: 0.2, harmonic: 3 },
                    { type: 'sine', detune: 7, gain: 0.15 },
                    { type: 'sine', detune: -7, gain: 0.1 }
                ],
                envelope: { attack: 0.02, decay: 0.05, sustain: 0.8, release: 0.3 },
                filter: { type: 'lowpass', freq: 4000, q: 0.5 },
                vibrato: { rate: 5, depth: 3 }
            },
            guitar: {
                oscillators: [
                    { type: 'sawtooth', detune: 0, gain: 0.4 },
                    { type: 'sine', detune: 2, gain: 0.25 },
                    { type: 'sine', detune: -2, gain: 0.2 },
                    { type: 'triangle', detune: 0, gain: 0.15, harmonic: 2 }
                ],
                envelope: { attack: 0.005, decay: 0.3, sustain: 0.2, release: 1.5 },
                filter: { type: 'lowpass', freq: 3500, q: 2 },
                vibrato: { rate: 6, depth: 2 }
            },
            violin: {
                oscillators: [
                    { type: 'sawtooth', detune: 0, gain: 0.5 },
                    { type: 'sine', detune: 3, gain: 0.2 },
                    { type: 'sine', detune: -3, gain: 0.15 },
                    { type: 'sine', detune: 0, gain: 0.1, harmonic: 2 }
                ],
                envelope: { attack: 0.15, decay: 0.2, sustain: 0.7, release: 0.8 },
                filter: { type: 'bandpass', freq: 2500, q: 3 },
                vibrato: { rate: 5.5, depth: 8 }
            },
            synth: {
                oscillators: [
                    { type: 'sawtooth', detune: 10, gain: 0.35 },
                    { type: 'sawtooth', detune: -10, gain: 0.35 },
                    { type: 'square', detune: 0, gain: 0.15, harmonic: 1.5 },
                    { type: 'sine', detune: 0, gain: 0.15, harmonic: 3 }
                ],
                envelope: { attack: 0.01, decay: 0.15, sustain: 0.5, release: 1.2 },
                filter: { type: 'lowpass', freq: 5000, q: 5 },
                vibrato: { rate: 8, depth: 5 }
            }
        };
    }

    setInstrument(instrumentName) {
        if (this.instrumentConfigs[instrumentName]) {
            this.currentInstrument = instrumentName;
        }
    }

    getInstrument() {
        return this.currentInstrument;
    }

    playNote(noteName, velocity = 0.8) {
        this.init();
        
        if (this.activeOscillators.has(noteName)) {
            return;
        }

        const frequency = this.noteFrequencies[noteName];
        if (!frequency) return;

        const now = this.audioContext.currentTime;
        const config = this.instrumentConfigs[this.currentInstrument];
        
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        filter.type = config.filter.type;
        filter.frequency.setValueAtTime(config.filter.freq, now);
        filter.Q.setValueAtTime(config.filter.q, now);
        
        const mainGain = velocity;
        const oscillators = [];
        const gains = [];
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(config.vibrato.rate, now);
        lfoGain.gain.setValueAtTime(config.vibrato.depth, now);
        lfo.connect(lfoGain);
        
        config.oscillators.forEach((oscConfig, index) => {
            const osc = this.audioContext.createOscillator();
            const oscGain = this.audioContext.createGain();
            
            osc.type = oscConfig.type;
            const baseFreq = frequency * (oscConfig.harmonic || 1);
            osc.frequency.setValueAtTime(baseFreq + oscConfig.detune, now);
            
            if (config.vibrato.depth > 0) {
                lfoGain.connect(osc.frequency);
            }
            
            oscGain.gain.setValueAtTime(oscConfig.gain * mainGain, now);
            
            osc.connect(oscGain);
            oscGain.connect(filter);
            
            oscillators.push(osc);
            gains.push(oscGain);
        });
        
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        const env = config.envelope;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.9 * mainGain, now + env.attack);
        gainNode.gain.exponentialRampToValueAtTime(env.sustain * mainGain, now + env.attack + env.decay);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + env.attack + env.decay + env.release + 1);
        
        lfo.start(now);
        oscillators.forEach(osc => osc.start(now));
        
        const stopTime = now + env.attack + env.decay + env.release + 1.5;
        oscillators.forEach(osc => osc.stop(stopTime));
        lfo.stop(stopTime);
        
        this.activeOscillators.set(noteName, {
            oscillators,
            gains,
            gainNode,
            filter,
            lfo,
            lfoGain,
            startTime: now,
            velocity
        });
    }

    stopNote(noteName) {
        const noteData = this.activeOscillators.get(noteName);
        if (!noteData) return;

        this.activeOscillators.delete(noteName);

        const now = this.audioContext.currentTime;
        const { oscillators, gainNode, lfo } = noteData;
        const config = this.instrumentConfigs[this.currentInstrument];
        
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.envelope.release * 0.3);
        
        const stopTime = now + config.envelope.release * 0.3 + 0.05;
        setTimeout(() => {
            oscillators.forEach(osc => {
                try { osc.stop(); } catch (e) {}
            });
            try { lfo.stop(); } catch (e) {}
        }, config.envelope.release * 0.3 * 1000);
    }

    getNoteNames() {
        return Object.keys(this.noteFrequencies);
    }

    noteToMidi(noteName) {
        const noteMap = { 'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11 };
        const match = noteName.match(/([A-G]#?)(\d)/);
        if (!match) return 60;
        const note = match[1];
        const octave = parseInt(match[2]);
        return (octave + 1) * 12 + noteMap[note];
    }

    midiToNote(midiNumber) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiNumber / 12) - 1;
        const noteIndex = midiNumber % 12;
        return noteNames[noteIndex] + octave;
    }
}

const pianoAudio = new PianoAudio();
