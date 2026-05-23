export type SymbolType = 
  | '🍒' | '🍋' | '🍊' | '🍇' | '🍉' | '⭐' | '💎' | '7️⃣'
  | '🃏' | '🎯' | '🎁'
  | '🏛️' | '👑' | '🐪' | '💀' | '⚱️'
  | '🏴‍☠️' | '🦜' | '🗺️' | '⚓' | '💰';

export type SpecialSymbolType = '🃏' | '🎯' | '🎁';
export type ThemeType = 'classic' | 'egypt' | 'pirate';

export interface Payline {
  id: number;
  name: string;
  pattern: [number, number][];
  multiplier: number;
}

export interface WinCombination {
  symbols: SymbolType[] | SymbolType;
  multiplier: number;
  name: string;
  isThreeMatch?: boolean;
  minCount?: number;
}

export interface WinResult {
  combination: SymbolType[];
  multiplier: number;
  winAmount: number;
  name: string;
  paylineId: number;
  positions: [number, number][];
}

export interface WinInfo {
  totalWin: number;
  wins: WinResult[];
  hasWild: boolean;
  hasScatter: boolean;
  hasBonus: boolean;
  scatterCount: number;
  bonusCount: number;
  freeSpinsWon: number;
  jackpotWon: boolean;
  jackpotAmount: number;
}

export interface GameState {
  balance: number;
  currentBet: number;
  betPerLine: number;
  activePaylines: number[];
  betOptions: number[];
  lastWin: number;
  isSpinning: boolean;
  reels: SymbolType[][];
  reelStates: boolean[];
  winInfo: WinInfo | null;
  showWinModal: boolean;
  freeSpinsRemaining: number;
  isFreeSpinsActive: boolean;
  showFreeSpinsModal: boolean;
  showBonusGame: boolean;
  bonusMultiplier: number;
  showRiskGame: boolean;
  riskCurrentAmount: number;
  autoSpinsRemaining: number;
  isAutoSpinActive: boolean;
  jackpotAmount: number;
  currentTheme: ThemeType;
  showThemeSwitcher: boolean;
  highlightedPositions: Set<string>;
  showParticles: boolean;
}

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  symbols: SymbolType[];
  background: string;
  accentColor: string;
  secondaryColor: string;
  borderColor: string;
  glowColor: string;
}

export interface FreeSpinsConfig {
  count: number;
  multiplier: number;
  requiredScatters: number;
}

export interface BonusGameState {
  revealed: boolean[];
  prizes: number[];
  totalPrize: number;
  picksRemaining: number;
}

export interface RiskGameState {
  currentAmount: number;
  targetAmount: number;
  result: 'win' | 'lose' | null;
  choice: 'high' | 'low' | null;
  cardValue: number | null;
}
