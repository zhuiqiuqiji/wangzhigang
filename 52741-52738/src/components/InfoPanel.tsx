import React, { useEffect, useState, useRef } from 'react';
import { Coins, Trophy } from 'lucide-react';

interface InfoPanelProps {
  balance: number;
  lastWin: number;
  insufficientFunds: boolean;
}

export const InfoPanel: React.FC<InfoPanelProps> = React.memo(({ balance, lastWin, insufficientFunds }) => {
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [animateBalance, setAnimateBalance] = useState(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (displayBalance !== balance) {
      setAnimateBalance(true);
      const start = displayBalance;
      const end = balance;
      const duration = 500;
      const startTime = Date.now();

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * easeProgress);
        setDisplayBalance(current);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setAnimateBalance(false);
          animationRef.current = null;
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [balance]);

  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      <div className="flex justify-between items-center gap-4">
        <div
          className={`flex-1 bg-gradient-to-r from-casino-darker to-casino-dark border-2 border-casino-gold rounded-xl p-4 shadow-lg ${
            insufficientFunds ? 'animate-shake border-red-500' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-casino-gold/20 flex items-center justify-center">
              <Coins className="w-6 h-6 text-casino-gold" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">金币余额</p>
              <p
                className={`font-digital text-2xl sm:text-3xl text-casino-gold ${
                  animateBalance ? 'animate-coin-pop' : ''
                }`}
              >
                {displayBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-gradient-to-r from-casino-dark to-casino-darker border-2 border-casino-gold rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-3 justify-end">
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider">最近赢取</p>
              <p
                className={`font-digital text-2xl sm:text-3xl ${
                  lastWin > 0 ? 'text-casino-neonGreen animate-coin-pop' : 'text-gray-500'
                }`}
              >
                {lastWin > 0 ? `+${lastWin.toLocaleString()}` : '0'}
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                lastWin > 0 ? 'bg-casino-neonGreen/20' : 'bg-gray-800'
              }`}
            >
              <Trophy
                className={`w-6 h-6 ${lastWin > 0 ? 'text-casino-neonGreen' : 'text-gray-600'}`}
              />
            </div>
          </div>
        </div>
      </div>

      {insufficientFunds && (
        <div className="mt-3 text-center">
          <p className="text-red-400 text-sm font-medium animate-pulse">
            ⚠️ 金币余额不足，请降低下注金额！
          </p>
        </div>
      )}
    </div>
  );
});

InfoPanel.displayName = 'InfoPanel';
