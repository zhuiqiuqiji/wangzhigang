import { useEffect, useRef, useCallback } from 'react';

interface UseGameLoopOptions {
  onUpdate: (deltaTime: number, currentTime: number) => void;
  enabled?: boolean;
}

export function useGameLoop({ onUpdate, enabled = true }: UseGameLoopOptions) {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const startTimeRef = useRef<number>();
  
  const animate = useCallback((time: number) => {
    if (startTimeRef.current === undefined) {
      startTimeRef.current = time;
    }
    
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      const currentTime = time - startTimeRef.current;
      onUpdate(deltaTime, currentTime);
    }
    
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [onUpdate]);
  
  useEffect(() => {
    if (enabled) {
      startTimeRef.current = undefined;
      previousTimeRef.current = undefined;
      requestRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [enabled, animate]);
  
  const reset = useCallback(() => {
    startTimeRef.current = undefined;
    previousTimeRef.current = undefined;
  }, []);
  
  return { reset };
}
