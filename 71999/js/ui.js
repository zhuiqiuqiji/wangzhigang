class UIManager {
    constructor(game) {
        this.game = game;
        this.messageTimeout = null;
    }

    updateHUD(player) {
        this.updateHealthBar(player);
        this.updateManaBar(player);
        this.updateLevel(player);
        this.updateGold(player);
        this.updateKeys(player);
        this.updateStats(player);
        this.updateExpBar(player);
        this.updateSkillBar(player);
        this.updateClassDisplay(player);
        this.updateCombatModeDisplay();
    }

    updateHealthBar(player) {
        const hpBar = document.getElementById('hp-bar');
        const hpText = document.getElementById('hp-text');
        if (hpBar && hpText) {
            hpBar.style.width = (player.hp / player.maxHp) * 100 + '%';
            hpText.textContent = `${Math.floor(player.hp)}/${player.maxHp}`;
        }
    }

    updateManaBar(player) {
        const mpBar = document.getElementById('mp-bar');
        const mpText = document.getElementById('mp-text');
        if (mpBar && mpText) {
            mpBar.style.width = (player.mp / player.maxMp) * 100 + '%';
            mpText.textContent = `${Math.floor(player.mp)}/${player.maxMp}`;
        }
    }

    updateLevel(player) {
        const el = document.getElementById('level-value');
        if (el) el.textContent = player.level;
    }

    updateGold(player) {
        const el = document.getElementById('gold-value');
        if (el) el.textContent = player.gold;
    }

    updateKeys(player) {
        const el = document.getElementById('keys-value');
        if (el) el.textContent = player.keys;
    }

    updateStats(player) {
        const atk = document.getElementById('attack-value');
        const def = document.getElementById('defense-value');
        if (atk) atk.textContent = player.attack;
        if (def) def.textContent = player.defense;
    }

    updateExpBar(player) {
        const expBar = document.getElementById('exp-bar');
        const expText = document.getElementById('exp-text');
        if (expBar && expText) {
            expBar.style.width = (player.exp / player.expToLevel) * 100 + '%';
            expText.textContent = `${player.exp}/${player.expToLevel}`;
        }
    }

    updateClassDisplay(player) {
        const el = document.getElementById('class-display');
        if (el) el.textContent = `${player.classData.icon} ${player.classData.name}`;
    }

    updateFloorDisplay(floor, seed) {
        const floorEl = document.getElementById('floor-display');
        if (floorEl) floorEl.textContent = `B${floor}F`;
        const seedEl = document.getElementById('seed-display');
        if (seedEl) seedEl.textContent = seed;
    }

    updateCombatModeDisplay() {
        const el = document.getElementById('combat-mode-display');
        if (el) el.textContent = this.game.combatSystem.isTurnBased() ? '回合制' : '即时制';
    }

    updateSkillBar(player) {
        const skills = player.skillSystem.getAvailableSkills(player.level);
        for (let i = 0; i < 4; i++) {
            const btn = document.getElementById(`skill-btn-${i + 1}`);
            if (!btn) continue;
            if (i < skills.length) {
                const skill = skills[i];
                const canUse = player.skillSystem.canUseSkill(skill.id, player.mp);
                const cooldown = player.skillSystem.cooldowns[skill.id] || 0;
                btn.textContent = skill.name.substring(0, 2);
                btn.title = `${skill.name}: ${skill.desc} (MP:${skill.mpCost}${cooldown > 0 ? ' CD:' + cooldown : ''}) [${i + 1}]`;
                btn.disabled = !canUse;
                btn.style.opacity = canUse ? '1' : '0.4';
            } else {
                btn.textContent = '-';
                btn.disabled = true;
                btn.style.opacity = '0.2';
            }
        }
    }

    showMessage(text, duration = 2000) {
        const messageBox = document.getElementById('message-box');
        if (messageBox) {
            messageBox.textContent = text;
            messageBox.classList.remove('hidden');
            if (this.messageTimeout) clearTimeout(this.messageTimeout);
            this.messageTimeout = setTimeout(() => { messageBox.classList.add('hidden'); }, duration);
        }
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(screenId);
        if (target) target.classList.add('active');
    }

    showPanel(panelName) {
        this.hideAllPanels();
        const panel = document.getElementById(`${panelName}-panel`);
        if (panel) {
            panel.classList.remove('hidden');
            if (panelName === 'inventory') this.renderInventoryPanel();
            else if (panelName === 'equipment') this.renderEquipmentPanel();
            else if (panelName === 'skills') this.renderSkillsPanel();
        }
    }

    hideAllPanels() {
        ['inventory', 'equipment', 'skills'].forEach(name => {
            const panel = document.getElementById(`${name}-panel`);
            if (panel) panel.classList.add('hidden');
        });
    }

    renderInventoryPanel() {
        const container = document.getElementById('inventory-list');
        if (!container || !this.game.player) return;
        container.innerHTML = '';
        const inv = this.game.player.inventorySystem;
        if (inv.items.length === 0) {
            container.innerHTML = '<p style="font-size:10px;color:#888;padding:10px;">背包为空</p>';
            return;
        }
        inv.items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'inv-item';
            const color = item.rarity ? RarityColors[item.rarity] : item.icon === '🧪' ? '#dc143c' : item.icon === '💧' ? '#4169e1' : item.icon === '📜' ? '#daa520' : '#aaa';
            div.innerHTML = `<span style="color:${color}">${item.icon || '?'} ${item.name}</span><span class="inv-desc">${item.desc || ''}</span>`;
            div.addEventListener('click', () => {
                const result = inv.useItem(item.uid, this.game.player, this.game);
                if (result) {
                    this.game.uiManager.showMessage(result.message);
                    this.game.uiManager.updateHUD(this.game.player);
                    this.renderInventoryPanel();
                }
            });
            container.appendChild(div);
        });
    }

    renderEquipmentPanel() {
        if (!this.game.player) return;
        const eq = this.game.player.equipmentSystem;
        const slots = ['weapon', 'armor', 'accessory'];
        const slotNames = { weapon: '武器', armor: '防具', accessory: '饰品' };
        slots.forEach(slot => {
            const el = document.getElementById(`eq-${slot}`);
            if (!el) return;
            const item = eq.equipped[slot];
            if (item) {
                const color = RarityColors[item.rarity] || '#fff';
                el.innerHTML = `<span style="color:${color}">${item.name}</span><br><span style="font-size:8px;color:#aaa;">ATK+${item.attack} DEF+${item.defense}${item.mp ? ' MP+' + item.mp : ''}</span>`;
                el.className = 'eq-slot equipped';
                el.onclick = () => {
                    const old = eq.unequip(slot);
                    if (old) {
                        this.game.player.inventorySystem.addItem(old);
                        this.game.player._recalcStats();
                        this.game.player.hp = Math.min(this.game.player.hp, this.game.player.maxHp);
                        this.game.player.mp = Math.min(this.game.player.mp, this.game.player.maxMp);
                        this.game.uiManager.showMessage(`卸下 ${old.name}`);
                        this.game.uiManager.updateHUD(this.game.player);
                        this.renderEquipmentPanel();
                    }
                };
            } else {
                el.textContent = `${slotNames[slot]}: 空`;
                el.className = 'eq-slot empty';
                el.onclick = () => {
                    const items = this.game.player.inventorySystem.getItemsByType(slot === 'accessory' ? 'accessory' : slot);
                    if (items.length > 0) {
                        const toEquip = items[0];
                        const old = eq.equip(toEquip);
                        this.game.player.inventorySystem.removeItem(toEquip.uid);
                        if (old) this.game.player.inventorySystem.addItem(old);
                        this.game.player._recalcStats();
                        this.game.player.hp = Math.min(this.game.player.hp, this.game.player.maxHp);
                        this.game.player.mp = Math.min(this.game.player.mp, this.game.player.maxMp);
                        this.game.uiManager.showMessage(`装备 ${toEquip.name}`);
                        this.game.uiManager.updateHUD(this.game.player);
                        this.renderEquipmentPanel();
                    }
                };
            }
        });
    }

    renderSkillsPanel() {
        const container = document.getElementById('skills-list');
        if (!container || !this.game.player) return;
        container.innerHTML = '';
        const skills = this.game.player.classData.skills;
        skills.forEach(skill => {
            const div = document.createElement('div');
            const unlocked = this.game.player.level >= skill.unlockLevel;
            const cd = this.game.player.skillSystem.cooldowns[skill.id] || 0;
            div.className = unlocked ? 'skill-item' : 'skill-item locked';
            div.innerHTML = `<span class="skill-name">${skill.name}${!unlocked ? ' (Lv.' + skill.unlockLevel + ')' : ''}</span>
                <span class="skill-desc">${skill.desc} | MP:${skill.mpCost}${cd > 0 ? ' | CD:' + cd : ''}</span>`;
            container.appendChild(div);
        });
    }

    showGameOver(victory, stats) {
        const title = document.getElementById('gameover-title');
        if (title) {
            title.textContent = victory ? '胜利！' : '失败...';
            title.classList.remove('victory', 'defeat');
            title.classList.add(victory ? 'victory' : 'defeat');
        }
        const els = {
            'final-level': stats.level,
            'final-gold': stats.gold,
            'final-kills': stats.kills,
            'final-rooms': stats.rooms,
            'final-floor': stats.floor || '-',
            'final-seed': stats.seed || '-',
            'final-class': stats.classId ? ClassData[stats.classId].name : '-'
        };
        for (const [id, val] of Object.entries(els)) {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        }
        this.showScreen('gameover-screen');
    }

    updateClassSelect(classId) {
        document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
        const card = document.getElementById(`class-${classId}`);
        if (card) card.classList.add('selected');
        const btn = document.getElementById('confirm-class-btn');
        if (btn) btn.disabled = false;
    }

    setupMenuButtons(onStart, onRestart, onMenu) {
        const startBtn = document.getElementById('start-btn');
        if (startBtn) startBtn.addEventListener('click', onStart);
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) restartBtn.addEventListener('click', onRestart);
        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) menuBtn.addEventListener('click', onMenu);
        const helpBtn = document.getElementById('help-btn');
        const helpPanel = document.getElementById('help-panel');
        const closeHelp = document.getElementById('close-help');
        if (helpBtn && helpPanel) helpBtn.addEventListener('click', () => helpPanel.classList.toggle('hidden'));
        if (closeHelp && helpPanel) closeHelp.addEventListener('click', () => helpPanel.classList.add('hidden'));
    }

    setupClassButtons(onSelect) {
        document.querySelectorAll('.class-card').forEach(card => {
            card.addEventListener('click', () => onSelect(card.dataset.class));
        });
    }
}
