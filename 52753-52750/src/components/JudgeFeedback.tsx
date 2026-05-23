import React from 'react';
import { JudgeType } from '@/types/game';
import { getJudgeColor, getJudgeText } from '@/utils/judge';

interface JudgeFeedbackProps {
  type: JudgeType;
  track: number;
}

export const JudgeFeedback: React.FC<JudgeFeedbackProps> = ({ type, track }) => {
  const color = getJudgeColor(type);
  const text = getJudgeText(type);
  
  return (
    <div
      className="absolute pointer-events-none animate-judge-pop"
      style={{
        left: `${track * 25 + 12.5}%`,
        top: '40%',
        transform: 'translateX(-50%)',
        textShadow: `0 0 20px ${color}, 0 0 40px ${color}`,
        color,
        fontSize: '2rem',
        fontWeight: 'bold',
        letterSpacing: '2px',
      }}
    >
      {text}
    </div>
  );
};
