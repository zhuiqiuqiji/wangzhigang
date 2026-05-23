import React from 'react';
import { TRACK_KEYS } from '@/hooks/useKeyboard';

interface TrackProps {
  index: number;
  active: boolean;
  trackColors: string[];
}

export const Track: React.FC<TrackProps> = ({ index, active, trackColors }) => {
  const key = TRACK_KEYS[index].toUpperCase();
  const color = trackColors[index];
  
  return (
    <div className="relative flex-1 h-full border-x border-white/10">
      <div
        className="absolute inset-0 transition-opacity duration-100"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${color}22 50%, ${color}44 100%)`,
          opacity: active ? 1 : 0,
        }}
      />
      
      <div
        className="absolute bottom-0 left-0 right-0 h-20 transition-all duration-100"
        style={{
          background: active 
            ? `linear-gradient(0deg, ${color}66 0%, transparent 100%)` 
            : 'transparent',
          boxShadow: active ? `0 -20px 60px ${color}44` : 'none',
        }}
      />
      
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold transition-all duration-100"
        style={{
          background: active 
            ? `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`
            : 'rgba(255,255,255,0.1)',
          color: active ? '#fff' : 'rgba(255,255,255,0.5)',
          boxShadow: active ? `0 0 30px ${color}88` : 'none',
          transform: `translateX(-50%) scale(${active ? 1.1 : 1})`,
          border: `2px solid ${active ? color : 'rgba(255,255,255,0.2)'}`,
        }}
      >
        {key}
      </div>
    </div>
  );
};
