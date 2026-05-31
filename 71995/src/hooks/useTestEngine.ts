import { useState, useRef, useCallback, useEffect } from 'react';
import type { TestMode, TestRoundResult } from '@/../shared/types';
import { createAudioContext, playBeep } from '@/utils/audio';

type TestEngineState = 'idle' | 'waiting' | 'ready' | 'foul' | 'complete';

const TOTAL_ROUNDS = 5;
const MIN_DELAY = 1000;
const MAX_DELAY = 5000;
const INHIBITION_NOGO_TIMEOUT = 1500;

function randomDelay(): number {
  return MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
}

const CHOICE_COLORS = ['red', 'blue', 'green', 'yellow'] as const;

interface UseTestEngineReturn {
  testState: TestEngineState;
  currentRound: number;
  totalRounds: number;
  results: TestRoundResult[];
  stimulusData: string | null;
  start: () => void;
  handleClick: (choiceData?: string) => void;
  handleKeyPress: (key: string) => void;
  reset: () => void;
}

export function useTestEngine(mode: TestMode): UseTestEngineReturn {
  const [testState, setTestState] = useState<TestEngineState>('idle');
  const [currentRound, setCurrentRound] = useState(0);
  const [results, setResults] = useState<TestRoundResult[]>([]);
  const [stimulusData, setStimulusData] = useState<string | null>(null);

  const stateRef = useRef<TestEngineState>('idle');
  const roundRef = useRef(0);
  const stimulusRef = useRef<string | null>(null);
  const startTimeRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const pendingTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const setState = useCallback((s: TestEngineState) => {
    stateRef.current = s;
    setTestState(s);
  }, []);

  const setRound = useCallback((r: number) => {
    roundRef.current = r;
    setCurrentRound(r);
  }, []);

  const setStimulus = useCallback((s: string | null) => {
    stimulusRef.current = s;
    setStimulusData(s);
  }, []);

  const clearTimeouts = useCallback(() => {
    pendingTimeoutsRef.current.forEach((t) => clearTimeout(t));
    pendingTimeoutsRef.current.clear();
  }, []);

  const addTimeout = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(() => {
      pendingTimeoutsRef.current.delete(id);
      fn();
    }, delay);
    pendingTimeoutsRef.current.add(id);
  }, []);

  const ensureAudioCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = createAudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const recordResult = useCallback((isFoul: boolean, reactionTime?: number, detail?: string) => {
    const result: TestRoundResult = {
      round: roundRef.current,
      reactionTime: reactionTime ?? null,
      isFoul,
      stimulusDetail: detail ?? stimulusRef.current ?? undefined,
    };
    setResults((prev) => [...prev, result]);
  }, []);

  const emitStimulusRef = useRef<() => void>(() => {});

  const scheduleReady = useCallback(() => {
    const delay = randomDelay();
    addTimeout(() => {
      emitStimulusRef.current();
    }, delay);
  }, [addTimeout]);

  const advanceOrComplete = useCallback(() => {
    if (roundRef.current >= TOTAL_ROUNDS) {
      setState('complete');
    } else {
      setRound(roundRef.current + 1);
      setState('waiting');
      setStimulus(null);
      scheduleReady();
    }
  }, [setState, setRound, setStimulus, scheduleReady]);

  const emitStimulus = useCallback(() => {
    let stimulus: string;

    if (mode === 'visual') {
      stimulus = 'green';
    } else if (mode === 'audio') {
      stimulus = 'beep';
      const ctx = ensureAudioCtx();
      playBeep(ctx);
    } else if (mode === 'choice') {
      stimulus = CHOICE_COLORS[Math.floor(Math.random() * CHOICE_COLORS.length)];
    } else {
      stimulus = Math.random() < 0.7 ? 'go' : 'nogo';
    }

    setStimulus(stimulus);
    setState('ready');
    startTimeRef.current = performance.now();

    if (mode === 'inhibition' && stimulus === 'nogo') {
      addTimeout(() => {
        if (stateRef.current === 'ready') {
          recordResult(false, INHIBITION_NOGO_TIMEOUT, 'nogo');
          advanceOrComplete();
        }
      }, INHIBITION_NOGO_TIMEOUT);
    }
  }, [mode, ensureAudioCtx, setStimulus, setState, recordResult, advanceOrComplete, addTimeout]);

  emitStimulusRef.current = emitStimulus;

  const start = useCallback(() => {
    clearTimeouts();
    setResults([]);
    setRound(1);
    setState('waiting');
    setStimulus(null);
    scheduleReady();
  }, [clearTimeouts, setRound, setState, setStimulus, scheduleReady]);

  const handleClick = useCallback((choiceData?: string) => {
    const s = stateRef.current;
    if (s === 'idle' || s === 'complete') return;

    if (s === 'waiting') {
      clearTimeouts();
      recordResult(true, undefined, 'early_click');
      setState('foul');
      return;
    }

    if (s === 'foul') {
      advanceOrComplete();
      return;
    }

    if (s === 'ready') {
      const reactionTime = Math.round(performance.now() - startTimeRef.current);

      if (mode === 'visual') {
        recordResult(false, reactionTime);
        advanceOrComplete();
        return;
      }

      if (mode === 'audio') {
        recordResult(false, reactionTime);
        advanceOrComplete();
        return;
      }

      if (mode === 'choice') {
        const isCorrect = choiceData === stimulusRef.current;
        recordResult(!isCorrect, reactionTime);
        if (isCorrect) {
          advanceOrComplete();
        } else {
          setState('foul');
        }
        return;
      }

      if (mode === 'inhibition') {
        if (stimulusRef.current === 'nogo') {
          clearTimeouts();
          recordResult(true, reactionTime, 'nogo_click');
          setState('foul');
        } else {
          recordResult(false, reactionTime, 'go');
          advanceOrComplete();
        }
        return;
      }
    }
  }, [mode, clearTimeouts, recordResult, setState, advanceOrComplete]);

  const handleKeyPress = useCallback((key: string) => {
    if (key === ' ' || key === 'Enter') {
      handleClick();
    }
  }, [handleClick]);

  const reset = useCallback(() => {
    clearTimeouts();
    setState('idle');
    setRound(0);
    setResults([]);
    setStimulus(null);
  }, [clearTimeouts, setState, setRound, setStimulus]);

  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  return {
    testState,
    currentRound,
    totalRounds: TOTAL_ROUNDS,
    results,
    stimulusData,
    start,
    handleClick,
    handleKeyPress,
    reset,
  };
}
