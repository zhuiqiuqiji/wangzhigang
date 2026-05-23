class UIController {
    constructor(game) {
        this.game = game;
        this.elements = {};
        this.initElements();
        this.initEventListeners();
        this.initTowerSelection();
        this.initSkillButtons();
        this.initHeroSelection();
        this.initThemeSelection();
        this.updateAllUI();
    }

    initElements() {
        this.elements = {
            livesFill: document.getElementById('livesFill'),
            livesText: document.getElementById('livesText'),
            goldText: document.getElementById('goldText'),
            waveText: document.getElementById('waveText'),
            gameCanvas: document.getElementById('gameCanvas'),
            gameOverlay: document.getElementById('gameOverlay'),
            overlayIcon: document.getElementById('overlayIcon'),
            overlayTitle: document.getElementById('overlayTitle'),
            overlaySubtitle: document.getElementById('overlaySubtitle'),
            restartBtn: document.getElementById('restartBtn'),
            towerSelection: document.getElementById('towerSelection'),
            startWaveBtn: document.getElementById('startWaveBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            towerInfoPanel: document.getElementById('towerInfoPanel'),
            towerName: document.getElementById('towerName'),
            towerLevel: document.getElementById('towerLevel'),
            towerDamage: document.getElementById('towerDamage'),
            towerRange: document.getElementById('towerRange'),
            towerSpeed: document.getElementById('towerSpeed'),
            upgradeBtn: document.getElementById('upgradeBtn'),
            upgradeCost: document.getElementById('upgradeCost'),
            sellBtn: document.getElementById('sellBtn'),
            sellValue: document.getElementById('sellValue'),
            closePanelBtn: document.getElementById('closePanelBtn'),
            skillButtons: document.getElementById('skillButtons'),
            heroSelection: document.getElementById('heroSelection'),
            themeSelection: document.getElementById('themeSelection'),
            heroInfo: document.getElementById('heroInfo')
        };
    }

    initEventListeners() {
        const canvas = this.elements.gameCanvas;

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.game.handleMouseMove(x, y);
        });

        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.game.handleClick(x, y, false);
        });

        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.game.handleClick(x, y, true);
        });

        this.elements.startWaveBtn.addEventListener('click', () => {
            this.game.startWave();
            this.updateStartWaveButton();
        });

        this.elements.pauseBtn.addEventListener('click', () => {
            this.game.pause();
            this.updatePauseButton();
        });

        this.elements.restartBtn.addEventListener('click', () => {
            this.restartGame();
        });

        this.elements.upgradeBtn.addEventListener('click', () => {
            this.game.upgradeSelectedTower();
        });

        this.elements.sellBtn.addEventListener('click', () => {
            this.game.sellSelectedTower();
        });

        this.elements.closePanelBtn.addEventListener('click', () => {
            this.game.deselectTower();
        });

        this.game.onGoldChange = (gold) => this.updateGoldUI(gold);
        this.game.onLivesChange = (lives, maxLives) => this.updateLivesUI(lives, maxLives);
        this.game.onWaveChange = (wave, total) => this.updateWaveUI(wave, total);
        this.game.onGameOver = () => this.showGameOver();
        this.game.onVictory = () => this.showVictory();
        this.game.onTowerSelected = (tower) => this.updateTowerInfoPanel(tower);
        this.game.onWaveComplete = () => this.updateStartWaveButton();
    }

    initTowerSelection() {
        const container = this.elements.towerSelection;
        container.innerHTML = '';

        for (const [type, config] of Object.entries(TOWER_TYPES)) {
            const card = document.createElement('div');
            card.className = 'tower-card';
            card.dataset.towerType = type;
            card.innerHTML = `
                <div class="tower-icon">${config.emoji}</div>
                <div class="tower-name">${config.name}</div>
                <div class="tower-cost">💰${config.cost}</div>
            `;

            card.addEventListener('click', () => {
                this.selectTowerType(type, card);
            });

            container.appendChild(card);
        }
    }

    initSkillButtons() {
        const container = this.elements.skillButtons;
        if (!container) return;

        container.innerHTML = '';
        const skills = SkillSystem.getSkillList();

        for (const skill of skills) {
            const btn = document.createElement('button');
            btn.className = 'skill-btn';
            btn.dataset.skill = skill.key;
            btn.innerHTML = `
                <span class="skill-icon">${skill.icon}</span>
                <span class="skill-name">${skill.name}</span>
                <div class="skill-cooldown" style="display: none;"></div>
            `;
            btn.title = skill.description;
            btn.style.borderColor = skill.color;

            btn.addEventListener('click', () => {
                this.useSkill(skill.key);
            });

            container.appendChild(btn);
        }
    }

    initHeroSelection() {
        const container = this.elements.heroSelection;
        if (!container) return;

        container.innerHTML = '';

        for (const [type, config] of Object.entries(HERO_TYPES)) {
            const card = document.createElement('div');
            card.className = 'hero-card';
            card.dataset.heroType = type;
            card.innerHTML = `
                <div class="hero-icon">${config.emoji}</div>
                <div class="hero-name">${config.name}</div>
                <div class="hero-stats">❤️${config.health} ⚔️${config.damage}</div>
            `;

            card.addEventListener('click', () => {
                this.selectHero(type, card);
            });

            container.appendChild(card);
        }
    }

    initThemeSelection() {
        const container = this.elements.themeSelection;
        if (!container) return;

        container.innerHTML = '';
        const themes = GameMap.getThemes();

        for (const theme of themes) {
            const btn = document.createElement('button');
            btn.className = 'theme-btn';
            btn.dataset.theme = theme.id;
            btn.textContent = theme.name;

            if (theme.id === this.game.currentTheme) {
                btn.classList.add('active');
            }

            btn.addEventListener('click', () => {
                this.changeTheme(theme.id);
            });

            container.appendChild(btn);
        }
    }

    selectTowerType(type, card) {
        document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('selected'));

        if (this.game.selectedTowerType === type) {
            this.game.selectedTowerType = null;
        } else {
            this.game.selectedTowerType = type;
            card.classList.add('selected');
            this.game.deselectTower();
        }
    }

    selectHero(type, card) {
        document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.game.spawnHero(type);
        const heroInfoPanel = this.elements.heroInfo;
        if (heroInfoPanel) {
            heroInfoPanel.style.display = 'block';
        }
        this.updateHeroInfo();
    }

    useSkill(skillKey) {
        const effect = this.game.useSkill(skillKey);
        if (effect) {
            this.updateSkillCooldown(skillKey);
        }
    }

    updateSkillCooldown(skillKey) {
        const btn = document.querySelector(`[data-skill="${skillKey}"]`);
        if (!btn) return;

        const cooldownEl = btn.querySelector('.skill-cooldown');
        const cooldown = this.game.skillSystem.skills[skillKey].cooldown;
        let remaining = cooldown;

        cooldownEl.style.display = 'flex';
        btn.disabled = true;

        const interval = setInterval(() => {
            remaining -= 0.1;
            const percent = (remaining / cooldown) * 100;
            cooldownEl.textContent = remaining.toFixed(1);
            cooldownEl.style.height = `${percent}%`;

            if (remaining <= 0) {
                clearInterval(interval);
                cooldownEl.style.display = 'none';
                btn.disabled = false;
            }
        }, 100);
    }

    changeTheme(themeId) {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`[data-theme="${themeId}"]`)?.classList.add('active');
        this.game.restart(themeId);
        this.updateAllUI();
    }

    updateAllUI() {
        this.updateGoldUI(this.game.gold);
        this.updateLivesUI(this.game.lives, this.game.maxLives);
        this.updateWaveUI(this.game.currentWave, this.game.totalWaves);
        this.updateStartWaveButton();
        this.updateTowerCards();
        this.updateHeroInfo();
    }

    updateGoldUI(gold) {
        this.elements.goldText.textContent = gold;
        this.updateTowerCards();
    }

    updateLivesUI(lives, maxLives) {
        const percent = (lives / maxLives) * 100;
        this.elements.livesFill.style.width = percent + '%';
        this.elements.livesText.textContent = `${lives}/${maxLives}`;
    }

    updateWaveUI(wave, total) {
        this.elements.waveText.textContent = `${wave} / ${total}`;
        this.updateStartWaveButton();
    }

    updateStartWaveButton() {
        const btn = this.elements.startWaveBtn;
        if (this.game.waveInProgress) {
            btn.textContent = '战斗中...';
            btn.disabled = true;
        } else if (this.game.currentWave >= this.game.totalWaves) {
            btn.textContent = '已完成所有波次';
            btn.disabled = true;
        } else {
            btn.textContent = this.game.currentWave === 0 ? '开始游戏' : '开始下一波';
            btn.disabled = false;
        }
    }

    updatePauseButton() {
        const btn = this.elements.pauseBtn;
        if (this.game.state === GAME_STATE.PAUSED) {
            btn.textContent = '继续';
        } else {
            btn.textContent = '暂停';
        }
    }

    updateTowerCards() {
        document.querySelectorAll('.tower-card').forEach(card => {
            const type = card.dataset.towerType;
            const config = TOWER_TYPES[type];
            if (this.game.gold < config.cost) {
                card.classList.add('disabled');
            } else {
                card.classList.remove('disabled');
            }
        });
    }

    updateHeroInfo() {
        const heroInfo = this.elements.heroInfo;
        if (!heroInfo || !this.game.hero) return;

        const hero = this.game.hero;
        heroInfo.innerHTML = `
            <div class="hero-info-header">
                <span class="hero-icon">${hero.emoji}</span>
                <span class="hero-name">${hero.name} Lv.${hero.level}</span>
            </div>
            <div class="hero-stats-bar">
                <div class="stat-item">
                    <span>❤️</span>
                    <div class="stat-bar">
                        <div class="stat-fill health" style="width: ${(hero.health / hero.maxHealth) * 100}%"></div>
                    </div>
                    <span>${Math.floor(hero.health)}/${hero.maxHealth}</span>
                </div>
                <div class="stat-item">
                    <span>⭐</span>
                    <div class="stat-bar">
                        <div class="stat-fill exp" style="width: ${(hero.exp / hero.expToLevel) * 100}%"></div>
                    </div>
                    <span>${hero.exp}/${hero.expToLevel}</span>
                </div>
            </div>
            <button class="hero-skill-btn" onclick="game.useHeroSkill()">
                ${hero.skill.name} (${hero.skillCooldown > 0 ? hero.skillCooldown.toFixed(1) + 's' : '就绪'})
            </button>
        `;
    }

    updateTowerInfoPanel(tower) {
        const panel = this.elements.towerInfoPanel;

        if (!tower) {
            panel.style.display = 'none';
            return;
        }

        this.elements.towerName.textContent = tower.name;
        this.elements.towerLevel.textContent = `${tower.level} / ${tower.maxLevel}`;
        this.elements.towerDamage.textContent = tower.damage;
        this.elements.towerRange.textContent = tower.range;
        this.elements.towerSpeed.textContent = (1000 / tower.fireRate).toFixed(1) + '/s';

        if (tower.canUpgrade()) {
            const cost = tower.getUpgradeCost();
            this.elements.upgradeCost.textContent = cost;
            this.elements.upgradeBtn.disabled = this.game.gold < cost;
            this.elements.upgradeBtn.style.display = 'block';
        } else {
            this.elements.upgradeBtn.style.display = 'none';
        }

        this.elements.sellValue.textContent = tower.getSellValue();

        const rect = this.elements.gameCanvas.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        let left = rect.left + tower.x + 30;
        let top = rect.top + tower.y - panelRect.height / 2;

        if (left + panelRect.width > window.innerWidth) {
            left = rect.left + tower.x - panelRect.width - 30;
        }
        if (top < 10) top = 10;
        if (top + panelRect.height > window.innerHeight - 10) {
            top = window.innerHeight - panelRect.height - 10;
        }

        panel.style.left = left + 'px';
        panel.style.top = top + 'px';
        panel.style.display = 'block';
    }

    showGameOver() {
        this.elements.overlayIcon.textContent = '😢';
        this.elements.overlayTitle.textContent = '游戏失败!';
        this.elements.overlaySubtitle.textContent = '萝卜被怪物吃掉了...';
        this.elements.gameOverlay.style.display = 'flex';
    }

    showVictory() {
        this.elements.overlayIcon.textContent = '🎉';
        this.elements.overlayTitle.textContent = '游戏胜利!';
        this.elements.overlaySubtitle.textContent = '恭喜你成功保卫了萝卜!';
        this.elements.gameOverlay.style.display = 'flex';
    }

    restartGame() {
        this.elements.gameOverlay.style.display = 'none';
        this.game.restart();
        this.updateAllUI();
        document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('selected'));
        document.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
    }
}
