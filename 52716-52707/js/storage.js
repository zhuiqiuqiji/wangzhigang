const Storage = {
    STORAGE_KEY: 'mahjong_connect_data',
    
    defaultData: {
        currentTheme: 'classic',
        currentLevel: 1,
        highScore: 0,
        levels: {},
        totalStars: 0
    },

    getData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('读取存储数据失败:', e);
        }
        return { ...this.defaultData };
    },

    saveData(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存数据失败:', e);
            return false;
        }
    },

    getCurrentTheme() {
        const data = this.getData();
        return data.currentTheme || 'classic';
    },

    setCurrentTheme(theme) {
        const data = this.getData();
        data.currentTheme = theme;
        return this.saveData(data);
    },

    getCurrentLevel() {
        const data = this.getData();
        return data.currentLevel || 1;
    },

    setCurrentLevel(level) {
        const data = this.getData();
        data.currentLevel = level;
        return this.saveData(data);
    },

    getHighScore() {
        const data = this.getData();
        return data.highScore || 0;
    },

    setHighScore(score) {
        const data = this.getData();
        if (score > data.highScore) {
            data.highScore = score;
            this.saveData(data);
            return true;
        }
        return false;
    },

    getLevelData(levelId) {
        const data = this.getData();
        return data.levels[levelId] || { unlocked: levelId === 1, stars: 0, bestScore: 0, bestTime: null };
    },

    saveLevelResult(levelId, score, time, stars) {
        const data = this.getData();
        const levelData = data.levels[levelId] || { unlocked: true, stars: 0, bestScore: 0, bestTime: null };
        
        if (stars > levelData.stars) {
            levelData.stars = stars;
        }
        if (score > levelData.bestScore) {
            levelData.bestScore = score;
        }
        if (time && (!levelData.bestTime || time < levelData.bestTime)) {
            levelData.bestTime = time;
        }
        
        data.levels[levelId] = levelData;
        
        data.totalStars = Object.values(data.levels).reduce((sum, level) => sum + (level.stars || 0), 0);
        
        if (stars > 0 && levelId < Levels.getLevelCount()) {
            const nextLevelId = levelId + 1;
            if (!data.levels[nextLevelId]) {
                data.levels[nextLevelId] = { unlocked: true, stars: 0, bestScore: 0, bestTime: null };
            } else {
                data.levels[nextLevelId].unlocked = true;
            }
        }
        
        this.saveData(data);
        return data;
    },

    getUnlockedLevels() {
        const data = this.getData();
        let count = 0;
        for (let i = 1; i <= Levels.getLevelCount(); i++) {
            const levelData = data.levels[i];
            if (levelData && levelData.unlocked) {
                count++;
            }
        }
        return count || 1;
    },

    getTotalStars() {
        const data = this.getData();
        return data.totalStars || 0;
    },

    resetProgress() {
        return this.saveData({ ...this.defaultData });
    }
};
