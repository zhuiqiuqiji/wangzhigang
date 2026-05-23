import React from 'react';

export const JudgeLine: React.FC = () => {
  return (
    <div
      className="absolute left-0 right-0 h-2 z-10"
      style={{
        bottom: '100px',
        background: 'linear-gradient(90deg, #ff00ff, #00ffff, #ffff00, #ff00ff)',
        boxShadow: '0 0 20px #ff00ff88, 0 0 40px #00ffff66, 0 0 60px #ffff0044',
        animation: 'judgeLineGlow 2s ease-in-out infinite',
      }}
    />
  );
};
