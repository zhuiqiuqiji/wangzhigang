import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Song, Difficulty, Note, GameStatus, JudgeType, JudgeFeedback as JudgeFeedbackType, ReplayFrame, ReplayData, HoldNote, SlideNote, RapidNote, TapNote } from '@/types/game';
import { getNoteSpeed } from '@/data/songs';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useAudio } from '@/hooks/useAudio';
import { useTheme } from '@/hooks/useTheme';
import { judgeNote } from '@/utils/judge';
import { calculateScore } from '@/utils/score';
import { Track } from './Track';
import { Note as NoteComponent } from './Note';
import { JudgeLine } from './JudgeLine';
import { JudgeFeedback } from './JudgeFeedback';

interface GameSceneProps {
  song: Song;
  difficulty: Difficulty;
  onGameEnd: (status: GameStatus, replay?: ReplayData) => void;
}

const JUDGE_LINE_Y = 600;
const NOTE_TRAVEL_TIME = 2000;

const initialGameStatus: GameStatus = {
  score: 0,
  combo: 0,
  maxCombo: 0,
  perfect: 0,
  great: 0,
  good: 0,
  miss: 0,
};

function createNoteFromData(id: number, data: any): Note {
  const type = data.type || 'tap';
  
  switch (type) {
    case 'hold':
      return {
        id,
        track: data.track,
        time: data.time,
        type: 'hold',
        hit: false,
        duration: data.duration || 500,
      } as HoldNote;
    case 'slide':
      return {
        id,
        track: data.track,
        time: data.time,
        type: 'slide',
        hit: false,
        endTrack: data.endTrack ?? data.track,
      } as SlideNote;
    case 'rapid':
      return {
        id,
        track: data.track,
        time: data.time,
        type: 'rapid',
        hit: false,
        count: data.count || 3,
        hitCount: 0,
        interval: data.interval || 100,
      } as RapidNote;
    default:
      return {
        id,
        track: data.track,
        time: data.time,
        type: 'tap',
        hit: false,
      } as TapNote;
  }
}

function getCurrentBPM(song: Song, currentTime: number): number {
  if (!song.bpmChanges || song.bpmChanges.length === 0) {
    return song.baseBpm;
  }
  
  let currentBpm = song.baseBpm;
  
  for (const change of song.bpmChanges) {
    if (currentTime >= change.time) {
      if (change.transition && change.transition > 0) {
        const progress = Math.min(1, (currentTime - change.time) / change.transition);
        currentBpm = currentBpm + (change.bpm - currentBpm) * progress;
      } else {
        currentBpm = change.bpm;
      }
    } else {
      break;
    }
  }
  
  return currentBpm;
}

export const GameScene: React.FC<GameSceneProps> = ({ song, difficulty, onGameEnd }) => {
  const { theme } = useTheme();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTracks, setActiveTracks] = useState<boolean[]>([false, false, false, false]);
  const [gameStatus, setGameStatus] = useState<GameStatus>(initialGameStatus);
  const [feedbacks, setFeedbacks] = useState<JudgeFeedbackType[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [currentBPM, setCurrentBPM] = useState(song.baseBpm);
  
  const gameTimeRef = useRef(0);
  const notesSpawnedRef = useRef(0);
  const noteDataRef = useRef(song.noteData[difficulty]);
  const feedbackIdRef = useRef(0);
  const gameEndedRef = useRef(false);
  const gameStatusRef = useRef<GameStatus>(initialGameStatus);
  const onGameEndRef = useRef(onGameEnd);
  const replayFramesRef = useRef<ReplayFrame[]>([]);
  const lastFrameTimeRef = useRef(0);
  const activeTracksRef = useRef(activeTracks);
  const notesRef = useRef<Note[]>([]);
  const handleNoteHitRef = useRef<(note: Note, judge: JudgeType) => void>(() => {});
  
  useEffect(() => {
    activeTracksRef.current = activeTracks;
  }, [activeTracks]);
  
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);
  
  useEffect(() => {
    onGameEndRef.current = onGameEnd;
  }, [onGameEnd]);
  
  const baseNoteSpeed = getNoteSpeed(difficulty);
  const noteSpeed = useMemo(() => {
    return baseNoteSpeed * (currentBPM / song.baseBpm);
  }, [baseNoteSpeed, currentBPM, song.baseBpm]);
  
  const { playHitSound, initAudio } = useAudio({
    bpm: song.baseBpm,
    enabled: gameStarted && countdown === 0,
  });
  
  useEffect(() => {
    initAudio();
  }, [initAudio]);
  
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(c => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setGameStarted(true);
    }
  }, [countdown]);
  
  const updateGameStatus = useCallback((updater: (prev: GameStatus) => GameStatus) => {
    setGameStatus(prev => {
      const newStatus = updater(prev);
      gameStatusRef.current = newStatus;
      return newStatus;
    });
  }, []);
  
  const handleNoteHit = useCallback((note: Note, judge: JudgeType) => {
    playHitSound();
    
    updateGameStatus(prev => {
      const newCombo = judge === 'miss' ? 0 : prev.combo + 1;
      const scoreGain = calculateScore(judge, judge === 'miss' ? 0 : prev.combo);
      
      return {
        ...prev,
        score: prev.score + scoreGain,
        combo: newCombo,
        maxCombo: Math.max(prev.maxCombo, newCombo),
        [judge]: prev[judge] + 1,
      };
    });
    
    const feedbackId = feedbackIdRef.current++;
    setFeedbacks(prev => [...prev, {
      id: feedbackId,
      type: judge,
      track: note.track,
      timestamp: Date.now(),
    }]);
    
    setTimeout(() => {
      setFeedbacks(prev => prev.filter(f => f.id !== feedbackId));
    }, 500);
  }, [playHitSound, updateGameStatus]);
  
  useEffect(() => {
    handleNoteHitRef.current = handleNoteHit;
  }, [handleNoteHit]);
  
  const handleKeyPress = useCallback((track: number) => {
    if (!gameStarted || countdown > 0 || gameEndedRef.current) return;
    
    setActiveTracks(prev => {
      const newActive = [...prev];
      newActive[track] = true;
      return newActive;
    });
    
    setTimeout(() => {
      setActiveTracks(prev => {
        const newActive = [...prev];
        newActive[track] = false;
        return newActive;
      });
    }, 100);
    
    const currentTime = gameTimeRef.current;
    const judgeWindow = 150;
    
    let hitNote: Note | null = null;
    let hitJudge: JudgeType | null = null;
    let rapidNote: RapidNote | null = null;
    
    setNotes(prevNotes => {
      const noteIndex = prevNotes.findIndex(n => 
        n.track === track && 
        !n.hit && 
        Math.abs(n.time - currentTime) <= judgeWindow
      );
      
      if (noteIndex !== -1) {
        const note = prevNotes[noteIndex];
        
        if (note.type === 'rapid') {
          rapidNote = { ...(note as RapidNote), hitCount: (note as RapidNote).hitCount + 1 };
          
          if (rapidNote.hitCount >= rapidNote.count) {
            const timeDiff = currentTime - note.time;
            hitJudge = judgeNote(timeDiff);
            hitNote = note;
            
            const newNotes = [...prevNotes];
            newNotes[noteIndex] = { ...rapidNote, hit: true, judge: hitJudge };
            return newNotes;
          } else {
            const newNotes = [...prevNotes];
            newNotes[noteIndex] = { ...rapidNote };
            return newNotes;
          }
        } else {
          const timeDiff = currentTime - note.time;
          hitJudge = judgeNote(timeDiff);
          hitNote = note;
          
          const newNotes = [...prevNotes];
          newNotes[noteIndex] = { ...note, hit: true, judge: hitJudge };
          return newNotes;
        }
      }
      
      return prevNotes;
    });
    
    if (hitNote && hitJudge) {
      handleNoteHit(hitNote, hitJudge);
    } else if (rapidNote && rapidNote.hitCount < rapidNote.count) {
      playHitSound();
    }
  }, [gameStarted, countdown, handleNoteHit, playHitSound]);
  
  useKeyboard({ onKeyPress: handleKeyPress, enabled: true });
  
  const gameLoop = useCallback((deltaTime: number, currentTime: number) => {
    if (!gameStarted || countdown > 0 || gameEndedRef.current) return;
    
    gameTimeRef.current = currentTime;
    
    const bpm = getCurrentBPM(song, currentTime);
    setCurrentBPM(bpm);
    
    if (currentTime - lastFrameTimeRef.current >= 16) {
      replayFramesRef.current.push({
        time: currentTime,
        inputs: [...activeTracksRef.current],
        noteStates: notesRef.current.map(n => ({
          id: n.id,
          hit: n.hit,
          judge: n.judge,
          y: n.y,
        })),
      });
      lastFrameTimeRef.current = currentTime;
    }
    
    const noteData = noteDataRef.current;
    while (notesSpawnedRef.current < noteData.length) {
      const noteDataItem = noteData[notesSpawnedRef.current];
      const spawnTime = noteDataItem.time - NOTE_TRAVEL_TIME;
      
      if (currentTime >= spawnTime) {
        const newNote = createNoteFromData(notesSpawnedRef.current, noteDataItem);
        setNotes(prev => [...prev, newNote]);
        notesSpawnedRef.current++;
      } else {
        break;
      }
    }
    
    const missedNotes: Note[] = [];
    
    setNotes(prevNotes => {
      return prevNotes.map(note => {
        if (note.hit) return note;
        
        const timeDiff = currentTime - note.time;
        if (timeDiff > 150) {
          missedNotes.push(note);
          return { ...note, hit: true, judge: 'miss' };
        }
        
        const progress = 1 - (note.time - currentTime) / NOTE_TRAVEL_TIME;
        const y = progress * JUDGE_LINE_Y;
        return { ...note, y };
      });
    });
    
    missedNotes.forEach(note => {
      handleNoteHitRef.current(note, 'miss');
    });
    
    if (currentTime >= song.duration + 2000 && !gameEndedRef.current) {
      gameEndedRef.current = true;
      
      const replayData: ReplayData = {
        version: '1.0',
        songId: song.id,
        difficulty,
        gameStatus: gameStatusRef.current,
        frames: replayFramesRef.current,
        playerName: 'Player',
        timestamp: Date.now(),
        duration: currentTime,
      };
      
      setTimeout(() => {
        onGameEndRef.current(gameStatusRef.current, replayData);
      }, 1000);
    }
  }, [gameStarted, countdown, song, baseNoteSpeed, difficulty]);
  
  useGameLoop({ onUpdate: gameLoop, enabled: true });
  
  const progress = Math.min((gameTimeRef.current / song.duration) * 100, 100);
  const trackColors = theme.colors.notes;
  
  return (
    <div 
      className="min-h-screen overflow-hidden relative"
      style={{ background: theme.colors.backgroundGradient }}
    >
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            repeating-linear-gradient(90deg, transparent, transparent 24.9%, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.03) 25.1%, transparent 25.2%)
          `,
        }} />
      </div>
      
      <div className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>{song.name}</h2>
              <p style={{ color: theme.colors.textSecondary }}>{song.artist}</p>
              {song.bpmChanges && song.bpmChanges.length > 0 && (
                <p className="text-sm mt-1" style={{ color: theme.colors.accent }}>
                  BPM: {Math.round(currentBPM)}
                </p>
              )}
            </div>
            <div className="text-right">
              <div 
                className="text-4xl font-bold font-mono"
                style={{ color: theme.colors.accent }}
              >
                {gameStatus.score.toLocaleString()}
              </div>
              <div style={{ color: theme.colors.textSecondary }} className="text-sm">分数</div>
            </div>
          </div>
          
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-100"
              style={{ 
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${trackColors[0]}, ${trackColors[1]}, ${trackColors[2]}, ${trackColors[3]})`,
              }}
            />
          </div>
          
          <div className="flex justify-between mt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{gameStatus.combo}</div>
              <div className="text-xs" style={{ color: theme.colors.textSecondary }}>连击</div>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <div className="font-bold text-yellow-400">{gameStatus.perfect}</div>
                <div style={{ color: theme.colors.textSecondary }}>Perfect</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-400">{gameStatus.great}</div>
                <div style={{ color: theme.colors.textSecondary }}>Great</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-blue-400">{gameStatus.good}</div>
                <div style={{ color: theme.colors.textSecondary }}>Good</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-red-400">{gameStatus.miss}</div>
                <div style={{ color: theme.colors.textSecondary }}>Miss</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[700px]">
        <div 
          className="relative w-full h-full backdrop-blur-sm rounded-2xl overflow-hidden border"
          style={{ 
            background: theme.colors.trackBg,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <div className="absolute inset-0 flex">
            {[0, 1, 2, 3].map(i => (
              <Track 
                key={i} 
                index={i} 
                active={activeTracks[i]} 
                trackColors={trackColors}
              />
            ))}
          </div>
          
          <JudgeLine />
          
          {notes.map(note => (
            note.y !== undefined && note.y > -200 && note.y < 900 && (
              <NoteComponent
                key={note.id}
                note={note}
                trackColors={trackColors}
                theme={theme}
                currentTime={gameTimeRef.current}
                judgeLineY={JUDGE_LINE_Y}
                noteSpeed={noteSpeed}
              />
            )
          ))}
          
          {feedbacks.map(feedback => (
            <JudgeFeedback
              key={feedback.id}
              type={feedback.type}
              track={feedback.track}
            />
          ))}
          
          {countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
              <div 
                className="text-9xl font-bold animate-pulse"
                style={{ 
                  color: theme.colors.text,
                  textShadow: `0 0 60px ${theme.colors.accent}88`,
                }}
              >
                {countdown}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {gameStatus.combo >= 10 && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none z-30">
          <div 
            className="text-6xl font-bold animate-bounce"
            style={{ 
              color: theme.colors.accent,
              textShadow: `0 0 40px ${theme.colors.accent}88`,
            }}
          >
            {gameStatus.combo} COMBO!
          </div>
        </div>
      )}
    </div>
  );
};
