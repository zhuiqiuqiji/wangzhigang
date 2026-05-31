const CONFIG = {
    INITIAL_LIVES: 3,
    INITIAL_FALL_SPEED: 3,
    MIN_FALL_SPEED: 0.8,
    INITIAL_SPAWN_INTERVAL: 1500,
    MIN_SPAWN_INTERVAL: 400,
    SCORE_PER_LETTER: 10,
    SCORE_PER_WORD: 5,
    SCORE_PER_SENTENCE: 2,
    DIFFICULTY_INCREASE_INTERVAL: 30000,
    DIFFICULTY_FALL_SPEED_DECREASE: 0.3,
    DIFFICULTY_SPAWN_INTERVAL_DECREASE: 150,
    MAX_ITEMS_ON_SCREEN: 15,
    LETTER_COLORS: ['purple', 'cyan', 'pink', 'yellow', 'blue'],
    ALPHABET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    STAR_COUNT: 100,
    DESTROY_ANIMATION: {
        SCALE_UP: 1.5,
        SCALE_DOWN: 0,
        MID_OPACITY: 0.8,
        MID_POINT_DELAY: 150,
        TOTAL_DURATION: 300,
        EASING: 'ease-out'
    },
    PARTICLE_COUNT: 12,
    PARTICLE_DISTANCE_MIN: 50,
    PARTICLE_DISTANCE_MAX: 80,
    PARTICLE_DURATION: 600,
    SCORE_POPUP_DURATION: 800,
    DANGER_FLASH_DURATION: 300,
    MAX_ELAPSED_TIME: 3600000,
    FRAME_DURATION_APPROX: 16,
    GAME_MODES: {
        letter: { name: '字母模式', difficulty: 1, speedMultiplier: 1 },
        word: { name: '单词模式', difficulty: 2, speedMultiplier: 1.2 },
        sentence: { name: '短句模式', difficulty: 3, speedMultiplier: 1.4 },
        code: { name: '代码模式', difficulty: 4, speedMultiplier: 1.3 }
    },
    DEFAULT_MODE: 'letter',
    LANGUAGES: {
        en: { name: 'English', flag: '🇺🇸' },
        zh: { name: '中文拼音', flag: '🇨🇳' },
        ja: { name: '日本語ローマ字', flag: '🇯🇵' },
        fr: { name: 'Français', flag: '🇫🇷' }
    },
    DEFAULT_LANGUAGE: 'en',
    COMBO_TIERS: [
        { threshold: 0, multiplier: 1, name: '普通', icon: '', effect: null, class: '' },
        { threshold: 10, multiplier: 1.5, name: '火热', icon: '🔥', effect: 'heat', class: 'tier-1' },
        { threshold: 25, multiplier: 2, name: '闪电', icon: '⚡', effect: 'lightning', class: 'tier-2' },
        { threshold: 50, multiplier: 3, name: '暴击', icon: '💥', effect: 'critical', class: 'tier-3' },
        { threshold: 100, multiplier: 5, name: '传奇', icon: '👑', effect: 'legendary', class: 'tier-4' }
    ],
    BOSS_SPAWN_INTERVAL: 60000,
    BOSS_HP_MULTIPLIER: 3,
    BOSS_FALL_SPEED_MULTIPLIER: 0.6,
    BOSS_REWARD_SCORE: 500,
    BOSS_REWARD_LIFE_CHANCE: 0.3,
    LEADERBOARD_MAX_ENTRIES: 10,
    DEFAULT_THEME: 'cyberpunk',
    DAILY_CHALLENGE_TARGET_SCORE: 1000
};

const THEMES = {
    cyberpunk: {
        name: '赛博霓虹',
        bgPrimary: '#0a0e27',
        bgSecondary: '#1a1f3a',
        accentColor: '#00f5d4',
        borderColor: '#7b2cbf',
        textPrimary: '#ffffff',
        textSecondary: '#a0aec0',
        letterColors: ['#7b2cbf', '#00f5d4', '#ff006e', '#fee440', '#00bbf9']
    },
    minimal: {
        name: '极简黑白',
        bgPrimary: '#ffffff',
        bgSecondary: '#f5f5f5',
        accentColor: '#000000',
        borderColor: '#333333',
        textPrimary: '#000000',
        textSecondary: '#666666',
        letterColors: ['#000000', '#333333', '#666666', '#999999', '#cccccc']
    },
    pixel: {
        name: '复古像素',
        bgPrimary: '#1a1a2e',
        bgSecondary: '#16213e',
        accentColor: '#e94560',
        borderColor: '#e94560',
        textPrimary: '#ffffff',
        textSecondary: '#a0aec0',
        letterColors: ['#e94560', '#0f3460', '#533483', '#ffd460', '#00ff88']
    },
    forest: {
        name: '森林绿意',
        bgPrimary: '#1b4332',
        bgSecondary: '#2d6a4f',
        accentColor: '#52b788',
        borderColor: '#40916c',
        textPrimary: '#ffffff',
        textSecondary: '#a0aec0',
        letterColors: ['#52b788', '#95d5b2', '#74c69d', '#b7e4c7', '#95e1a1']
    },
    ocean: {
        name: '深海幽蓝',
        bgPrimary: '#03045e',
        bgSecondary: '#023e8a',
        accentColor: '#00b4d8',
        borderColor: '#0077b6',
        textPrimary: '#ffffff',
        textSecondary: '#a0aec0',
        letterColors: ['#0077b6', '#00b4d8', '#90e0ef', '#48cae4', '#0096c7']
    },
    sunset: {
        name: '落日橙红',
        bgPrimary: '#3d0066',
        bgSecondary: '#5c0099',
        accentColor: '#ff6b35',
        borderColor: '#d62828',
        textPrimary: '#ffffff',
        textSecondary: '#a0aec0',
        letterColors: ['#ff6b35', '#f7c59f', '#efa94a', '#d62828', '#f77f00']
    }
};

const STORAGE_KEYS = {
    LEADERBOARD: 'wordstorm_leaderboard_v2',
    CUSTOM_WORDS: 'wordstorm_custom_words_v2',
    SETTINGS: 'wordstorm_settings_v2',
    DAILY_PROGRESS: 'wordstorm_daily_progress_v2',
    ACHIEVEMENTS: 'wordstorm_achievements_v2'
};

const ACHIEVEMENTS = [
    { id: 'first_win', name: '初次胜利', icon: '🎯', condition: (stats) => stats.score > 0 },
    { id: 'combo_10', name: '连击达人', icon: '🔥', condition: (stats) => stats.maxCombo >= 10 },
    { id: 'combo_25', name: '闪电手速', icon: '⚡', condition: (stats) => stats.maxCombo >= 25 },
    { id: 'combo_50', name: '暴击之王', icon: '💥', condition: (stats) => stats.maxCombo >= 50 },
    { id: 'combo_100', name: '传奇玩家', icon: '👑', condition: (stats) => stats.maxCombo >= 100 },
    { id: 'speed_50', name: '速度新星', icon: '🚀', condition: (stats) => stats.wpm >= 50 },
    { id: 'speed_100', name: '速度之王', icon: '💨', condition: (stats) => stats.wpm >= 100 },
    { id: 'score_1000', name: '千分俱乐部', icon: '🏅', condition: (stats) => stats.score >= 1000 },
    { id: 'score_5000', name: '五千精英', icon: '🏆', condition: (stats) => stats.score >= 5000 },
    { id: 'boss_killer', name: 'Boss猎人', icon: '👹', condition: (stats) => stats.bossesDefeated >= 1 },
    { id: 'survivor', name: '生存专家', icon: '💪', condition: (stats) => stats.duration >= 120 },
    { id: 'accuracy_95', name: '精准射手', icon: '🎯', condition: (stats) => stats.accuracy >= 95 }
];

const gameState = {
    isPlaying: false,
    score: 0,
    lives: CONFIG.INITIAL_LIVES,
    level: 1,
    items: [],
    totalTyped: 0,
    totalKeystrokes: 0,
    startTime: null,
    gameStartTime: 0,
    fallSpeed: CONFIG.INITIAL_FALL_SPEED,
    spawnInterval: CONFIG.INITIAL_SPAWN_INTERVAL,
    combo: 0,
    maxCombo: 0,
    comboTier: 0,
    comboMultiplier: 1,
    lastSpawnTime: 0,
    lastDifficultyIncrease: 0,
    lastBossSpawn: 0,
    bossesDefeated: 0,
    animationId: null,
    gameMode: CONFIG.DEFAULT_MODE,
    language: CONFIG.DEFAULT_LANGUAGE,
    theme: CONFIG.DEFAULT_THEME,
    currentBoss: null,
    isDailyChallenge: false,
    dailyTheme: null,
    customWordList: [],
    accuracy: 100
};

const elements = {};

function initElements() {
    elements.starsContainer = document.getElementById('stars-container');
    elements.lettersContainer = document.getElementById('letters-container');
    elements.particlesContainer = document.getElementById('particles-container');
    elements.scorePopupsContainer = document.getElementById('score-popups-container');
    elements.dangerFlash = document.getElementById('danger-flash');
    elements.criticalEffect = document.getElementById('critical-effect');
    elements.startPanel = document.getElementById('start-panel');
    elements.gameOverPanel = document.getElementById('game-over-panel');
    elements.leaderboardPanel = document.getElementById('leaderboard-panel');
    elements.startBtn = document.getElementById('start-btn');
    elements.restartBtn = document.getElementById('restart-btn');
    elements.menuBtn = document.getElementById('menu-btn');
    elements.leaderboardBtn = document.getElementById('leaderboard-btn');
    elements.dailyChallengeBtn = document.getElementById('daily-challenge-btn');
    elements.importBtn = document.getElementById('import-btn');
    elements.closeLeaderboardBtn = document.getElementById('close-leaderboard');
    elements.fileImport = document.getElementById('file-import');
    elements.scoreDisplay = document.getElementById('score');
    elements.livesDisplay = document.getElementById('lives');
    elements.comboDisplay = document.getElementById('combo');
    elements.wpmDisplay = document.getElementById('wpm');
    elements.accuracyDisplay = document.getElementById('accuracy');
    elements.finalScore = document.getElementById('final-score');
    elements.finalCombo = document.getElementById('final-combo');
    elements.finalWpm = document.getElementById('final-wpm');
    elements.finalAccuracy = document.getElementById('final-accuracy');
    elements.finalMode = document.getElementById('final-mode');
    elements.finalTime = document.getElementById('final-time');
    elements.finalRank = document.getElementById('final-rank');
    elements.achievementBadges = document.getElementById('achievement-badges');
    elements.keyboardHint = document.getElementById('keyboard-hint');
    elements.activeLetters = document.getElementById('active-letters');
    elements.comboIndicator = document.getElementById('combo-indicator');
    elements.comboIcon = document.getElementById('combo-icon');
    elements.comboText = document.getElementById('combo-text');
    elements.comboMultiplier = document.getElementById('combo-multiplier');
    elements.bossHealthContainer = document.getElementById('boss-health-container');
    elements.bossName = document.getElementById('boss-name');
    elements.bossHealthFill = document.getElementById('boss-health-fill');
    elements.bossHealthText = document.getElementById('boss-health-text');
    elements.modeCards = document.querySelectorAll('.mode-card');
    elements.languageSelect = document.getElementById('language-select');
    elements.themeSelect = document.getElementById('theme-select');
    elements.leaderboardTabs = document.querySelectorAll('.tab-btn');
    elements.leaderboardList = document.getElementById('leaderboard-list');
}

function sanitizeElapsedTime(elapsed) {
    if (typeof elapsed !== 'number' || isNaN(elapsed)) {
        console.warn('Invalid elapsed time, resetting to 0');
        return 0;
    }
    if (elapsed < 0) {
        console.warn('Negative elapsed time, resetting to 0');
        return 0;
    }
    if (elapsed > CONFIG.MAX_ELAPSED_TIME) {
        console.warn('Elapsed time exceeds maximum, capping to max value');
        return CONFIG.MAX_ELAPSED_TIME;
    }
    return elapsed;
}

function isElapsedValid(elapsed) {
    return typeof elapsed === 'number' && !isNaN(elapsed) && elapsed >= 0 && elapsed <= CONFIG.MAX_ELAPSED_TIME;
}

function generateUniqueId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

function getRandomLetter() {
    return CONFIG.ALPHABET[Math.floor(Math.random() * CONFIG.ALPHABET.length)];
}

function getRandomColor() {
    const theme = THEMES[gameState.theme];
    const colors = CONFIG.LETTER_COLORS;
    return colors[Math.floor(Math.random() * colors.length)];
}

function getRandomColorValue() {
    const theme = THEMES[gameState.theme];
    if (theme && theme.letterColors) {
        return theme.letterColors[Math.floor(Math.random() * theme.letterColors.length)];
    }
    const colorMap = {
        'purple': '#7b2cbf',
        'cyan': '#00f5d4',
        'pink': '#ff006e',
        'yellow': '#fee440',
        'blue': '#00bbf9'
    };
    const color = getRandomColor();
    return colorMap[color] || '#00f5d4';
}

function getRandomPosition(contentWidth) {
    const gameArea = elements.lettersContainer;
    const maxX = gameArea.clientWidth - contentWidth - 20;
    return Math.max(10, Math.random() * maxX);
}

function getContentForMode() {
    const mode = gameState.gameMode;
    const language = gameState.language;
    let content = '';
    let expectedInput = '';
    let displayContent = '';

    switch (mode) {
        case 'letter':
            content = getRandomLetter();
            expectedInput = content;
            displayContent = content;
            break;

        case 'word':
            if (language === 'zh' && window.CHINESE_WORDS) {
                const word = window.CHINESE_WORDS[Math.floor(Math.random() * window.CHINESE_WORDS.length)];
                content = word.pinyin.toUpperCase();
                expectedInput = content;
                displayContent = word.display;
            } else if (language === 'ja' && window.JAPANESE_WORDS) {
                const word = window.JAPANESE_WORDS[Math.floor(Math.random() * window.JAPANESE_WORDS.length)];
                content = word.romaji.toUpperCase();
                expectedInput = content;
                displayContent = word.display;
            } else if (language === 'fr' && window.FRENCH_WORDS) {
                content = window.FRENCH_WORDS[Math.floor(Math.random() * window.FRENCH_WORDS.length)];
                expectedInput = content.toUpperCase();
                displayContent = content;
            } else if (gameState.isDailyChallenge && gameState.dailyTheme) {
                content = gameState.dailyTheme.words[Math.floor(Math.random() * gameState.dailyTheme.words.length)];
                expectedInput = content.toUpperCase();
                displayContent = content;
            } else if (gameState.customWordList.length > 0) {
                content = gameState.customWordList[Math.floor(Math.random() * gameState.customWordList.length)];
                expectedInput = content.toUpperCase();
                displayContent = content;
            } else if (window.WORD_LISTS) {
                const difficulty = gameState.level <= 3 ? 'easy' : gameState.level <= 6 ? 'medium' : 'hard';
                const words = window.WORD_LISTS[difficulty];
                content = words[Math.floor(Math.random() * words.length)];
                expectedInput = content.toUpperCase();
                displayContent = content;
            } else {
                content = getRandomLetter();
                expectedInput = content;
                displayContent = content;
            }
            break;

        case 'sentence':
            if (window.SENTENCE_LISTS) {
                const difficulty = gameState.level <= 3 ? 'easy' : gameState.level <= 6 ? 'medium' : 'hard';
                const sentences = window.SENTENCE_LISTS[difficulty];
                content = sentences[Math.floor(Math.random() * sentences.length)];
                expectedInput = content.toUpperCase();
                displayContent = content;
            } else {
                content = getRandomLetter();
                expectedInput = content;
                displayContent = content;
            }
            break;

        case 'code':
            if (window.CODE_SNIPPETS) {
                const categories = ['keywords', 'functions', 'operators', 'patterns'];
                const category = categories[Math.floor(Math.random() * categories.length)];
                const snippets = window.CODE_SNIPPETS[category];
                content = snippets[Math.floor(Math.random() * snippets.length)];
                expectedInput = content.toUpperCase();
                displayContent = content;
            } else {
                content = getRandomLetter();
                expectedInput = content;
                displayContent = content;
            }
            break;
    }

    return { content, expectedInput, displayContent };
}

function createBossContent() {
    let content = '';
    if (window.WORD_LISTS && window.WORD_LISTS.boss) {
        content = window.WORD_LISTS.boss[Math.floor(Math.random() * window.WORD_LISTS.boss.length)];
    } else if (window.CODE_SNIPPETS && window.CODE_SNIPPETS.boss && gameState.gameMode === 'code') {
        content = window.CODE_SNIPPETS.boss[Math.floor(Math.random() * window.CODE_SNIPPETS.boss.length)];
    } else {
        const baseWords = ['electromagnetic', 'entrepreneurship', 'internationalization', 'telecommunications'];
        content = baseWords[Math.floor(Math.random() * baseWords.length)];
    }
    return {
        content: content.toUpperCase(),
        expectedInput: content.toUpperCase(),
        displayContent: content,
        hp: content.length * CONFIG.BOSS_HP_MULTIPLIER,
        maxHp: content.length * CONFIG.BOSS_HP_MULTIPLIER
    };
}

function createStars() {
    elements.starsContainer.innerHTML = '';
    for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        star.style.animationDuration = `${2 + Math.random() * 3}s`;
        const size = 1 + Math.random() * 3;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        if (gameState.theme === 'minimal') {
            star.style.background = '#666666';
        }
        elements.starsContainer.appendChild(star);
    }
}

function setTheme(themeName) {
    if (!THEMES[themeName]) {
        console.warn(`Theme ${themeName} not found, using default`);
        themeName = CONFIG.DEFAULT_THEME;
    }
    gameState.theme = themeName;
    document.body.setAttribute('data-theme', themeName);
    createStars();
    saveSettings();
}

function camelToKebab(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function applyThemeVariables() {
    const theme = THEMES[gameState.theme];
    if (!theme) return;
    Object.keys(theme).forEach(key => {
        if (key !== 'name' && key !== 'letterColors') {
            const cssVar = `--${camelToKebab(key)}`;
            document.documentElement.style.setProperty(cssVar, theme[key]);
        }
    });
}

function setGameMode(mode) {
    if (!CONFIG.GAME_MODES[mode]) {
        console.warn(`Mode ${mode} not found, using default`);
        mode = CONFIG.DEFAULT_MODE;
    }
    gameState.gameMode = mode;
    elements.modeCards.forEach(card => {
        card.classList.toggle('active', card.dataset.mode === mode);
    });
    saveSettings();
}

function setLanguage(language) {
    if (!CONFIG.LANGUAGES[language]) {
        console.warn(`Language ${language} not found, using default`);
        language = CONFIG.DEFAULT_LANGUAGE;
    }
    gameState.language = language;
    elements.languageSelect.value = language;
    saveSettings();
}

function saveScoreToLeaderboard(stats) {
    try {
        const leaderboard = getLeaderboard(gameState.gameMode);
        const entry = {
            score: stats.score,
            maxCombo: stats.maxCombo,
            wpm: stats.wpm,
            accuracy: stats.accuracy,
            duration: stats.duration,
            date: Date.now()
        };
        leaderboard.push(entry);
        leaderboard.sort((a, b) => b.score - a.score);
        const trimmed = leaderboard.slice(0, CONFIG.LEADERBOARD_MAX_ENTRIES);
        
        const allLeaderboard = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEADERBOARD) || '{}');
        allLeaderboard[gameState.gameMode] = trimmed;
        localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(allLeaderboard));
        
        const rank = trimmed.findIndex(e => e.date === entry.date) + 1;
        return rank <= CONFIG.LEADERBOARD_MAX_ENTRIES ? rank : null;
    } catch (e) {
        console.error('Failed to save score:', e);
        return null;
    }
}

function getLeaderboard(mode) {
    try {
        const allLeaderboard = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEADERBOARD) || '{}');
        return allLeaderboard[mode] || [];
    } catch (e) {
        console.error('Failed to load leaderboard:', e);
        return [];
    }
}

function renderLeaderboard(mode) {
    const leaderboard = getLeaderboard(mode);
    elements.leaderboardList.innerHTML = '';
    
    if (leaderboard.length === 0) {
        elements.leaderboardList.innerHTML = '<div class="empty-state">暂无记录，快去创造记录吧！</div>';
        return;
    }
    
    leaderboard.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = `leaderboard-item top-${index + 1}`;
        const date = new Date(entry.date);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        
        item.innerHTML = `
            <span class="rank-number">${index + 1}</span>
            <div class="rank-info">
                <span class="rank-score">${entry.score.toLocaleString()}</span>
                <span class="rank-date">${dateStr}</span>
            </div>
            <div class="rank-stats">
                <span class="rank-stat">${entry.wpm} WPM</span>
                <span class="rank-stat">${entry.accuracy}% 准确</span>
            </div>
            <div class="rank-stats">
                <span class="rank-stat">${entry.maxCombo} 连击</span>
                <span class="rank-stat">${Math.floor(entry.duration)}秒</span>
            </div>
        `;
        elements.leaderboardList.appendChild(item);
    });
}

function saveSettings() {
    try {
        const settings = {
            theme: gameState.theme,
            gameMode: gameState.gameMode,
            language: gameState.language,
            customWordList: gameState.customWordList
        };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
        console.error('Failed to save settings:', e);
    }
}

function loadSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
        if (settings.theme) setTheme(settings.theme);
        if (settings.gameMode) setGameMode(settings.gameMode);
        if (settings.language) setLanguage(settings.language);
        if (settings.customWordList) gameState.customWordList = settings.customWordList;
        
        elements.themeSelect.value = gameState.theme;
        elements.languageSelect.value = gameState.language;
    } catch (e) {
        console.error('Failed to load settings:', e);
    }
}

function getDailyChallenge() {
    const today = new Date();
    const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const themes = window.DAILY_THEMES || [
        { name: '普通日', words: ['hello', 'world', 'game', 'play', 'code'], icon: '📅' }
    ];
    const themeIndex = daySeed % themes.length;
    return themes[themeIndex];
}

function isDailyCompleted() {
    try {
        const today = new Date().toDateString();
        const progress = JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS) || '{}');
        return progress.date === today && progress.completed;
    } catch (e) {
        return false;
    }
}

function checkAchievements(stats) {
    const unlocked = [];
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS) || '[]');
    
    ACHIEVEMENTS.forEach(achievement => {
        if (!existing.includes(achievement.id) && achievement.condition(stats)) {
            unlocked.push(achievement);
            existing.push(achievement.id);
        }
    });
    
    if (unlocked.length > 0) {
        localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(existing));
    }
    
    return unlocked;
}

function renderAchievements(achievements) {
    elements.achievementBadges.innerHTML = '';
    achievements.forEach((achievement, index) => {
        const badge = document.createElement('div');
        badge.className = 'achievement-badge';
        badge.style.animationDelay = `${index * 0.2}s`;
        badge.innerHTML = `
            <span class="achievement-icon">${achievement.icon}</span>
            <span class="achievement-name">${achievement.name}</span>
        `;
        elements.achievementBadges.appendChild(badge);
    });
}

function updateComboIndicator() {
    const tier = CONFIG.COMBO_TIERS[gameState.comboTier];
    
    if (gameState.comboTier === 0) {
        elements.comboIndicator.classList.add('hidden');
        return;
    }
    
    elements.comboIndicator.classList.remove('hidden');
    elements.comboIndicator.className = `tier-${gameState.comboTier}`;
    
    elements.comboIcon.textContent = tier.icon;
    elements.comboText.textContent = tier.name;
    elements.comboMultiplier.textContent = `x${tier.multiplier.toFixed(1)}`;
}

function incrementCombo() {
    gameState.combo++;
    if (gameState.combo > gameState.maxCombo) {
        gameState.maxCombo = gameState.combo;
    }
    
    let newTier = 0;
    for (let i = CONFIG.COMBO_TIERS.length - 1; i >= 0; i--) {
        if (gameState.combo >= CONFIG.COMBO_TIERS[i].threshold) {
            newTier = i;
            break;
        }
    }
    
    if (newTier !== gameState.comboTier) {
        gameState.comboTier = newTier;
        gameState.comboMultiplier = CONFIG.COMBO_TIERS[newTier].multiplier;
        triggerTierEffect(newTier);
    }
    
    updateComboIndicator();
}

function resetCombo() {
    gameState.combo = 0;
    gameState.comboTier = 0;
    gameState.comboMultiplier = 1;
    updateComboIndicator();
}

function triggerTierEffect(tier) {
    if (tier >= 3) {
        elements.criticalEffect.classList.add('active');
        setTimeout(() => {
            elements.criticalEffect.classList.remove('active');
        }, 500);
    }
}

function calculateScore(baseScore) {
    return Math.floor(baseScore * gameState.comboMultiplier);
}

function shouldSpawnBoss(elapsed) {
    if (gameState.currentBoss) return false;
    if (gameState.gameMode === 'letter') return false;
    return elapsed - gameState.lastBossSpawn >= CONFIG.BOSS_SPAWN_INTERVAL;
}

function spawnBoss(elapsed) {
    const bossData = createBossContent();
    const color = getRandomColor();
    const contentWidth = bossData.displayContent.length * 20;
    const x = getRandomPosition(contentWidth);
    const id = generateUniqueId();

    const element = document.createElement('div');
    element.className = `falling-letter color-${color} boss ${gameState.gameMode}-mode`;
    element.dataset.id = id;
    element.dataset.char = bossData.expectedInput[0];
    
    updateFallingContentDisplay(element, bossData.displayContent, bossData.expectedInput, 0);
    
    element.style.left = `${x}px`;
    element.style.top = '-80px';
    
    elements.lettersContainer.appendChild(element);

    const initialY = -80;
    const boss = {
        id,
        type: 'boss',
        content: bossData.content,
        expectedInput: bossData.expectedInput,
        displayContent: bossData.displayContent,
        currentIndex: 0,
        x,
        y: initialY,
        initialY,
        element,
        color,
        createdAt: Date.now(),
        fallStartTime: elapsed,
        isBoss: true,
        hp: bossData.hp,
        maxHp: bossData.maxHp,
        phase: 0
    };

    gameState.items.push(boss);
    gameState.currentBoss = boss;
    gameState.lastBossSpawn = elapsed;

    elements.bossName.textContent = 'BOSS';
    updateBossHealthUI();
    elements.bossHealthContainer.classList.remove('hidden');
}

function updateBossHealthUI() {
    if (!gameState.currentBoss) {
        elements.bossHealthContainer.classList.add('hidden');
        return;
    }
    const percentage = Math.max(0, Math.min(100, (gameState.currentBoss.hp / gameState.currentBoss.maxHp) * 100));
    elements.bossHealthFill.style.width = `${percentage}%`;
    elements.bossHealthText.textContent = `${Math.round(percentage)}%`;
}

function damageBoss(amount) {
    if (!gameState.currentBoss) return;
    
    gameState.currentBoss.hp -= amount;
    updateBossHealthUI();
    
    if (gameState.currentBoss.hp <= 0) {
        defeatBoss();
    }
}

function defeatBoss() {
    if (!gameState.currentBoss) return;
    
    const boss = gameState.currentBoss;
    gameState.bossesDefeated++;
    
    const bonusScore = calculateScore(CONFIG.BOSS_REWARD_SCORE);
    gameState.score += bonusScore;
    createScorePopup(boss.x + 50, boss.y, bonusScore);
    createParticles(boss.x + 50, boss.y + 20, boss.color);
    
    if (Math.random() < CONFIG.BOSS_REWARD_LIFE_CHANCE && gameState.lives < 5) {
        gameState.lives++;
        createScorePopup(boss.x + 50, boss.y - 30, '+1 ❤');
    }
    
    removeItem(boss, true);
    gameState.currentBoss = null;
    elements.bossHealthContainer.classList.add('hidden');
}

function createItem(elapsed) {
    if (gameState.items.length >= CONFIG.MAX_ITEMS_ON_SCREEN) return;
    
    if (shouldSpawnBoss(elapsed)) {
        spawnBoss(elapsed);
        return;
    }
    
    const { content, expectedInput, displayContent } = getContentForMode();
    const color = getRandomColor();
    const contentWidth = displayContent.length * (gameState.gameMode === 'letter' ? 30 : 18);
    const x = getRandomPosition(contentWidth);
    const id = generateUniqueId();

    const element = document.createElement('div');
    element.className = `falling-letter color-${color} ${gameState.gameMode}-mode`;
    element.dataset.id = id;
    element.dataset.char = expectedInput[0];
    
    if (gameState.gameMode === 'letter') {
        element.textContent = displayContent;
    } else {
        updateFallingContentDisplay(element, displayContent, expectedInput, 0);
    }
    
    element.style.left = `${x}px`;
    element.style.top = gameState.gameMode === 'letter' ? '-60px' : '-80px';
    
    elements.lettersContainer.appendChild(element);

    const initialY = gameState.gameMode === 'letter' ? -60 : -80;
    const item = {
        id,
        type: gameState.gameMode,
        content,
        expectedInput,
        displayContent,
        currentIndex: 0,
        x,
        y: initialY,
        initialY,
        element,
        color,
        createdAt: Date.now(),
        fallStartTime: elapsed,
        isBoss: false
    };

    gameState.items.push(item);
    updateActiveLetters();
}

function updateFallingContentDisplay(element, displayContent, expectedInput, currentIndex) {
    let html = '';
    for (let i = 0; i < displayContent.length; i++) {
        let charClass = '';
        if (i < currentIndex) {
            charClass = 'char-done';
        } else if (i === currentIndex) {
            charClass = 'char-current';
        }
        html += `<span class="${charClass}">${displayContent[i]}</span>`;
    }
    element.innerHTML = html;
}

function updateItemsPosition(elapsed) {
    if (!isElapsedValid(elapsed)) return;

    const gameAreaHeight = elements.lettersContainer.clientHeight;
    const itemsToRemove = [];
    const modeConfig = CONFIG.GAME_MODES[gameState.gameMode];
    const speedMultiplier = modeConfig ? modeConfig.speedMultiplier : 1;
    const effectiveFallSpeed = gameState.fallSpeed / speedMultiplier;

    for (let i = gameState.items.length - 1; i >= 0; i--) {
        const item = gameState.items[i];
        const itemElapsed = (elapsed - item.fallStartTime) / 1000;
        const bossMultiplier = item.isBoss ? CONFIG.BOSS_FALL_SPEED_MULTIPLIER : 1;
        const progress = itemElapsed / (effectiveFallSpeed * bossMultiplier);
        const totalDistance = gameAreaHeight + 120;
        const newY = item.initialY + totalDistance * progress;

        item.y = newY;
        item.element.style.transform = `translateY(${newY - item.initialY}px)`;

        if (newY >= gameAreaHeight - 20) {
            itemsToRemove.push(item);
        }
    }

    itemsToRemove.forEach(item => {
        if (item.isBoss) {
            gameState.currentBoss = null;
            elements.bossHealthContainer.classList.add('hidden');
        }
        removeItem(item, false);
        loseLife();
    });
}

function removeItem(item, wasHit) {
    const index = gameState.items.findIndex(l => l.id === item.id);
    if (index === -1) return;

    gameState.items.splice(index, 1);

    if (wasHit) {
        item.element.style.transform = 'none';
        item.element.style.top = `${item.y}px`;
        item.element.style.left = `${item.x}px`;
        item.element.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';

        const animation = item.element.animate([
            { transform: 'scale(1)', opacity: 1 },
            { transform: `scale(${CONFIG.DESTROY_ANIMATION.SCALE_UP})`, opacity: CONFIG.DESTROY_ANIMATION.MID_OPACITY, offset: 0.5 },
            { transform: `scale(${CONFIG.DESTROY_ANIMATION.SCALE_DOWN})`, opacity: 0 }
        ], {
            duration: CONFIG.DESTROY_ANIMATION.TOTAL_DURATION,
            easing: CONFIG.DESTROY_ANIMATION.EASING,
            fill: 'forwards'
        });

        animation.onfinish = () => {
            if (item.element.parentNode) {
                item.element.parentNode.removeChild(item.element);
            }
        };
    } else {
        if (item.element.parentNode) {
            item.element.parentNode.removeChild(item.element);
        }
    }

    updateActiveLetters();
}

function createParticles(x, y, colorClass) {
    const color = getRandomColorValue();
    const particleCount = CONFIG.PARTICLE_COUNT;
    const distanceRange = CONFIG.PARTICLE_DISTANCE_MAX - CONFIG.PARTICLE_DISTANCE_MIN;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle exploding';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.background = color;
        particle.style.boxShadow = `0 0 10px ${color}`;

        const angle = (Math.PI * 2 / particleCount) * i;
        const distance = CONFIG.PARTICLE_DISTANCE_MIN + Math.random() * distanceRange;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);

        elements.particlesContainer.appendChild(particle);

        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, CONFIG.PARTICLE_DURATION);
    }
}

function createScorePopup(x, y, score) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = typeof score === 'number' ? `+${score}` : score;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;

    elements.scorePopupsContainer.appendChild(popup);

    setTimeout(() => {
        if (popup.parentNode) {
            popup.parentNode.removeChild(popup);
        }
    }, CONFIG.SCORE_POPUP_DURATION);
}

function handleKeyPress(event) {
    if (!gameState.isPlaying) {
        if (event.code === 'Space') {
            event.preventDefault();
            if (!elements.startPanel.classList.contains('hidden')) {
                startGame();
            } else if (!elements.gameOverPanel.classList.contains('hidden')) {
                startGame();
            }
        }
        return;
    }

    if (event.key === 'Escape') {
        endGame();
        return;
    }

    if (event.code === 'Space') {
        event.preventDefault();
    }

    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(event.key)) {
        return;
    }

    gameState.totalKeystrokes++;
    
    let key;
    if (gameState.gameMode === 'code' && event.key.length === 1) {
        key = event.key;
    } else {
        key = event.key.toUpperCase();
    }
    
    const matchingItems = gameState.items.filter(item => {
        const expectedChar = item.expectedInput[item.currentIndex];
        return charMatches(key, expectedChar);
    });
    
    if (matchingItems.length === 0) {
        resetCombo();
        updateUI();
        return;
    }

    matchingItems.sort((a, b) => b.y - a.y);
    const targetItem = matchingItems[0];
    
    hitItem(targetItem, key);
}

function charMatches(inputChar, expectedChar) {
    if (gameState.gameMode === 'code') {
        return inputChar === expectedChar || inputChar.toUpperCase() === expectedChar;
    }
    return inputChar === expectedChar;
}

function hitItem(item, key) {
    if (gameState.gameMode === 'letter') {
        hitLetterItem(item);
    } else {
        hitContentItem(item, key);
    }
}

function hitLetterItem(item) {
    incrementCombo();
    gameState.totalTyped++;
    
    const baseScore = CONFIG.SCORE_PER_LETTER;
    const totalScore = calculateScore(baseScore);
    gameState.score += totalScore;
    
    createScorePopup(item.x + 24, item.y, totalScore);
    createParticles(item.x + 24, item.y + 24, item.color);
    removeItem(item, true);
    updateUI();
}

function hitContentItem(item, key) {
    const expectedChar = item.expectedInput[item.currentIndex];
    
    if (!charMatches(key, expectedChar)) {
        resetCombo();
        updateUI();
        return;
    }
    
    item.currentIndex++;
    incrementCombo();
    gameState.totalTyped++;
    
    if (item.isBoss) {
        damageBoss(1);
    }
    
    if (item.currentIndex >= item.expectedInput.length) {
        const baseScore = item.isBoss ? 0 : 
            (gameState.gameMode === 'sentence' ? 
                CONFIG.SCORE_PER_SENTENCE * item.expectedInput.length :
                CONFIG.SCORE_PER_WORD * item.expectedInput.length);
        const totalScore = calculateScore(baseScore);
        gameState.score += totalScore;
        
        createScorePopup(item.x + item.displayContent.length * 10, item.y, totalScore);
        createParticles(item.x + item.displayContent.length * 10, item.y + 20, item.color);
        
        if (item.isBoss) {
            defeatBoss();
        } else {
            removeItem(item, true);
        }
    } else {
        updateFallingContentDisplay(
            item.element, 
            item.displayContent, 
            item.expectedInput, 
            item.currentIndex
        );
        item.element.dataset.char = item.expectedInput[item.currentIndex];
        updateActiveLetters();
    }
    
    updateUI();
}

function loseLife() {
    gameState.lives--;
    resetCombo();

    elements.dangerFlash.classList.add('active');
    setTimeout(() => {
        elements.dangerFlash.classList.remove('active');
    }, CONFIG.DANGER_FLASH_DURATION);

    updateUI();

    if (gameState.lives <= 0) {
        endGame();
    }
}

function calculateWPM() {
    if (!gameState.startTime) return 0;
    const elapsedMinutes = (Date.now() - gameState.startTime) / 60000;
    if (elapsedMinutes < 0.01) return 0;
    const wordsTyped = gameState.totalTyped / 5;
    return Math.round(wordsTyped / elapsedMinutes);
}

function calculateAccuracy() {
    if (gameState.totalKeystrokes === 0) return 100;
    return Math.round((gameState.totalTyped / gameState.totalKeystrokes) * 100);
}

function updateUI() {
    elements.scoreDisplay.textContent = gameState.score.toLocaleString();
    elements.scoreDisplay.classList.remove('pulse');
    void elements.scoreDisplay.offsetWidth;
    elements.scoreDisplay.classList.add('pulse');

    elements.comboDisplay.textContent = gameState.combo;

    const hearts = '❤'.repeat(gameState.lives) + '♡'.repeat(Math.max(0, CONFIG.INITIAL_LIVES - gameState.lives));
    elements.livesDisplay.textContent = hearts;

    if (gameState.lives <= 1) {
        elements.livesDisplay.classList.add('danger');
    } else {
        elements.livesDisplay.classList.remove('danger');
    }

    const wpm = calculateWPM();
    elements.wpmDisplay.textContent = wpm;
    
    const accuracy = calculateAccuracy();
    gameState.accuracy = accuracy;
    elements.accuracyDisplay.textContent = `${accuracy}%`;
}

function updateActiveLetters() {
    const uniqueChars = [...new Set(gameState.items.map(item => {
        const char = item.expectedInput[item.currentIndex];
        return char ? char.toUpperCase() : '';
    }).filter(c => c))].sort();
    
    elements.activeLetters.innerHTML = uniqueChars
        .map(char => `<span class="active-letter-tag">${char}</span>`)
        .join('');

    if (uniqueChars.length > 0) {
        elements.keyboardHint.classList.add('visible');
    } else {
        elements.keyboardHint.classList.remove('visible');
    }
}

function updateDifficulty(elapsed) {
    if (!isElapsedValid(elapsed)) return;

    if (elapsed - gameState.lastDifficultyIncrease >= CONFIG.DIFFICULTY_INCREASE_INTERVAL) {
        gameState.lastDifficultyIncrease = elapsed;
        gameState.level++;

        gameState.fallSpeed = Math.max(
            CONFIG.MIN_FALL_SPEED,
            gameState.fallSpeed - CONFIG.DIFFICULTY_FALL_SPEED_DECREASE
        );

        gameState.spawnInterval = Math.max(
            CONFIG.MIN_SPAWN_INTERVAL,
            gameState.spawnInterval - CONFIG.DIFFICULTY_SPAWN_INTERVAL_DECREASE
        );
    }
}

function gameLoop(timestamp) {
    if (!gameState.isPlaying) return;

    if (gameState.gameStartTime === 0) {
        gameState.gameStartTime = timestamp;
        gameState.lastSpawnTime = 0;
        gameState.lastDifficultyIncrease = 0;
        gameState.lastBossSpawn = 0;
    }

    const elapsed = sanitizeElapsedTime(timestamp - gameState.gameStartTime);

    updateItemsPosition(elapsed);
    updateDifficulty(elapsed);

    if (elapsed - gameState.lastSpawnTime >= gameState.spawnInterval) {
        createItem(elapsed);
        gameState.lastSpawnTime = elapsed;
    }

    if (Math.floor(elapsed / 1000) !== Math.floor((elapsed - CONFIG.FRAME_DURATION_APPROX) / 1000)) {
        elements.wpmDisplay.textContent = calculateWPM();
        elements.accuracyDisplay.textContent = `${calculateAccuracy()}%`;
    }

    gameState.animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
    gameState.isPlaying = true;
    gameState.score = 0;
    gameState.lives = CONFIG.INITIAL_LIVES;
    gameState.level = 1;
    gameState.items = [];
    gameState.totalTyped = 0;
    gameState.totalKeystrokes = 0;
    gameState.startTime = Date.now();
    gameState.gameStartTime = 0;
    gameState.fallSpeed = CONFIG.INITIAL_FALL_SPEED;
    gameState.spawnInterval = CONFIG.INITIAL_SPAWN_INTERVAL;
    gameState.combo = 0;
    gameState.maxCombo = 0;
    gameState.comboTier = 0;
    gameState.comboMultiplier = 1;
    gameState.lastSpawnTime = 0;
    gameState.lastDifficultyIncrease = 0;
    gameState.lastBossSpawn = 0;
    gameState.bossesDefeated = 0;
    gameState.currentBoss = null;
    gameState.accuracy = 100;

    elements.lettersContainer.innerHTML = '';
    elements.particlesContainer.innerHTML = '';
    elements.scorePopupsContainer.innerHTML = '';

    elements.startPanel.classList.add('hidden');
    elements.gameOverPanel.classList.add('hidden');
    elements.leaderboardPanel.classList.add('hidden');
    elements.bossHealthContainer.classList.add('hidden');
    elements.achievementBadges.innerHTML = '';

    updateComboIndicator();
    updateUI();

    gameState.animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
    gameState.isPlaying = false;

    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
    }

    const gameDuration = Math.round((Date.now() - gameState.startTime) / 1000);
    const finalWpm = calculateWPM();
    const finalAccuracy = calculateAccuracy();
    
    const stats = {
        score: gameState.score,
        maxCombo: gameState.maxCombo,
        wpm: finalWpm,
        accuracy: finalAccuracy,
        duration: gameDuration,
        bossesDefeated: gameState.bossesDefeated,
        gameMode: gameState.gameMode
    };

    if (gameState.isDailyChallenge && gameState.score >= CONFIG.DAILY_CHALLENGE_TARGET_SCORE) {
        const today = new Date().toDateString();
        localStorage.setItem(STORAGE_KEYS.DAILY_PROGRESS, JSON.stringify({
            date: today,
            completed: true,
            score: gameState.score
        }));
    }

    const rank = saveScoreToLeaderboard(stats);
    const achievements = checkAchievements(stats);
    renderAchievements(achievements);

    const modeConfig = CONFIG.GAME_MODES[gameState.gameMode];
    elements.finalScore.textContent = gameState.score.toLocaleString();
    elements.finalCombo.textContent = gameState.maxCombo;
    elements.finalWpm.textContent = `${finalWpm} WPM`;
    elements.finalAccuracy.textContent = `${finalAccuracy}%`;
    elements.finalMode.textContent = modeConfig ? modeConfig.name : '字母模式';
    elements.finalTime.textContent = `${gameDuration}秒`;
    elements.finalRank.textContent = rank ? `#${rank}` : '-';

    setTimeout(() => {
        elements.gameOverPanel.classList.remove('hidden');
    }, 500);

    elements.keyboardHint.classList.remove('visible');
    elements.comboIndicator.classList.add('hidden');
    elements.bossHealthContainer.classList.add('hidden');
    
    gameState.isDailyChallenge = false;
    gameState.dailyTheme = null;
}

function showLeaderboard() {
    elements.leaderboardPanel.classList.remove('hidden');
    elements.leaderboardTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === gameState.gameMode);
    });
    renderLeaderboard(gameState.gameMode);
}

function hideLeaderboard() {
    elements.leaderboardPanel.classList.add('hidden');
}

function showDailyChallenge() {
    gameState.dailyTheme = getDailyChallenge();
    gameState.isDailyChallenge = true;
    
    if (!isDailyCompleted()) {
        alert(`📅 今日挑战: ${gameState.dailyTheme.icon} ${gameState.dailyTheme.name}\n\n目标得分: ${CONFIG.DAILY_CHALLENGE_TARGET_SCORE}\n使用今日主题词库进行游戏！`);
        startGame();
    } else {
        alert('✅ 今日挑战已完成！明天再来挑战吧！');
    }
}

function importCustomWordList(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            let words = [];
            const content = e.target.result;
            
            if (file.name.endsWith('.json')) {
                const data = JSON.parse(content);
                words = Array.isArray(data) ? data : data.words || [];
            } else {
                words = content.split(/[\n,;\s]+/).filter(w => w.length > 0);
            }
            
            if (words.length === 0) {
                alert('❌ 未找到有效的单词');
                return;
            }
            
            gameState.customWordList = words.slice(0, 100);
            saveSettings();
            alert(`✅ 成功导入 ${gameState.customWordList.length} 个单词！`);
        } catch (err) {
            alert('❌ 导入失败：' + err.message);
        }
    };
    reader.readAsText(file);
}

function bindEvents() {
    elements.startBtn.addEventListener('click', startGame);
    elements.restartBtn.addEventListener('click', startGame);
    elements.menuBtn.addEventListener('click', () => {
        elements.gameOverPanel.classList.add('hidden');
        elements.startPanel.classList.remove('hidden');
    });
    
    elements.leaderboardBtn.addEventListener('click', showLeaderboard);
    elements.closeLeaderboardBtn.addEventListener('click', hideLeaderboard);
    
    elements.dailyChallengeBtn.addEventListener('click', showDailyChallenge);
    
    elements.importBtn.addEventListener('click', () => {
        elements.fileImport.click();
    });
    
    elements.fileImport.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            importCustomWordList(e.target.files[0]);
        }
        e.target.value = '';
    });
    
    elements.modeCards.forEach(card => {
        card.addEventListener('click', () => {
            setGameMode(card.dataset.mode);
        });
    });
    
    elements.themeSelect.addEventListener('change', (e) => {
        setTheme(e.target.value);
        applyThemeVariables();
    });
    
    elements.languageSelect.addEventListener('change', (e) => {
        setLanguage(e.target.value);
    });
    
    elements.leaderboardTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.leaderboardTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderLeaderboard(tab.dataset.mode);
        });
    });
    
    document.addEventListener('keydown', handleKeyPress);

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(createStars, 200);
    });
}

function init() {
    initElements();
    applyThemeVariables();
    loadSettings();
    createStars();
    bindEvents();
}

document.addEventListener('DOMContentLoaded', init);
