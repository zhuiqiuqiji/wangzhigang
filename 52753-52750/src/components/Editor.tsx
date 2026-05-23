import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Song, Difficulty, NoteData, NoteType } from '@/types/game';
import { useTheme } from '@/hooks/useTheme';

interface EditorProps {
  song: Song;
  difficulty: Difficulty;
  onBack: () => void;
}

const TRACK_KEYS = ['D', 'F', 'J', 'K'];
const NOTE_TYPES: { type: NoteType; label: string; color: string }[] = [
  { type: 'tap', label: 'Tap', color: '#4dd2ff' },
  { type: 'hold', label: 'Hold', color: '#ff6b9d' },
  { type: 'slide', label: 'Slide', color: '#c44dff' },
  { type: 'rapid', label: 'Rapid', color: '#6bff8e' },
];

export const Editor: React.FC<EditorProps> = ({ song, difficulty, onBack }) => {
  const { theme } = useTheme();
  const [notes, setNotes] = useState<NoteData[]>(() => {
    const saved = localStorage.getItem(`editor-${song.id}-${difficulty}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return [...song.noteData[difficulty].slice(0, 50)];
  });
  const [selectedNoteType, setSelectedNoteType] = useState<NoteType>('tap');
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef(0);
  
  const pixelsPerSecond = 200 * zoom;
  const duration = Math.max(...notes.map(n => n.time), 10000) + 5000;
  
  useEffect(() => {
    localStorage.setItem(`editor-${song.id}-${difficulty}`, JSON.stringify(notes));
  }, [notes, song.id, difficulty]);
  
  const playAnimation = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const delta = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;
    
    setCurrentTime(prev => {
      const newTime = prev + delta;
      if (newTime >= duration) {
        setIsPlaying(false);
        return duration;
      }
      return newTime;
    });
    
    animationRef.current = requestAnimationFrame(playAnimation);
  }, [duration]);
  
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(playAnimation);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, playAnimation]);
  
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    const time = (x / pixelsPerSecond) * 1000;
    const track = Math.floor((e.clientY - rect.top) / (rect.height / 4));
    
    if (track >= 0 && track < 4) {
      const roundedTime = Math.round(time / 100) * 100;
      
      if (selectedNoteType === 'hold') {
        setNotes(prev => [...prev, {
          track,
          time: roundedTime,
          type: 'hold',
          duration: 500,
        }]);
      } else if (selectedNoteType === 'slide') {
        setNotes(prev => [...prev, {
          track,
          time: roundedTime,
          type: 'slide',
          endTrack: (track + 1) % 4,
        }]);
      } else if (selectedNoteType === 'rapid') {
        setNotes(prev => [...prev, {
          track,
          time: roundedTime,
          type: 'rapid',
          count: 3,
          interval: 100,
        }]);
      } else {
        setNotes(prev => [...prev, {
          track,
          time: roundedTime,
          type: 'tap',
        }]);
      }
    }
  }, [selectedNoteType, pixelsPerSecond, scrollLeft]);
  
  const handleNoteClick = useCallback((e: React.MouseEvent, noteIndex: number) => {
    e.stopPropagation();
    setSelectedNoteId(noteIndex === selectedNoteId ? null : noteIndex);
  }, [selectedNoteId]);
  
  const deleteSelectedNote = useCallback(() => {
    if (selectedNoteId !== null) {
      setNotes(prev => prev.filter((_, i) => i !== selectedNoteId));
      setSelectedNoteId(null);
    }
  }, [selectedNoteId]);
  
  const clearAll = useCallback(() => {
    if (confirm('确定要清空所有音符吗？')) {
      setNotes([]);
      setSelectedNoteId(null);
    }
  }, []);
  
  const exportNotes = useCallback(() => {
    const dataStr = JSON.stringify(notes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.name}-${difficulty}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [notes, song.name, difficulty]);
  
  const importNotes = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (Array.isArray(data)) {
              setNotes(data);
            }
          } catch (err) {
            alert('文件格式错误');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const newZoom = Math.max(0.5, Math.min(3, zoom - e.deltaY * 0.01));
      setZoom(newZoom);
    } else {
      setScrollLeft(prev => Math.max(0, prev + e.deltaY));
    }
  }, [zoom]);
  
  const selectedNote = selectedNoteId !== null ? notes[selectedNoteId] : null;
  
  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ background: theme.colors.backgroundGradient }}
    >
      <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg"
              style={{ background: theme.colors.trackBg, color: theme.colors.text }}
            >
              ← 返回
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                节拍编辑器
              </h1>
              <p style={{ color: theme.colors.textSecondary }}>
                {song.name} - {difficulty}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-6 py-2 rounded-lg font-bold"
              style={{ 
                background: isPlaying ? '#ff4444' : theme.colors.accent,
                color: '#fff'
              }}
            >
              {isPlaying ? '⏸ 暂停' : '▶ 播放'}
            </button>
            <button
              onClick={() => setCurrentTime(0)}
              className="px-4 py-2 rounded-lg"
              style={{ background: theme.colors.trackBg, color: theme.colors.text }}
            >
              ⟲ 重置
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {NOTE_TYPES.map(({ type, label, color }) => (
              <button
                key={type}
                onClick={() => setSelectedNoteType(type)}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  selectedNoteType === type ? 'scale-110' : ''
                }`}
                style={{
                  background: selectedNoteType === type 
                    ? `${color}33` 
                    : theme.colors.trackBg,
                  color: selectedNoteType === type ? color : theme.colors.text,
                  border: `2px solid ${selectedNoteType === type ? color : 'transparent'}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <span style={{ color: theme.colors.textSecondary }}>缩放:</span>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-24"
            />
            <span style={{ color: theme.colors.text }}>{zoom.toFixed(1)}x</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={importNotes}
              className="px-4 py-2 rounded-lg"
              style={{ background: theme.colors.trackBg, color: theme.colors.text }}
            >
              导入
            </button>
            <button
              onClick={exportNotes}
              className="px-4 py-2 rounded-lg"
              style={{ background: theme.colors.trackBg, color: theme.colors.text }}
            >
              导出
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 rounded-lg"
              style={{ background: '#ff444433', color: '#ff4444' }}
            >
              清空
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <div 
          ref={timelineRef}
          className="w-full h-full overflow-auto"
          onWheel={handleWheel}
          onClick={handleTimelineClick}
          style={{ cursor: 'crosshair' }}
        >
          <div 
            className="relative"
            style={{ 
              width: `${(duration / 1000) * pixelsPerSecond}px`,
              height: '100%',
              minHeight: '400px',
            }}
          >
            {Array.from({ length: Math.ceil(duration / 1000) + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l opacity-30"
                style={{
                  left: `${i * pixelsPerSecond}px`,
                  borderColor: theme.colors.text,
                }}
              >
                <span 
                  className="text-xs ml-1"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {i}s
                </span>
              </div>
            ))}
            
            {TRACK_KEYS.map((key, trackIndex) => (
              <div
                key={trackIndex}
                className="absolute left-0 right-0 border-t opacity-20"
                style={{
                  top: `${trackIndex * 25}%`,
                  height: '25%',
                  borderColor: theme.colors.text,
                }}
              >
                <div 
                  className="absolute left-2 top-1/2 -translate-y-1/2 font-bold"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {key}
                </div>
              </div>
            ))}
            
            {notes.map((note, index) => {
              const color = theme.colors.notes[note.track];
              const x = (note.time / 1000) * pixelsPerSecond;
              const y = note.track * 25;
              const height = note.type === 'hold' 
                ? Math.max(40, ((note.duration || 500) / 1000) * pixelsPerSecond)
                : 40;
              
              return (
                <div
                  key={index}
                  onClick={(e) => handleNoteClick(e, index)}
                  className={`absolute rounded transition-all ${
                    selectedNoteId === index ? 'ring-4 ring-white z-10' : ''
                  }`}
                  style={{
                    left: `${x}px`,
                    top: `${y + 2}%`,
                    width: '20%',
                    height: `${height}px`,
                    background: note.type === 'hold'
                      ? `linear-gradient(180deg, ${color}, ${color}88)`
                      : color,
                    boxShadow: `0 0 10px ${color}66`,
                    border: `2px solid ${color}`,
                    cursor: 'pointer',
                  }}
                >
                  {note.type !== 'tap' && (
                    <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                      {note.type === 'hold' ? 'H' : note.type === 'slide' ? 'S' : 'R'}
                    </span>
                  )}
                </div>
              );
            })}
            
            <div
              className="absolute top-0 bottom-0 w-1 z-20 pointer-events-none"
              style={{
                left: `${(currentTime / 1000) * pixelsPerSecond}px`,
                background: '#ff4444',
                boxShadow: '0 0 10px #ff444466',
              }}
            />
          </div>
        </div>
      </div>
      
      {selectedNote && (
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <h3 className="font-bold mb-2" style={{ color: theme.colors.text }}>
            音符属性
          </h3>
          <div className="flex items-center gap-4">
            <div>
              <label style={{ color: theme.colors.textSecondary }}>轨道</label>
              <select
                value={selectedNote.track}
                onChange={(e) => {
                  const newTrack = parseInt(e.target.value);
                  setNotes(prev => prev.map((n, i) => 
                    i === selectedNoteId ? { ...n, track: newTrack } : n
                  ));
                }}
                className="ml-2 px-2 py-1 rounded"
                style={{ background: theme.colors.trackBg, color: theme.colors.text }}
              >
                {TRACK_KEYS.map((k, i) => (
                  <option key={k} value={i}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ color: theme.colors.textSecondary }}>时间</label>
              <input
                type="number"
                value={selectedNote.time}
                onChange={(e) => {
                  const newTime = parseInt(e.target.value) || 0;
                  setNotes(prev => prev.map((n, i) => 
                    i === selectedNoteId ? { ...n, time: newTime } : n
                  ));
                }}
                className="ml-2 px-2 py-1 rounded w-24"
                style={{ background: theme.colors.trackBg, color: theme.colors.text }}
              />
            </div>
            {selectedNote.type === 'hold' && (
              <div>
                <label style={{ color: theme.colors.textSecondary }}>持续时间</label>
                <input
                  type="number"
                  value={selectedNote.duration || 500}
                  onChange={(e) => {
                    const duration = parseInt(e.target.value) || 500;
                    setNotes(prev => prev.map((n, i) => 
                      i === selectedNoteId ? { ...n, duration } : n
                    ));
                  }}
                  className="ml-2 px-2 py-1 rounded w-24"
                  style={{ background: theme.colors.trackBg, color: theme.colors.text }}
                />
              </div>
            )}
            <button
              onClick={deleteSelectedNote}
              className="ml-auto px-4 py-2 rounded-lg"
              style={{ background: '#ff444433', color: '#ff4444' }}
            >
              删除音符
            </button>
          </div>
        </div>
      )}
      
      <div className="p-4 text-center" style={{ color: theme.colors.textSecondary }}>
        点击时间轴添加音符 | 点击音符选中编辑 | 按住 Ctrl 滚轮缩放 | 滚轮横向滚动
      </div>
    </div>
  );
};
