export type GameState = 'menu' | 'playing' | 'result' | 'editor' | 'replay';

export type Difficulty = 'easy' | 'normal' | 'hard';

export type JudgeType = 'perfect' | 'great' | 'good' | 'miss';

export type TrackKey = 'd' | 'f' | 'j' | 'k';

export type NoteType = 'tap' | 'hold' | 'slide' | 'rapid';

export interface BaseNote {
  id: number;
  track: number;
  time: number;
  type: NoteType;
  hit: boolean;
  judge?: JudgeType;
  y?: number;
}

export interface TapNote extends BaseNote {
  type: 'tap';
}

export interface HoldNote extends BaseNote {
  type: 'hold';
  duration: number;
  holdStart?: number;
  holdEnd?: boolean;
}

export interface SlideNote extends BaseNote {
  type: 'slide';
  endTrack: number;
}

export interface RapidNote extends BaseNote {
  type: 'rapid';
  count: number;
  hitCount: number;
  interval: number;
}

export type Note = TapNote | HoldNote | SlideNote | RapidNote;

export interface NoteData {
  track: number;
  time: number;
  type?: NoteType;
  duration?: number;
  endTrack?: number;
  count?: number;
  interval?: number;
}

export interface BPMChange {
  time: number;
  bpm: number;
  transition?: number;
}

export interface Song {
  id: string;
  name: string;
  artist: string;
  baseBpm: number;
  bpmChanges?: BPMChange[];
  duration: number;
  noteData: Record<Difficulty, NoteData[]>;
}

export interface GameStatus {
  score: number;
  combo: number;
  maxCombo: number;
  perfect: number;
  great: number;
  good: number;
  miss: number;
}

export interface JudgeFeedback {
  id: number;
  type: JudgeType;
  track: number;
  timestamp: number;
}

export type Rating = 'S' | 'A' | 'B' | 'C' | 'D';

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    background: string;
    backgroundGradient: string;
    trackBg: string;
    trackActive: string;
    judgeLine: string;
    notes: string[];
    text: string;
    textSecondary: string;
    accent: string;
  };
  noteStyle: 'rounded' | 'sharp' | 'pill' | 'diamond';
  effects: {
    glow: boolean;
    particles: boolean;
    trail: boolean;
  };
}

export interface ReplayFrame {
  time: number;
  inputs: boolean[];
  noteStates: Array<{
    id: number;
    hit: boolean;
    judge?: JudgeType;
    y?: number;
  }>;
}

export interface ReplayData {
  version: string;
  songId: string;
  difficulty: Difficulty;
  gameStatus: GameStatus;
  frames: ReplayFrame[];
  playerName: string;
  timestamp: number;
  duration: number;
}

export interface EditorState {
  currentTime: number;
  selectedNoteId: number | null;
  isPlaying: boolean;
  zoom: number;
  scrollLeft: number;
}
