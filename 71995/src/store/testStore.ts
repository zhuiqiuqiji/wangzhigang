import { create } from 'zustand';
import type { TestMode, TestRoundResult } from '@/../shared/types';

type TestState = 'idle' | 'waiting' | 'ready' | 'foul' | 'complete';

const TOTAL_ROUNDS = 5;
const MIN_DELAY = 1000;
const MAX_DELAY = 5000;

function randomDelay(): number {
  return MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
}

interface TestStoreState {
  currentMode: TestMode;
  rounds: TestRoundResult[];
  currentRound: number;
  testState: TestState;
  startTime: number;
  results: TestRoundResult[];
  stimulusData: string | null;
  pendingTimeouts: Set<ReturnType<typeof setTimeout>>;
}

interface TestStoreActions {
  setMode: (mode: TestMode) => void;
  startTest: () => void;
  handleReaction: () => void;
  resetTest: () => void;
  _scheduleReady: () => void;
  _goReady: () => void;
  _recordResult: (isFoul: boolean, reactionTime?: number) => void;
  _advanceOrComplete: () => void;
  _clearPendingTimeouts: () => void;
}

type TestStore = TestStoreState & TestStoreActions;

export const useTestStore = create<TestStore>((set, get) => ({
  currentMode: 'visual',
  rounds: [],
  currentRound: 0,
  testState: 'idle',
  startTime: 0,
  results: [],
  stimulusData: null,
  pendingTimeouts: new Set(),

  setMode: (mode) => {
    get()._clearPendingTimeouts();
    set({ currentMode: mode, testState: 'idle', currentRound: 0, results: [], rounds: [], stimulusData: null });
  },

  startTest: () => {
    get()._clearPendingTimeouts();
    set({
      testState: 'waiting',
      currentRound: 1,
      results: [],
      rounds: [],
      stimulusData: null,
    });
    get()._scheduleReady();
  },

  handleReaction: () => {
    const { testState, startTime, currentRound, currentMode } = get();

    if (testState === 'waiting') {
      get()._clearPendingTimeouts();
      get()._recordResult(true);
      set({ testState: 'foul' });
      return;
    }

    if (testState === 'ready') {
      const reactionTime = Math.round(performance.now() - startTime);
      get()._recordResult(false, reactionTime);
      get()._advanceOrComplete();
      return;
    }

    if (testState === 'foul') {
      get()._advanceOrComplete();
      return;
    }
  },

  resetTest: () => {
    get()._clearPendingTimeouts();
    set({
      testState: 'idle',
      currentRound: 0,
      results: [],
      rounds: [],
      stimulusData: null,
    });
  },

  _scheduleReady: () => {
    const delay = randomDelay();
    const timeout = setTimeout(() => {
      get()._goReady();
    }, delay);
    const pending = new Set(get().pendingTimeouts);
    pending.add(timeout);
    set({ pendingTimeouts: pending });
  },

  _goReady: () => {
    const { currentMode } = get();
    let stimulusData: string | null = null;

    if (currentMode === 'visual') {
      stimulusData = 'green';
    } else if (currentMode === 'audio') {
      stimulusData = 'beep';
    } else if (currentMode === 'choice') {
      const colors = ['red', 'blue', 'green', 'yellow'];
      stimulusData = colors[Math.floor(Math.random() * colors.length)];
    } else if (currentMode === 'inhibition') {
      stimulusData = Math.random() < 0.7 ? 'go' : 'nogo';
    }

    set({
      testState: 'ready',
      startTime: performance.now(),
      stimulusData,
    });
  },

  _recordResult: (isFoul, reactionTime?) => {
    const { currentRound, currentMode, stimulusData } = get();
    const result: TestRoundResult = {
      round: currentRound,
      reactionTime: reactionTime ?? null,
      isFoul,
      stimulusDetail: stimulusData ?? undefined,
    };
    set((state) => ({
      results: [...state.results, result],
      rounds: [...state.rounds, result],
    }));
  },

  _advanceOrComplete: () => {
    const { currentRound } = get();
    if (currentRound >= TOTAL_ROUNDS) {
      set({ testState: 'complete' });
    } else {
      set({
        testState: 'waiting',
        currentRound: currentRound + 1,
        stimulusData: null,
      });
      get()._scheduleReady();
    }
  },

  _clearPendingTimeouts: () => {
    const { pendingTimeouts } = get();
    pendingTimeouts.forEach((t) => clearTimeout(t));
    set({ pendingTimeouts: new Set() });
  },
}));
