import React from 'react';
import { PAYLINES } from '@/config/gameConfig';
import type { ThemeType } from '@/types/game';
import { cn } from '@/lib/utils';

interface PaylinesDisplayProps {
  activePaylines: number[];
  highlightedPositions: Set<string>;
  currentTheme: ThemeType;
  reelWidth: number;
  reelHeight: number;
  gap: number;
}

const PAYLINE_COLORS = [
  '#FFD700',
  '#00FF00',
  '#FF00FF',
  '#00FFFF',
  '#FF6B35',
];

export const PaylinesDisplay: React.FC<PaylinesDisplayProps> = React.memo(({
  activePaylines,
  highlightedPositions,
  currentTheme,
  reelWidth,
  reelHeight,
  gap,
}) => {
  const rowHeight = reelHeight / 3;
  const offsetX = 0;

  const getCellCenter = (col: number, row: number) => {
    const x = offsetX + col * (reelWidth + gap) + reelWidth / 2;
    const y = row * rowHeight + rowHeight / 2;
    return { x, y };
  };

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        width: '100%',
        height: '100%',
      }}
      preserveAspectRatio="none"
    >
      <defs>
        {PAYLINE_COLORS.map((color, index) => (
          <filter key={index} id={`glow-${index}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
      </defs>

      {activePaylines.map((paylineId) => {
        const payline = PAYLINES[paylineId];
        if (!payline) return null;

        const points = payline.pattern.map(([col, row]) => {
          const { x, y } = getCellCenter(col, row);
          return `${x},${y}`;
        }).join(' ');

        const color = PAYLINE_COLORS[paylineId % PAYLINE_COLORS.length];
        const isWinning = payline.pattern.some(
          ([col, row]) => highlightedPositions.has(`${col}-${row}`)
        );

        return (
          <g key={paylineId}>
            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth={isWinning ? 4 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#glow-${paylineId})`}
              className={cn(
                'transition-all duration-300',
                isWinning ? 'opacity-100' : 'opacity-40'
              )}
              style={{
                strokeDasharray: isWinning ? 'none' : '5,5',
                animation: isWinning ? `payline-flash-${paylineId} 0.5s ease-in-out infinite` : 'none',
              }}
            />
            {payline.pattern.map(([col, row], idx) => {
              const { x, y } = getCellCenter(col, row);
              const isHighlighted = highlightedPositions.has(`${col}-${row}`);
              return (
                <circle
                  key={`${col}-${row}`}
                  cx={x}
                  cy={y}
                  r={isHighlighted ? 8 : 4}
                  fill={isHighlighted ? color : 'transparent'}
                  stroke={color}
                  strokeWidth={2}
                  className="transition-all duration-300"
                  style={{
                    animation: isHighlighted ? `point-pulse-${paylineId}-${idx} 0.3s ease-in-out infinite` : 'none',
                  }}
                />
              );
            })}
            <style>{`
              @keyframes payline-flash-${paylineId} {
                0%, 100% { stroke-opacity: 1; }
                50% { stroke-opacity: 0.5; }
              }
              @keyframes point-pulse-${paylineId}-0 {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.3); }
              }
            `}</style>
          </g>
        );
      })}
    </svg>
  );
});

PaylinesDisplay.displayName = 'PaylinesDisplay';
