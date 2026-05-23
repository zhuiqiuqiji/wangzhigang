import { useRef, useCallback, useEffect } from 'react';

interface UseAudioOptions {
  bpm: number;
  enabled?: boolean;
}

export function useAudio({ bpm, enabled = false }: UseAudioOptions) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const beatIntervalRef = useRef<number | null>(null);
  const beatCountRef = useRef(0);
  
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);
  
  const playBeat = useCallback((frequency: number, duration: number = 0.1, volume: number = 0.3) => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, []);
  
  const playHitSound = useCallback(() => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  }, []);
  
  const start = useCallback(() => {
    initAudio();
    beatCountRef.current = 0;
    
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    const interval = 60000 / bpm;
    
    beatIntervalRef.current = window.setInterval(() => {
      const isDownbeat = beatCountRef.current % 4 === 0;
      playBeat(isDownbeat ? 440 : 330, 0.08, isDownbeat ? 0.25 : 0.15);
      beatCountRef.current++;
    }, interval);
  }, [bpm, initAudio, playBeat]);
  
  const stop = useCallback(() => {
    if (beatIntervalRef.current) {
      clearInterval(beatIntervalRef.current);
      beatIntervalRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }
    
    return () => stop();
  }, [enabled, start, stop]);
  
  return { playHitSound, start, stop, initAudio };
}
