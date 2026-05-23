import React, { useEffect, useState } from 'react';
import { Crown } from 'lucide-react';

interface JackpotDisplayProps {
  amount: number;
  isWinning?: boolean;
}

export const JackpotDisplay: React.FC<JackpotDisplayProps> = React.memo(({
  amount,
  isWinning = false,
}) => {
  const [displayAmount, setDisplayAmount] = useState(amount);

  useEffect(() => {
    if (displayAmount !== amount) {
      const start = displayAmount;
      const end = amount;
      const duration = 1000;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * easeProgress);
        setDisplayAmount(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [amount, displayAmount]);

  return (
    <div className={`
      relative bg-gradient-to-r from-purple-900/50 via-yellow-900/50 to-purple-900/50
      border-2 border-yellow-500 rounded-xl p-3 sm:p-4
      ${isWinning ? 'animate-jackpot-pulse shadow-[0_0_40px_rgba(255,215,0,0.8)]' : ''}
    `}>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/5 via-transparent to-yellow-500/5 animate-shimmer" />
      
      <div className="relative flex items-center justify-center gap-3">
        <div className={`relative ${isWinning ? 'animate-bounce' : ''}`}>
          <Crown className={`w-8 h-8 sm:w-10 sm:h-10 ${isWinning ? 'text-yellow-300' : 'text-yellow-500'}`} />
          {isWinning && (
            <div className="absolute inset-0 animate-ping">
              <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-300 opacity-50" />
            </div>
          )}
        </div>
        
        <div className="text-center">
          <p className="text-gray-400 text-xs sm:text-sm uppercase tracking-wider">
            累计奖池
          </p>
          <p className={`
            font-digital text-2xl sm:text-3xl font-bold
            ${isWinning ? 'text-yellow-300 animate-pulse' : 'text-yellow-400'}
          `}>
            💰 {displayAmount.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="absolute -top-1 -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
      <div className="absolute -top-1 -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent rotate-180" />
    </div>
  );
});

JackpotDisplay.displayName = 'JackpotDisplay';
