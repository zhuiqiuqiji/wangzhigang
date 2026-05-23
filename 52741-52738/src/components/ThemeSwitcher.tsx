import React from 'react';
import { X, Palette } from 'lucide-react';
import { THEMES } from '@/config/gameConfig';
import type { ThemeType } from '@/types/game';
import { cn } from '@/lib/utils';

interface ThemeSwitcherProps {
  isOpen: boolean;
  currentTheme: ThemeType;
  onClose: () => void;
  onChangeTheme: (theme: ThemeType) => void;
}

const THEME_ICONS: Record<ThemeType, string> = {
  classic: '🍒',
  egypt: '🏛️',
  pirate: '🏴‍☠️',
};

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = React.memo(({
  isOpen,
  currentTheme,
  onClose,
  onChangeTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-gradient-to-b from-gray-800 via-gray-900 to-black border-4 border-casino-gold rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_60px_rgba(255,215,0,0.3)]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Palette className="w-12 h-12 text-casino-gold" />
          </div>
          <h2 className="font-display text-3xl text-casino-gold mb-2">
            🎨 选择主题
          </h2>
          <p className="text-gray-400 text-sm">
            切换不同的游戏主题体验
          </p>
        </div>

        <div className="space-y-3">
          {(Object.keys(THEMES) as ThemeType[]).map((themeId) => {
            const theme = THEMES[themeId];
            const isActive = currentTheme === themeId;

            return (
              <button
                key={themeId}
                onClick={() => onChangeTheme(themeId)}
                className={cn(
                  'w-full p-4 rounded-xl border-2 transition-all duration-300 transform',
                  'flex items-center gap-4 text-left',
                  isActive
                    ? 'bg-gradient-to-r from-casino-gold/20 to-yellow-500/20 border-casino-gold scale-105 shadow-[0_0_20px_rgba(255,215,0,0.3)]'
                    : 'bg-gray-800/50 border-gray-700 hover:border-gray-500 hover:bg-gray-700/50 hover:scale-102'
                )}
              >
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl"
                  style={{
                    background: theme.background,
                    border: `2px solid ${theme.borderColor}`,
                  }}
                >
                  {THEME_ICONS[themeId]}
                </div>
                <div className="flex-1">
                  <p className={cn(
                    'font-bold text-lg',
                    isActive ? 'text-casino-gold' : 'text-white'
                  )}>
                    {theme.name}
                  </p>
                  <div className="flex gap-1 mt-1">
                    {theme.symbols.slice(0, 5).map((sym, idx) => (
                      <span key={idx} className="text-lg">{sym}</span>
                    ))}
                  </div>
                </div>
                {isActive && (
                  <div className="text-casino-gold text-2xl">✓</div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-gray-800/30 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs text-center">
            💡 不同主题有不同的图标和背景，快去体验吧！
          </p>
        </div>
      </div>
    </div>
  );
});

ThemeSwitcher.displayName = 'ThemeSwitcher';
