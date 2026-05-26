const Leaderboard = {
    entries: [],
    maxEntries: 50,
    achievements: [],
    gameHistory: [],

    init() {
        this.load();
        this.loadAchievements();
        this.loadGameHistory();
    },

    addEntry(name, score, length, kills, gameMode) {
        const entry = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: name,
            score: score,
            length: length,
            kills: kills,
            gameMode: gameMode,
            date: new Date().toISOString(),
            rank: 0
        };

        this.entries.push(entry);
        this.sortEntries();
        this.trimEntries();
        this.save();

        this.addToHistory(entry);
        this.checkAchievements(entry);

        return this.getRank(entry.id);
    },

    sortEntries() {
        this.entries.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.length !== a.length) return b.length - a.length;
            return b.kills - a.kills;
        });

        this.entries.forEach((entry, index) => {
            entry.rank = index + 1;
        });
    },

    trimEntries() {
        if (this.entries.length > this.maxEntries) {
            this.entries = this.entries.slice(0, this.maxEntries);
        }
    },

    getRank(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        return entry ? entry.rank : -1;
    },

    getTopEntries(count = 10, gameMode = null) {
        let entries = this.entries;
        if (gameMode && gameMode !== 'all') {
            entries = entries.filter(e => e.gameMode === gameMode);
        }
        return entries.slice(0, count);
    },

    getHighestScore() {
        if (this.entries.length === 0) return 0;
        return this.entries[0].score;
    },

    getMostKills() {
        if (this.entries.length === 0) return 0;
        return Math.max(...this.entries.map(e => e.kills));
    },

    getAverageScore() {
        if (this.gameHistory.length === 0) return 0;
        const total = this.gameHistory.reduce((sum, g) => sum + g.score, 0);
        return Math.round(total / this.gameHistory.length);
    },

    getTotalGames() {
        return this.gameHistory.length;
    },

    getBestRank() {
        if (this.gameHistory.length === 0) return '-';
        return Math.min(...this.gameHistory.map(g => g.rank || 999));
    },

    addToHistory(entry) {
        const historyEntry = {
            ...entry,
            timestamp: Date.now()
        };
        this.gameHistory.unshift(historyEntry);
        if (this.gameHistory.length > 100) {
            this.gameHistory = this.gameHistory.slice(0, 100);
        }
        this.saveGameHistory();
    },

    checkAchievements(entry) {
        const achievementDefs = [
            { id: 'first_game', name: '初次冒险', desc: '完成第一局游戏', check: () => this.gameHistory.length >= 1 },
            { id: 'score_100', name: '初露锋芒', desc: '单局得分超过100', check: () => entry.score >= 100 },
            { id: 'score_500', name: '渐入佳境', desc: '单局得分超过500', check: () => entry.score >= 500 },
            { id: 'score_1000', name: '实力不凡', desc: '单局得分超过1000', check: () => entry.score >= 1000 },
            { id: 'score_2000', name: '高手玩家', desc: '单局得分超过2000', check: () => entry.score >= 2000 },
            { id: 'score_5000', name: '顶尖选手', desc: '单局得分超过5000', check: () => entry.score >= 5000 },
            { id: 'length_50', name: '小有所成', desc: '蛇身长度超过50', check: () => entry.length >= 50 },
            { id: 'length_100', name: '庞然大物', desc: '蛇身长度超过100', check: () => entry.length >= 100 },
            { id: 'length_200', name: '巨蛇之王', desc: '蛇身长度超过200', check: () => entry.length >= 200 },
            { id: 'kills_5', name: '初战告捷', desc: '单局击杀5条蛇', check: () => entry.kills >= 5 },
            { id: 'kills_10', name: '猎杀专家', desc: '单局击杀10条蛇', check: () => entry.kills >= 10 },
            { id: 'kills_20', name: '死亡猎手', desc: '单局击杀20条蛇', check: () => entry.kills >= 20 },
            { id: 'rank_1', name: '冠军得主', desc: '获得竞技模式第一名', check: () => entry.rank === 1 && (entry.gameMode === 'battle' || entry.gameMode === 'team') },
            { id: 'games_10', name: '经验丰富', desc: '累计游玩10局', check: () => this.gameHistory.length >= 10 },
            { id: 'games_50', name: '资深玩家', desc: '累计游玩50局', check: () => this.gameHistory.length >= 50 },
            { id: 'games_100', name: '传奇玩家', desc: '累计游玩100局', check: () => this.gameHistory.length >= 100 }
        ];

        for (const def of achievementDefs) {
            if (!this.achievements.find(a => a.id === def.id) && def.check()) {
                this.achievements.push({
                    id: def.id,
                    name: def.name,
                    desc: def.desc,
                    date: new Date().toISOString()
                });
            }
        }
        this.saveAchievements();
    },

    getAchievements() {
        return this.achievements;
    },

    getRecentGames(count = 10) {
        return this.gameHistory.slice(0, count);
    },

    getGameHistory() {
        return this.gameHistory;
    },

    save() {
        localStorage.setItem('snakeLeaderboard', JSON.stringify(this.entries));
    },

    saveGameHistory() {
        localStorage.setItem('snakeGameHistory', JSON.stringify(this.gameHistory));
    },

    saveAchievements() {
        localStorage.setItem('snakeAchievements', JSON.stringify(this.achievements));
    },

    load() {
        const saved = localStorage.getItem('snakeLeaderboard');
        if (saved) {
            try {
                this.entries = JSON.parse(saved);
                this.sortEntries();
            } catch (e) {
                console.error('Failed to load leaderboard:', e);
                this.entries = [];
            }
        }
    },

    loadGameHistory() {
        const saved = localStorage.getItem('snakeGameHistory');
        if (saved) {
            try {
                this.gameHistory = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load game history:', e);
                this.gameHistory = [];
            }
        }
    },

    loadAchievements() {
        const saved = localStorage.getItem('snakeAchievements');
        if (saved) {
            try {
                this.achievements = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load achievements:', e);
                this.achievements = [];
            }
        }
    },

    clear() {
        this.entries = [];
        this.gameHistory = [];
        this.achievements = [];
        this.save();
        this.saveGameHistory();
        this.saveAchievements();
    }
};

const SeasonSystem = {
    currentSeason: 1,
    rating: 1000,
    gamesPlayed: 0,
    wins: 0,
    seasonStartDate: null,
    seasonDuration: 30 * 24 * 60 * 60 * 1000,
    seasonHistory: [],

    init() {
        this.load();
        this.checkSeasonReset();
    },

    checkSeasonReset() {
        const now = Date.now();
        if (!this.seasonStartDate) {
            this.seasonStartDate = now;
            this.save();
        } else if (now - this.seasonStartDate > this.seasonDuration) {
            this.archiveSeason();
            this.currentSeason++;
            this.seasonStartDate = now;
            this.rating = 1000;
            this.gamesPlayed = 0;
            this.wins = 0;
            this.save();
        }
    },

    archiveSeason() {
        const archives = this.getSeasonArchives();
        archives.push({
            season: this.currentSeason,
            endRating: this.rating,
            gamesPlayed: this.gamesPlayed,
            wins: this.wins,
            startDate: this.seasonStartDate,
            endDate: Date.now()
        });
        localStorage.setItem('snakeSeasonArchives', JSON.stringify(archives));
    },

    getSeasonArchives() {
        const saved = localStorage.getItem('snakeSeasonArchives');
        return saved ? JSON.parse(saved) : [];
    },

    recordGame(score, rank, totalPlayers) {
        this.gamesPlayed++;

        const expectedScore = 1 / (1 + Math.pow(10, (1500 - this.rating) / 400));
        const actualScore = 1 - (rank - 1) / totalPlayers;

        const kFactor = 32;
        const ratingChange = Math.round(kFactor * (actualScore - expectedScore));

        const oldRating = this.rating;
        this.rating = Math.max(0, this.rating + ratingChange);

        if (rank === 1) {
            this.wins++;
        }

        this.seasonHistory.unshift({
            score: score,
            rank: rank,
            totalPlayers: totalPlayers,
            ratingChange: ratingChange,
            oldRating: oldRating,
            newRating: this.rating,
            date: new Date().toISOString()
        });

        if (this.seasonHistory.length > 50) {
            this.seasonHistory = this.seasonHistory.slice(0, 50);
        }

        this.save();

        return {
            ratingChange: ratingChange,
            newRating: this.rating,
            rank: rank
        };
    },

    getRankName() {
        if (this.rating >= 2000) return '传说';
        if (this.rating >= 1800) return '大师';
        if (this.rating >= 1600) return '钻石';
        if (this.rating >= 1400) return '铂金';
        if (this.rating >= 1200) return '黄金';
        if (this.rating >= 1000) return '白银';
        return '青铜';
    },

    getRankColor() {
        if (this.rating >= 2000) return '#ff6b6b';
        if (this.rating >= 1800) return '#a855f7';
        if (this.rating >= 1600) return '#38bdf8';
        if (this.rating >= 1400) return '#94a3b8';
        if (this.rating >= 1200) return '#ffd700';
        if (this.rating >= 1000) return '#c0c0c0';
        return '#cd7f32';
    },

    getNextRankProgress() {
        const thresholds = [1000, 1200, 1400, 1600, 1800, 2000];
        const currentThreshold = thresholds.find(t => this.rating < t) || 2000;
        const prevThreshold = thresholds[thresholds.indexOf(currentThreshold) - 1] || 0;
        const progress = (this.rating - prevThreshold) / (currentThreshold - prevThreshold);
        return {
            currentRank: this.getRankName(),
            nextRank: this.getRankNameByRating(currentThreshold),
            progress: Math.max(0, Math.min(1, progress))
        };
    },

    getRankNameByRating(rating) {
        if (rating >= 2000) return '传说';
        if (rating >= 1800) return '大师';
        if (rating >= 1600) return '钻石';
        if (rating >= 1400) return '铂金';
        if (rating >= 1200) return '黄金';
        if (rating >= 1000) return '白银';
        return '青铜';
    },

    getSeasonProgress() {
        const now = Date.now();
        const elapsed = now - this.seasonStartDate;
        const progress = Math.min(1, elapsed / this.seasonDuration);
        const daysRemaining = Math.ceil((this.seasonDuration - elapsed) / (24 * 60 * 60 * 1000));
        return {
            progress: progress,
            daysRemaining: daysRemaining
        };
    },

    getSeasonHistory() {
        return this.seasonHistory;
    },

    getWinRate() {
        if (this.gamesPlayed === 0) return 0;
        return Math.round((this.wins / this.gamesPlayed) * 100);
    },

    save() {
        const data = {
            currentSeason: this.currentSeason,
            rating: this.rating,
            gamesPlayed: this.gamesPlayed,
            wins: this.wins,
            seasonStartDate: this.seasonStartDate,
            seasonHistory: this.seasonHistory
        };
        localStorage.setItem('snakeSeason', JSON.stringify(data));
    },

    load() {
        const saved = localStorage.getItem('snakeSeason');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.currentSeason = data.currentSeason || 1;
                this.rating = data.rating || 1000;
                this.gamesPlayed = data.gamesPlayed || 0;
                this.wins = data.wins || 0;
                this.seasonStartDate = data.seasonStartDate;
                this.seasonHistory = data.seasonHistory || [];
            } catch (e) {
                console.error('Failed to load season:', e);
            }
        }
    }
};