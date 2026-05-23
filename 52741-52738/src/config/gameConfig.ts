import type { 
  SymbolType, 
  WinCombination, 
  WinInfo, 
  WinResult, 
  Payline,
  ThemeType,
  ThemeConfig,
  FreeSpinsConfig,
  BonusGameState
} from '@/types/game';

export const REEL_COUNT = 5;
export const ROW_COUNT = 3;
export const MAX_PAYLINES = 5;

export const WILD_SYMBOL: SymbolType = '🃏';
export const SCATTER_SYMBOL: SymbolType = '🎯';
export const BONUS_SYMBOL: SymbolType = '🎁';

export const CLASSIC_SYMBOLS: SymbolType[] = ['🍒', '🍋', '🍊', '🍇', '🍉', '⭐', '💎', '7️⃣'];
export const EGYPT_SYMBOLS: SymbolType[] = ['🏛️', '👑', '🐪', '💀', '⚱️', '⭐', '💎', '7️⃣'];
export const PIRATE_SYMBOLS: SymbolType[] = ['🏴‍☠️', '🦜', '🗺️', '⚓', '💰', '⭐', '💎', '7️⃣'];

export const SPECIAL_SYMBOLS: SymbolType[] = [WILD_SYMBOL, SCATTER_SYMBOL, BONUS_SYMBOL];

export const THEMES: Record<ThemeType, ThemeConfig> = {
  classic: {
    id: 'classic',
    name: '经典水果',
    symbols: CLASSIC_SYMBOLS,
    background: 'radial-gradient(ellipse at center, #1a0a0a 0%, #0d0505 50%, #000000 100%)',
    accentColor: '#FFD700',
    secondaryColor: '#FF00FF',
    borderColor: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.5)',
  },
  egypt: {
    id: 'egypt',
    name: '埃及宝藏',
    symbols: EGYPT_SYMBOLS,
    background: 'radial-gradient(ellipse at center, #2a1f0a 0%, #1a1405 50%, #0d0a00 100%)',
    accentColor: '#FFD700',
    secondaryColor: '#00CED1',
    borderColor: '#DAA520',
    glowColor: 'rgba(218, 165, 32, 0.5)',
  },
  pirate: {
    id: 'pirate',
    name: '海盗主题',
    symbols: PIRATE_SYMBOLS,
    background: 'radial-gradient(ellipse at center, #0a1a2a 0%, #050d1a 50%, #000a0d 100%)',
    accentColor: '#FF6B35',
    secondaryColor: '#00CED1',
    borderColor: '#8B4513',
    glowColor: 'rgba(255, 107, 53, 0.5)',
  },
};

export const getThemeSymbols = (theme: ThemeType): SymbolType[] => {
  return [...THEMES[theme].symbols, ...SPECIAL_SYMBOLS];
};

export const getSymbolWeight = (symbol: SymbolType, theme: ThemeType): number => {
  const baseWeights: Record<string, number> = {
    '🍒': 20, '🍋': 20, '🍊': 18, '🍇': 15, '🍉': 12, '⭐': 8, '💎': 5, '7️⃣': 2,
    '🏛️': 20, '👑': 18, '🐪': 16, '💀': 12, '⚱️': 10,
    '🏴‍☠️': 20, '🦜': 18, '🗺️': 16, '⚓': 12, '💰': 10,
    '🃏': 3, '🎯': 4, '🎁': 3,
  };
  return baseWeights[symbol] || 10;
};

export const PAYLINES: Payline[] = [
  {
    id: 0,
    name: '中线',
    pattern: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]],
    multiplier: 1,
  },
  {
    id: 1,
    name: '上线',
    pattern: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
    multiplier: 1,
  },
  {
    id: 2,
    name: '下线',
    pattern: [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]],
    multiplier: 1,
  },
  {
    id: 3,
    name: 'V形线',
    pattern: [[0, 0], [1, 1], [2, 2], [3, 1], [4, 0]],
    multiplier: 1.5,
  },
  {
    id: 4,
    name: '倒V形线',
    pattern: [[0, 2], [1, 1], [2, 0], [3, 1], [4, 2]],
    multiplier: 1.5,
  },
];

export const WIN_COMBINATIONS: WinCombination[] = [
  { symbols: '7️⃣', multiplier: 100, name: '幸运七大奖', minCount: 5 },
  { symbols: '💎', multiplier: 50, name: '钻石大奖', minCount: 5 },
  { symbols: '⭐', multiplier: 25, name: '星星奖', minCount: 5 },
  { symbols: '🍒', multiplier: 15, name: '樱桃奖', minCount: 3 },
  { symbols: '🍇', multiplier: 10, name: '葡萄奖', minCount: 3 },
  { symbols: '🍊', multiplier: 8, name: '橙子奖', minCount: 3 },
  { symbols: '🍋', multiplier: 5, name: '柠檬奖', minCount: 3 },
  { symbols: '🍉', multiplier: 5, name: '西瓜奖', minCount: 3 },
  { symbols: '🏛️', multiplier: 15, name: '神殿奖', minCount: 3 },
  { symbols: '👑', multiplier: 12, name: '法老王奖', minCount: 3 },
  { symbols: '🐪', multiplier: 8, name: '骆驼奖', minCount: 3 },
  { symbols: '⚱️', multiplier: 6, name: '宝藏奖', minCount: 3 },
  { symbols: '🏴‍☠️', multiplier: 15, name: '海盗旗奖', minCount: 3 },
  { symbols: '🦜', multiplier: 12, name: '鹦鹉奖', minCount: 3 },
  { symbols: '🗺️', multiplier: 8, name: '藏宝图奖', minCount: 3 },
  { symbols: '⚓', multiplier: 6, name: '船锚奖', minCount: 3 },
];

export const WILD_MULTIPLIER = 2;

export const FREE_SPINS_CONFIG: FreeSpinsConfig[] = [
  { count: 10, multiplier: 2, requiredScatters: 3 },
  { count: 15, multiplier: 3, requiredScatters: 4 },
  { count: 25, multiplier: 5, requiredScatters: 5 },
];

export const BONUS_GAME_CONFIG = {
  picks: 3,
  boxes: 6,
  minPrize: 5,
  maxPrize: 50,
};

export const JACKPOT_CONFIG = {
  contributionRate: 0.02,
  triggerMultiplier: 500,
  requiredSymbols: 5,
  symbol: '7️⃣',
};

export const TWO_MATCH_MULTIPLIER = 2;
export const TWO_MATCH_NAME = '小奖';

export const BET_OPTIONS: number[] = [10, 25, 50, 100, 250, 500];
export const PAYLINE_OPTIONS: number[] = [1, 2, 3, 4, 5];

export const INITIAL_BALANCE = 1000;
export const INITIAL_JACKPOT = 10000;

export const REEL_SYMBOL_COUNT = 20;

export const SPIN_DURATION = {
  min: 800,
  max: 2000,
  delay: 300,
};

export const STORAGE_KEY_BALANCE = 'slot-machine-balance';
export const STORAGE_KEY_JACKPOT = 'slot-machine-jackpot';
export const STORAGE_KEY_THEME = 'slot-machine-theme';

export function getRandomSymbol(theme: ThemeType = 'classic'): SymbolType {
  const symbols = getThemeSymbols(theme);
  const totalWeight = symbols.reduce((sum, s) => sum + getSymbolWeight(s, theme), 0);
  let random = Math.random() * totalWeight;
  
  for (const symbol of symbols) {
    random -= getSymbolWeight(symbol, theme);
    if (random <= 0) {
      return symbol;
    }
  }
  
  return symbols[0];
}

export function generateReelSymbols(theme: ThemeType = 'classic'): SymbolType[] {
  return Array.from({ length: REEL_SYMBOL_COUNT }, () => getRandomSymbol(theme));
}

export function generateAllReels(theme: ThemeType = 'classic'): SymbolType[][] {
  return Array.from({ length: REEL_COUNT }, () => generateReelSymbols(theme));
}

export function getVisibleSymbols(reels: SymbolType[][]): SymbolType[][] {
  return reels.map(reel => {
    const middleIndex = Math.floor(reel.length / 2);
    return [
      reel[middleIndex - 1],
      reel[middleIndex],
      reel[middleIndex + 1],
    ];
  });
}

export function countSymbolInReels(visible: SymbolType[][], symbol: SymbolType): number {
  let count = 0;
  for (let col = 0; col < visible.length; col++) {
    for (let row = 0; row < visible[col].length; row++) {
      if (visible[col][row] === symbol) {
        count++;
      }
    }
  }
  return count;
}

export function checkPayline(
  visible: SymbolType[][],
  payline: Payline,
  theme: ThemeType
): WinResult | null {
  const symbols: SymbolType[] = [];
  const positions: [number, number][] = [];

  for (const [col, row] of payline.pattern) {
    if (col < visible.length && row < visible[col].length) {
      symbols.push(visible[col][row]);
      positions.push([col, row]);
    }
  }

  if (symbols.length < 3) return null;

  let baseSymbol: SymbolType | null = null;
  let hasWild = false;

  for (const symbol of symbols) {
    if (symbol === WILD_SYMBOL) {
      hasWild = true;
    } else if (baseSymbol === null) {
      baseSymbol = symbol;
    } else if (symbol !== baseSymbol) {
      return null;
    }
  }

  if (baseSymbol === null) {
    baseSymbol = WILD_SYMBOL;
  }

  const matchCount = symbols.filter(s => s === baseSymbol || s === WILD_SYMBOL).length;
  const wildCount = symbols.filter(s => s === WILD_SYMBOL).length;

  for (const combo of WIN_COMBINATIONS) {
    if (typeof combo.symbols === 'string' && combo.symbols === baseSymbol) {
      const minCount = combo.minCount || 3;
      if (matchCount >= minCount) {
        let multiplier = combo.multiplier;
        if (hasWild && wildCount > 0) {
          multiplier *= WILD_MULTIPLIER;
        }
        multiplier *= payline.multiplier;

        return {
          combination: symbols,
          multiplier,
          winAmount: 0,
          name: combo.name,
          paylineId: payline.id,
          positions,
        };
      }
    }
  }

  if (matchCount >= 2) {
    return {
      combination: symbols,
      multiplier: TWO_MATCH_MULTIPLIER * payline.multiplier,
      winAmount: 0,
      name: TWO_MATCH_NAME,
      paylineId: payline.id,
      positions,
    };
  }

  return null;
}

export function checkWin(
  reels: SymbolType[][],
  betPerLine: number,
  activePaylines: number[],
  theme: ThemeType
): WinInfo {
  const visible = getVisibleSymbols(reels);
  
  const wins: WinResult[] = [];
  let totalWin = 0;
  let hasWild = false;
  let hasScatter = false;
  let hasBonus = false;
  let freeSpinsWon = 0;
  let jackpotWon = false;
  let jackpotAmount = 0;

  for (const paylineId of activePaylines) {
    const payline = PAYLINES[paylineId];
    if (payline) {
      const result = checkPayline(visible, payline, theme);
      if (result) {
        result.winAmount = betPerLine * result.multiplier;
        totalWin += result.winAmount;
        wins.push(result);
        
        if (result.combination.includes(WILD_SYMBOL)) {
          hasWild = true;
        }
      }
    }
  }

  const scatterCount = countSymbolInReels(visible, SCATTER_SYMBOL);
  const bonusCount = countSymbolInReels(visible, BONUS_SYMBOL);
  const jackpotSymbolCount = countSymbolInReels(visible, JACKPOT_CONFIG.symbol as SymbolType);

  if (scatterCount >= 3) {
    hasScatter = true;
    const sortedConfigs = [...FREE_SPINS_CONFIG].sort((a, b) => b.requiredScatters - a.requiredScatters);
    const freeSpinConfig = sortedConfigs.find(c => scatterCount >= c.requiredScatters) || FREE_SPINS_CONFIG[0];
    freeSpinsWon = freeSpinConfig.count;
    totalWin += betPerLine * activePaylines.length * freeSpinConfig.multiplier;
  }

  if (bonusCount >= 3) {
    hasBonus = true;
  }

  if (jackpotSymbolCount >= JACKPOT_CONFIG.requiredSymbols) {
    jackpotWon = true;
  }

  return {
    totalWin,
    wins,
    hasWild,
    hasScatter,
    hasBonus,
    scatterCount,
    bonusCount,
    freeSpinsWon,
    jackpotWon,
    jackpotAmount,
  };
}

export function generateBonusGame(): BonusGameState {
  const prizes: number[] = [];
  for (let i = 0; i < BONUS_GAME_CONFIG.boxes; i++) {
    const prize = Math.floor(Math.random() * (BONUS_GAME_CONFIG.maxPrize - BONUS_GAME_CONFIG.minPrize + 1)) + BONUS_GAME_CONFIG.minPrize;
    prizes.push(prize);
  }
  
  return {
    revealed: new Array(BONUS_GAME_CONFIG.boxes).fill(false),
    prizes,
    totalPrize: 0,
    picksRemaining: BONUS_GAME_CONFIG.picks,
  };
}
