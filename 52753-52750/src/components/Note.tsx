import React from 'react';
import { Note as NoteType, HoldNote, SlideNote, RapidNote, Theme } from '@/types/game';

interface NoteProps {
  note: NoteType;
  trackColors: string[];
  theme: Theme;
  currentTime: number;
  judgeLineY: number;
  noteSpeed: number;
}

function getNoteBorderRadius(style: Theme['noteStyle']): string {
  switch (style) {
    case 'rounded': return '8px';
    case 'sharp': return '2px';
    case 'pill': return '20px';
    case 'diamond': return '2px';
    default: return '8px';
  }
}

export const Note: React.FC<NoteProps> = ({ note, trackColors, theme, currentTime, judgeLineY, noteSpeed }) => {
  if (note.hit && note.judge === 'miss') return null;
  
  const color = trackColors[note.track];
  const opacity = note.hit ? 0.3 : 1;
  const baseTransform = note.hit ? 'scale(0.8)' : 'scale(1)';
  const borderRadius = getNoteBorderRadius(theme.noteStyle);
  const glowStyle = theme.effects.glow 
    ? `0 0 20px ${color}66, 0 0 40px ${color}33, inset 0 2px 4px rgba(255,255,255,0.3)`
    : 'inset 0 2px 4px rgba(255,255,255,0.3)';
  
  const commonStyle: React.CSSProperties = {
    left: `${note.track * 25 + 2.5}%`,
    top: `${note.y}px`,
    width: '20%',
    opacity,
    boxShadow: glowStyle,
    border: `2px solid ${color}`,
    borderRadius,
    transform: baseTransform,
    transition: 'opacity 75ms, transform 75ms',
  };
  
  if (note.type === 'hold') {
    const holdNote = note as HoldNote;
    const startY = note.y || 0;
    const endY = startY + (holdNote.duration / 1000) * noteSpeed;
    const height = Math.max(endY - startY, 40);
    
    return (
      <div
        className="absolute"
        style={{
          ...commonStyle,
          top: `${startY}px`,
          height: `${height}px`,
          background: `linear-gradient(180deg, ${color} 0%, ${color}66 50%, ${color} 100%)`,
        }}
      >
        <div 
          className="absolute top-0 left-0 right-0 h-10 rounded-t-md"
          style={{ 
            background: `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`,
            borderRadius: `${borderRadius} ${borderRadius} 0 0`,
          }}
        />
        {!note.hit && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-10 rounded-b-md border-t-2"
            style={{ 
              background: `linear-gradient(0deg, ${color} 0%, ${color}88 100%)`,
              borderColor: color,
              borderRadius: `0 0 ${borderRadius} ${borderRadius}`,
            }}
          />
        )}
      </div>
    );
  }
  
  if (note.type === 'slide') {
    const slideNote = note as SlideNote;
    const direction = slideNote.endTrack > note.track ? 1 : -1;
    const arrowChar = direction > 0 ? '→' : '←';
    
    return (
      <div
        className="absolute flex items-center justify-center"
        style={{
          ...commonStyle,
          height: '40px',
          background: `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`,
        }}
      >
        <span className="text-white text-xl font-bold drop-shadow-lg">
          {arrowChar}
        </span>
      </div>
    );
  }
  
  if (note.type === 'rapid') {
    const rapidNote = note as RapidNote;
    const remaining = rapidNote.count - rapidNote.hitCount;
    
    return (
      <div
        className="absolute flex items-center justify-center"
        style={{
          ...commonStyle,
          height: '40px',
          background: `repeating-linear-gradient(45deg, ${color}, ${color} 5px, ${color}aa 5px, ${color}aa 10px)`,
        }}
      >
        <span className="text-white text-lg font-bold drop-shadow-lg">
          ×{remaining}
        </span>
      </div>
    );
  }
  
  return (
    <div
      className="absolute"
      style={{
        ...commonStyle,
        height: '40px',
        background: `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`,
      }}
    />
  );
};
