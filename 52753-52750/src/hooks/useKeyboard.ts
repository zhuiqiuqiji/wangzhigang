import { useEffect, useCallback } from 'react';
import { TrackKey } from '@/types/game';

const KEY_MAP: Record<string, number> = {
  'd': 0,
  'D': 0,
  'f': 1,
  'F': 1,
  'j': 2,
  'J': 2,
  'k': 3,
  'K': 3,
};

interface UseKeyboardOptions {
  onKeyPress: (track: number) => void;
  enabled?: boolean;
}

export function useKeyboard({ onKeyPress, enabled = true }: UseKeyboardOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    const track = KEY_MAP[e.key];
    if (track !== undefined) {
      e.preventDefault();
      onKeyPress(track);
    }
  }, [enabled, onKeyPress]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export const TRACK_KEYS: TrackKey[] = ['d', 'f', 'j', 'k'];
