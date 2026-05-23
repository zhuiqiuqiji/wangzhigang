import { useCallback, useRef, useEffect, useState } from 'react';

interface SoundOptions {
  volume?: number;
  loop?: boolean;
}

export function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const initAudioContext = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };

    document.addEventListener('click', initAudioContext, { once: true });
    return () => document.removeEventListener('click', initAudioContext);
  }, []);

  const playTone = useCallback((
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    options: SoundOptions = {}
  ) => {
    if (isMuted || !audioContextRef.current) return;

    const { volume = 0.3, loop = false } = options;
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [isMuted]);

  const playSpin = useCallback(() => {
    if (isMuted) return;
    const now = Date.now();
    const spinDuration = 1500;
    const interval = 100;
    
    const animate = () => {
      const elapsed = Date.now() - now;
      if (elapsed < spinDuration) {
        const progress = elapsed / spinDuration;
        const freq = 200 + progress * 400;
        playTone(freq, 0.08, 'square', { volume: 0.1 });
        setTimeout(animate, interval - progress * 50);
      }
    };
    animate();
  }, [isMuted, playTone]);

  const playWin = useCallback((amount: number = 100) => {
    if (isMuted) return;
    
    const isBigWin = amount >= 500;
    const notes = isBigWin 
      ? [523.25, 659.25, 783.99, 1046.50, 1318.51]
      : [523.25, 659.25, 783.99];
    
    notes.forEach((freq, i) => {
      setTimeout(() => {
        playTone(freq, 0.2, 'sine', { volume: isBigWin ? 0.4 : 0.3 });
        if (i > 0) {
          playTone(notes[i - 1], 0.15, 'sine', { volume: 0.15 });
        }
      }, i * 120);
    });

    if (isBigWin) {
      setTimeout(() => {
        playTone(1046.50, 0.5, 'sine', { volume: 0.3 });
      }, notes.length * 120);
    }
  }, [isMuted, playTone]);

  const playJackpot = useCallback(() => {
    if (isMuted) return;
    
    const fanfare = [
      { freq: 523.25, dur: 0.15 },
      { freq: 659.25, dur: 0.15 },
      { freq: 783.99, dur: 0.3 },
      { freq: 1046.50, dur: 0.3 },
      { freq: 783.99, dur: 0.15 },
      { freq: 1046.50, dur: 0.5 },
    ];

    let delay = 0;
    fanfare.forEach(({ freq, dur }, i) => {
      setTimeout(() => {
        playTone(freq, dur, 'triangle', { volume: 0.5 });
        if (i > 2) {
          playTone(freq / 2, dur, 'sine', { volume: 0.2 });
        }
      }, delay);
      delay += dur * 1000;
    });
  }, [isMuted, playTone]);

  const playButtonClick = useCallback(() => {
    playTone(800, 0.05, 'square', { volume: 0.15 });
  }, [playTone]);

  const playReelStop = useCallback((reelIndex: number = 0) => {
    const baseFreq = 300 + reelIndex * 50;
    playTone(baseFreq, 0.1, 'triangle', { volume: 0.25 });
    setTimeout(() => {
      playTone(baseFreq * 1.5, 0.08, 'sine', { volume: 0.15 });
    }, 50);
  }, [playTone]);

  const playBonus = useCallback(() => {
    if (isMuted) return;
    
    const sparkle = [880, 1108.73, 1318.51, 1760, 2217.46];
    sparkle.forEach((freq, i) => {
      setTimeout(() => {
        playTone(freq, 0.15, 'sine', { volume: 0.25 });
      }, i * 80);
    });
  }, [isMuted, playTone]);

  const playFreeSpin = useCallback(() => {
    if (isMuted) return;
    
    const magic = [
      { freq: 523.25, dur: 0.1 },
      { freq: 659.25, dur: 0.1 },
      { freq: 783.99, dur: 0.1 },
      { freq: 1046.50, dur: 0.2 },
      { freq: 783.99, dur: 0.1 },
      { freq: 1046.50, dur: 0.3 },
    ];

    let delay = 0;
    magic.forEach(({ freq, dur }) => {
      setTimeout(() => {
        playTone(freq, dur, 'sine', { volume: 0.3 });
      }, delay);
      delay += dur * 1000;
    });
  }, [isMuted, playTone]);

  const playRiskWin = useCallback(() => {
    if (isMuted) return;
    playTone(880, 0.15, 'square', { volume: 0.3 });
    setTimeout(() => playTone(1108.73, 0.15, 'square', { volume: 0.3 }), 100);
    setTimeout(() => playTone(1318.51, 0.25, 'square', { volume: 0.35 }), 200);
  }, [isMuted, playTone]);

  const playRiskLose = useCallback(() => {
    if (isMuted) return;
    playTone(440, 0.2, 'sawtooth', { volume: 0.25 });
    setTimeout(() => playTone(349.23, 0.25, 'sawtooth', { volume: 0.2 }), 150);
    setTimeout(() => playTone(293.66, 0.3, 'sawtooth', { volume: 0.15 }), 300);
  }, [isMuted, playTone]);

  const playCoin = useCallback(() => {
    playTone(1200, 0.05, 'sine', { volume: 0.2 });
    setTimeout(() => playTone(1500, 0.08, 'sine', { volume: 0.15 }), 30);
  }, [playTone]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return {
    isMuted,
    toggleMute,
    playSpin,
    playWin,
    playJackpot,
    playButtonClick,
    playReelStop,
    playBonus,
    playFreeSpin,
    playRiskWin,
    playRiskLose,
    playCoin,
    playTone,
  };
}
