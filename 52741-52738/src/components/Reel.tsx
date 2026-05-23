import React, { useMemo } from 'react';
import type { SymbolType } from '@/types/game';
import { WILD_SYMBOL, SCATTER_SYMBOL, BONUS_SYMBOL } from '@/config/gameConfig';
import { cn } from '@/lib/utils';

interface ReelProps {
  symbols: SymbolType[];
  isSpinning: boolean;
  isWinning?: boolean;
  index: number;
  highlightedRows?: Set<number>;
  themeAccentColor?: string;
}

export const Reel: React.FC<ReelProps> = React.memo(({ 
  symbols, 
  isSpinning, 
  isWinning, 
  index,
  highlightedRows = new Set(),
  themeAccentColor = '#FFD700',
}) => {
  const middleIndex = useMemo(() => Math.floor(symbols.length / 2), [symbols.length]);

  const displaySymbols = useMemo(() => {
    return symbols.slice(middleIndex - 1, middleIndex + 2);
  }, [symbols, middleIndex]);

  const getSpecialSymbolClass = (symbol: SymbolType) => {
    switch (symbol) {
      case WILD_SYMBOL:
        return 'text-purple-400 animate-pulse';
      case SCATTER_SYMBOL:
        return 'text-cyan-400 animate-pulse';
      case BONUS_SYMBOL:
        return 'text-orange-400 animate-pulse';
      default:
        return '';
    }
  };

  return (
    <div 
      className="relative overflow-hidden rounded-xl border-4 shadow-2xl"
      style={{ 
        borderColor: themeAccentColor,
        boxShadow: `0 0 30px ${themeAccentColor}40`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-casino-darker via-casino-dark to-casino-darker z-0" />
      
      <div
        className="absolute inset-0 flex flex-col items-center justify-center transition-transform duration-100"
        style={{
          animation: isSpinning
            ? `spin-reel-${index} 0.12s linear infinite`
            : 'none',
        }}
      >
        {displaySymbols.map((symbol, idx) => {
          const row = idx;
          const isHighlighted = highlightedRows.has(row) || (idx === 1 && isWinning);
          
          return (
            <div
              key={idx}
              className={cn(
                'w-full h-full flex items-center justify-center transition-all duration-300',
                idx === 1 ? 'z-10' : 'opacity-40 blur-sm scale-75',
                isHighlighted && 'animate-win-bounce scale-110',
                getSpecialSymbolClass(symbol)
              )}
              style={{
                fontSize: idx === 1 ? 'clamp(2rem, 8vw, 4rem)' : 'clamp(1.5rem, 6vw, 3rem)',
                filter: isHighlighted 
                  ? `drop-shadow(0 0 15px ${themeAccentColor}) drop-shadow(0 0 30px ${themeAccentColor})`
                  : 'none',
              }}
            >
              {symbol}
              {isHighlighted && (
                <div 
                  className="absolute inset-0 rounded-lg animate-ping opacity-30"
                  style={{ backgroundColor: themeAccentColor }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div 
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 opacity-60 z-20"
        style={{ 
          backgroundColor: themeAccentColor,
          boxShadow: `0 0 10px ${themeAccentColor}`,
        }}
      />
      
      <div className="absolute inset-0 pointer-events-none z-30 bg-gradient-to-b from-black/70 via-transparent to-black/70" />
      
      <div 
        className="absolute inset-0 border-2 rounded-xl z-40 pointer-events-none"
        style={{ borderColor: `${themeAccentColor}30` }}
      />

      <style>{`
        @keyframes spin-reel-${index} {
          0% { transform: translateY(0); }
          100% { transform: translateY(-120px); }
        }
      `}</style>
    </div>
  );
});

Reel.displayName = 'Reel';
