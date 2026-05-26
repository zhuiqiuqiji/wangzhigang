class Menu {
    constructor() {
        this.init();
    }

    init() {
        this.updateStats();
        this.bindEvents();
        this.renderLevels();
        this.renderThemes();
    }

    bindEvents() {
        document.getElementById('btn-start').addEventListener('click', () => this.startGame());
        document.getElementById('btn-levels').addEventListener('click', () => this.openPanel('levels-panel'));
        document.getElementById('btn-themes').addEventListener('click', () => this.openPanel('themes-panel'));
        document.getElementById('btn-help').addEventListener('click', () => this.openPanel('help-panel'));

        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panelId = e.target.dataset.close;
                this.closePanel(panelId);
            });
        });

        document.querySelectorAll('.panel').forEach(panel => {
            panel.addEventListener('click', (e) => {
                if (e.target === panel) {
                    this.closePanel(panel.id);
                }
            });
        });
    }

    updateStats() {
        document.getElementById('total-stars').textContent = Storage.getTotalStars();
        document.getElementById('levels-unlocked').textContent = Storage.getUnlockedLevels();
        document.getElementById('high-score').textContent = Storage.getHighScore();
    }

    openPanel(panelId) {
        document.getElementById(panelId).classList.remove('hidden');
    }

    closePanel(panelId) {
        document.getElementById(panelId).classList.add('hidden');
    }

    renderLevels() {
        const grid = document.getElementById('levels-grid');
        grid.innerHTML = '';

        for (let i = 1; i <= Levels.getLevelCount(); i++) {
            const level = Levels.getLevel(i);
            const levelData = Storage.getLevelData(i);
            
            const card = document.createElement('div');
            card.className = `level-card ${levelData.unlocked ? '' : 'locked'}`;
            
            if (levelData.unlocked) {
                card.addEventListener('click', () => this.selectLevel(i));
            }

            card.innerHTML = `
                <div class="level-number">${i}</div>
                <div class="level-name">${level.name}</div>
                <div class="level-stars">
                    ${this.renderStars(levelData.stars)}
                </div>
                ${levelData.unlocked ? '' : '<div class="level-lock">🔒</div>'}
            `;
            
            grid.appendChild(card);
        }
    }

    renderStars(count) {
        let html = '';
        for (let i = 0; i < 3; i++) {
            html += `<span class="star ${i < count ? 'filled' : ''}">★</span>`;
        }
        return html;
    }

    renderThemes() {
        const grid = document.getElementById('themes-grid');
        grid.innerHTML = '';
        const currentTheme = Storage.getCurrentTheme();

        Object.entries(Themes).forEach(([key, theme]) => {
            const card = document.createElement('div');
            card.className = `theme-card ${key === currentTheme ? 'active' : ''}`;
            card.style.background = theme.boardBackground;
            
            card.addEventListener('click', () => this.selectTheme(key));

            const preview = theme.tileTypes.slice(0, 4).map(t => t.display).join('');
            
            card.innerHTML = `
                <div class="theme-name">${theme.name}</div>
                <div class="theme-preview">${preview}</div>
            `;
            
            grid.appendChild(card);
        });
    }

    selectLevel(levelId) {
        Storage.setCurrentLevel(levelId);
        this.closePanel('levels-panel');
        this.startGame();
    }

    selectTheme(themeKey) {
        Storage.setCurrentTheme(themeKey);
        this.renderThemes();
        
        const theme = Themes[themeKey];
        document.querySelector('.menu-bg').style.background = theme.background;
    }

    startGame() {
        const levelId = Storage.getCurrentLevel();
        const theme = Storage.getCurrentTheme();
        window.location.href = `index.html?level=${levelId}&theme=${theme}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Menu();
});
