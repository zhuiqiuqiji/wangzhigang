export type TestMode = 'visual' | 'audio' | 'choice' | 'inhibition';

export type RatingLevel = '闪电' | '极快' | '正常' | '偏慢';

export interface RatingResult {
    level: RatingLevel;
    icon: string;
    color: string;
}

export type AgeGroup = 'teen' | 'young' | 'adult' | 'senior';

export interface User {
    id: number;
    email: string;
    nickname: string;
    region: string;
    ageGroup: AgeGroup;
    createdAt: string;
}

export interface TestRoundResult {
    round: number;
    reactionTime: number | null;
    isFoul: boolean;
    stimulusDetail?: string;
}

export interface TestSession {
    sessionId: string;
    mode: TestMode;
    rounds: TestRoundResult[];
    average: number | null;
    rating: RatingResult | null;
    createdAt: string;
}

export interface LeaderboardEntry {
    rank: number;
    userId: number;
    nickname: string;
    region: string;
    ageGroup: AgeGroup;
    averageTime: number;
    rating: RatingResult;
    testCount: number;
}

export interface TrainingStatus {
    mode: TestMode;
    currentLevel: number;
    bestTime: number | null;
    achievements: string[];
}

export interface StatsData {
    distribution: { bucket: string; count: number }[];
    trend: { date: string; average: number }[];
    percentile: number;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export const MODE_CONFIG: Record<TestMode, {
    name: string;
    description: string;
    icon: string;
    color: string;
    bgColor: string;
}> = {
    visual: {
        name: '视觉反应',
        description: '屏幕变色后尽快点击',
        icon: '👁️',
        color: '#22c55e',
        bgColor: 'from-red-600 to-green-500',
    },
    audio: {
        name: '听觉反应',
        description: '听到声音后尽快点击',
        icon: '👂',
        color: '#06b6d4',
        bgColor: 'from-indigo-600 to-cyan-500',
    },
    choice: {
        name: '选择反应',
        description: '匹配颜色后点击对应按钮',
        icon: '🎯',
        color: '#a855f7',
        bgColor: 'from-purple-600 to-pink-500',
    },
    inhibition: {
        name: '抑制反应',
        description: 'Go信号点击，No-Go信号抑制',
        icon: '🛑',
        color: '#f59e0b',
        bgColor: 'from-green-600 to-red-500',
    },
};

export const RATING_META: Record<RatingLevel, { icon: string; color: string }> = {
    '闪电': { icon: '⚡', color: '#facc15' },
    '极快': { icon: '🔥', color: '#22c55e' },
    '正常': { icon: '👍', color: '#3b82f6' },
    '偏慢': { icon: '🐢', color: '#ef4444' },
};

export const RATING_THRESHOLDS: Record<TestMode, { lightning: number; fast: number; normal: number }> = {
    visual: { lightning: 200, fast: 300, normal: 500 },
    audio: { lightning: 180, fast: 280, normal: 450 },
    choice: { lightning: 350, fast: 500, normal: 700 },
    inhibition: { lightning: 400, fast: 600, normal: 850 },
};

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
    teen: '13-17岁',
    young: '18-25岁',
    adult: '26-45岁',
    senior: '46岁以上',
};

export const REGION_OPTIONS = [
    '中国', '日本', '韩国', '美国', '英国', '德国', '法国', '巴西', '澳大利亚', '其他',
];
