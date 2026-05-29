class AudioManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.sounds = {};
        this.init();
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.enabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.log('Audio play error:', e);
        }
    }

    playRotate() {
        this.playTone(440, 0.1, 'sine', 0.15);
        setTimeout(() => this.playTone(550, 0.08, 'sine', 0.12), 50);
    }

    playConnect() {
        this.playTone(660, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(880, 0.15, 'sine', 0.18), 80);
    }

    playDisconnect() {
        this.playTone(330, 0.15, 'triangle', 0.15);
    }

    playVictory() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.3, 'sine', 0.25);
            }, i * 150);
        });
        
        setTimeout(() => {
            this.playTone(784, 0.4, 'sine', 0.2);
            this.playTone(988, 0.4, 'sine', 0.15);
        }, 600);
    }

    playGameOver() {
        this.playTone(330, 0.2, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(262, 0.3, 'sawtooth', 0.2), 150);
        setTimeout(() => this.playTone(196, 0.4, 'sawtooth', 0.2), 300);
    }

    playWaterDrop() {
        this.playTone(800, 0.05, 'sine', 0.1);
        this.playTone(600, 0.1, 'sine', 0.08);
    }

    playValve() {
        this.playTone(200, 0.1, 'square', 0.15);
        setTimeout(() => this.playTone(400, 0.1, 'square', 0.12), 100);
    }

    playFix() {
        this.playTone(500, 0.08, 'sine', 0.2);
        setTimeout(() => this.playTone(700, 0.08, 'sine', 0.18), 60);
        setTimeout(() => this.playTone(900, 0.1, 'sine', 0.15), 120);
    }

    playClear() {
        this.playTone(300, 0.15, 'triangle', 0.2);
        setTimeout(() => this.playTone(500, 0.1, 'triangle', 0.18), 100);
    }

    playClick() {
        this.playTone(800, 0.03, 'sine', 0.1);
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

window.audioManager = new AudioManager();