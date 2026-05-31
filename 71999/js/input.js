class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = {};
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.setupKeyboardListeners();
        this.setupTouchListeners();
        this.setupMobileControls();
        this.setupSkillButtons();
    }

    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;
            if (this.game.gameState === 'playing') {
                this.handleKeyPress(e.key.toLowerCase());
            }
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });
    }

    handleKeyPress(key) {
        let dx = 0, dy = 0;
        switch (key) {
            case 'arrowup': case 'w': dy = -1; break;
            case 'arrowdown': case 's': dy = 1; break;
            case 'arrowleft': case 'a': dx = -1; break;
            case 'arrowright': case 'd': dx = 1; break;
            case ' ': case 'j': this.game.playerAttack(); return;
            case 'escape': this.game.togglePause(); return;
            case 'i': case 'b': this.game.togglePanel('inventory'); return;
            case 'e': this.game.togglePanel('equipment'); return;
            case 'k': this.game.togglePanel('skills'); return;
            case 't': this.game.toggleCombatMode(); return;
            case '1': this.game.useSkill(0); return;
            case '2': this.game.useSkill(1); return;
            case '3': this.game.useSkill(2); return;
            case '4': this.game.useSkill(3); return;
        }
        if (dx !== 0 || dy !== 0) this.game.tryMovePlayer(dx, dy);
    }

    setupTouchListeners() {
        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
        });
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const dx = touch.clientX - this.touchStartX;
            const dy = touch.clientY - this.touchStartY;
            if (Math.abs(dx) < 30 && Math.abs(dy) < 30) {
                this.game.playerAttack();
            } else if (Math.abs(dx) > Math.abs(dy)) {
                this.game.tryMovePlayer(dx > 0 ? 1 : -1, 0);
            } else {
                this.game.tryMovePlayer(0, dy > 0 ? 1 : -1);
            }
        });
    }

    setupMobileControls() {
        document.querySelectorAll('.d-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const dir = btn.dataset.dir;
                switch (dir) {
                    case 'up': this.game.tryMovePlayer(0, -1); break;
                    case 'down': this.game.tryMovePlayer(0, 1); break;
                    case 'left': this.game.tryMovePlayer(-1, 0); break;
                    case 'right': this.game.tryMovePlayer(1, 0); break;
                }
            });
        });
        const attackBtn = document.getElementById('attack-btn');
        if (attackBtn) attackBtn.addEventListener('click', (e) => { e.preventDefault(); this.game.playerAttack(); });
    }

    setupSkillButtons() {
        for (let i = 1; i <= 4; i++) {
            const btn = document.getElementById(`skill-btn-${i}`);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.game.useSkill(i - 1);
                });
            }
        }
    }

    isKeyPressed(key) { return this.keys[key.toLowerCase()] || this.keys[key] || false; }
}
