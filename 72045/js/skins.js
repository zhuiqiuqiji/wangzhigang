class SkinSystem {
    constructor() {
        this.ballSkins = [
            {
                id: 'classic',
                name: '经典黑',
                color1: '#4a4a4a',
                color2: '#1a1a1a',
                color3: '#000000',
                unlocked: true
            },
            {
                id: 'blue',
                name: '海洋蓝',
                color1: '#2196F3',
                color2: '#1565C0',
                color3: '#0D47A1',
                unlocked: true
            },
            {
                id: 'red',
                name: '烈焰红',
                color1: '#f44336',
                color2: '#c62828',
                color3: '#b71c1c',
                unlocked: true
            },
            {
                id: 'green',
                name: '森林绿',
                color1: '#4CAF50',
                color2: '#2E7D32',
                color3: '#1B5E20',
                unlocked: true
            },
            {
                id: 'purple',
                name: '神秘紫',
                color1: '#9C27B0',
                color2: '#6A1B9A',
                color3: '#4A148C',
                unlocked: true
            },
            {
                id: 'gold',
                name: '黄金球',
                color1: '#FFD700',
                color2: '#FFA000',
                color3: '#FF6F00',
                unlocked: true
            },
            {
                id: 'rainbow',
                name: '彩虹球',
                color1: '#ff6b6b',
                color2: '#feca57',
                color3: '#48dbfb',
                special: 'rainbow',
                unlocked: true
            },
            {
                id: 'disco',
                name: '迪斯科',
                color1: '#ff9ff3',
                color2: '#54a0ff',
                color3: '#5f27cd',
                special: 'disco',
                unlocked: true
            }
        ];

        this.laneThemes = [
            {
                id: 'classic',
                name: '经典木纹',
                laneGradient: ['#A0522D', '#DEB887', '#A0522D'],
                borderColor: '#5D4037',
                gutterColor: '#2d3436',
                arrowColor: 'rgba(255, 255, 255, 0.3)',
                unlocked: true
            },
            {
                id: 'neon',
                name: '霓虹灯光',
                laneGradient: ['#0f0f23', '#1a1a3e', '#0f0f23'],
                borderColor: '#ff00ff',
                gutterColor: '#0a0a1a',
                arrowColor: '#00ffff',
                special: 'neon',
                unlocked: true
            },
            {
                id: 'ocean',
                name: '海洋世界',
                laneGradient: ['#0077be', '#00a8e8', '#0077be'],
                borderColor: '#005082',
                gutterColor: '#001f3f',
                arrowColor: 'rgba(255, 255, 255, 0.5)',
                unlocked: true
            },
            {
                id: 'forest',
                name: '森林小径',
                laneGradient: ['#2d5a27', '#4a7c43', '#2d5a27'],
                borderColor: '#1e3d1a',
                gutterColor: '#1a2f1a',
                arrowColor: '#90EE90',
                unlocked: true
            },
            {
                id: 'space',
                name: '星际空间',
                laneGradient: ['#0a0a20', '#1a1a40', '#0a0a20'],
                borderColor: '#6366f1',
                gutterColor: '#050510',
                arrowColor: '#a855f7',
                special: 'stars',
                unlocked: true
            },
            {
                id: 'retro',
                name: '复古风格',
                laneGradient: ['#f5deb3', '#daa520', '#f5deb3'],
                borderColor: '#8b4513',
                gutterColor: '#3d2914',
                arrowColor: '#8b4513',
                unlocked: true
            }
        ];

        this.currentBallSkin = 'classic';
        this.currentLaneTheme = 'classic';
    }

    getBallSkins() {
        return this.ballSkins;
    }

    getLaneThemes() {
        return this.laneThemes;
    }

    getCurrentBallSkin() {
        return this.ballSkins.find(s => s.id === this.currentBallSkin) || this.ballSkins[0];
    }

    getCurrentLaneTheme() {
        return this.laneThemes.find(t => t.id === this.currentLaneTheme) || this.laneThemes[0];
    }

    setBallSkin(skinId) {
        const skin = this.ballSkins.find(s => s.id === skinId);
        if (skin && skin.unlocked) {
            this.currentBallSkin = skinId;
            return true;
        }
        return false;
    }

    setLaneTheme(themeId) {
        const theme = this.laneThemes.find(t => t.id === themeId);
        if (theme && theme.unlocked) {
            this.currentLaneTheme = themeId;
            return true;
        }
        return false;
    }

    unlockSkin(skinId) {
        const skin = this.ballSkins.find(s => s.id === skinId);
        if (skin) {
            skin.unlocked = true;
        }
    }

    unlockTheme(themeId) {
        const theme = this.laneThemes.find(t => t.id === themeId);
        if (theme) {
            theme.unlocked = true;
        }
    }

    renderSkinSelector() {
        const container = document.getElementById('skinSelector');
        if (!container) return;

        container.innerHTML = '';
        
        this.ballSkins.forEach(skin => {
            const card = document.createElement('div');
            card.className = `skin-card ${skin.id === this.currentBallSkin ? 'active' : ''}`;
            card.dataset.skinId = skin.id;
            card.title = skin.name;
            
            if (skin.special === 'rainbow') {
                card.style.background = `linear-gradient(135deg, ${skin.color1}, ${skin.color2}, ${skin.color3})`;
                card.innerHTML = '🌈';
            } else if (skin.special === 'disco') {
                card.style.background = `linear-gradient(135deg, ${skin.color1}, ${skin.color2}, ${skin.color3})`;
                card.innerHTML = '✨';
            } else {
                const preview = document.createElement('div');
                preview.className = 'skin-preview';
                preview.style.background = `radial-gradient(circle at 30% 30%, ${skin.color1}, ${skin.color2}, ${skin.color3})`;
                card.appendChild(preview);
            }
            
            card.addEventListener('click', () => {
                this.setBallSkin(skin.id);
                this.renderSkinSelector();
            });
            
            container.appendChild(card);
        });
    }

    renderThemeSelector() {
        const container = document.getElementById('themeSelector');
        if (!container) return;

        container.innerHTML = '';
        
        this.laneThemes.forEach(theme => {
            const card = document.createElement('div');
            card.className = `theme-card ${theme.id === this.currentLaneTheme ? 'active' : ''}`;
            card.dataset.themeId = theme.id;
            card.title = theme.name;
            
            const preview = document.createElement('div');
            preview.className = 'theme-preview';
            preview.style.background = `linear-gradient(135deg, ${theme.laneGradient.join(', ')})`;
            preview.style.border = `3px solid ${theme.borderColor}`;
            card.appendChild(preview);
            
            card.addEventListener('click', () => {
                this.setLaneTheme(theme.id);
                this.renderThemeSelector();
            });
            
            container.appendChild(card);
        });
    }
}

const skinSystem = new SkinSystem();
