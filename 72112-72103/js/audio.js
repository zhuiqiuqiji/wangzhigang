const Audio = (function() {
    let enabled = true;
    let audioContext = null;

    function initAudioContext() {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.log('Web Audio API not supported');
            }
        }
    }

    function playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!enabled || !audioContext) return;

        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }

    function playPlaceSound() {
        if (!enabled) return;
        initAudioContext();
        playTone(800, 0.1, 'sine', 0.2);
    }

    function playWinSound() {
        if (!enabled) return;
        initAudioContext();

        setTimeout(() => playTone(523, 0.15, 'sine', 0.3), 0);
        setTimeout(() => playTone(659, 0.15, 'sine', 0.3), 150);
        setTimeout(() => playTone(784, 0.15, 'sine', 0.3), 300);
        setTimeout(() => playTone(1047, 0.3, 'sine', 0.3), 450);
    }

    function playForbiddenSound() {
        if (!enabled) return;
        initAudioContext();
        playTone(200, 0.2, 'square', 0.15);
    }

    function playClickSound() {
        if (!enabled) return;
        initAudioContext();
        playTone(600, 0.05, 'sine', 0.1);
    }

    function toggle() {
        enabled = !enabled;
        return enabled;
    }

    function isEnabled() {
        return enabled;
    }

    function setEnabled(value) {
        enabled = value;
    }

    return {
        initAudioContext,
        playPlaceSound,
        playWinSound,
        playForbiddenSound,
        playClickSound,
        toggle,
        isEnabled,
        setEnabled
    };
})();
