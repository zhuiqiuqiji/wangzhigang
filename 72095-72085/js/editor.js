class BulletEditor {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.game = game;
        this.bullets = [];
        this.particles = new ParticleSystem();
        this.starField = new StarField(canvas);
        this.previewFireTimer = 0;
        this.isAutoPreview = false;
        this.testModeActive = false;
        this.testModeConfig = null;
        this.lastTestFireTime = 0;
        this.testEnemy = null;
        this.animationId = null;
        this.lastTime = 0;

        this.patterns = [
            'circle', 'spread', 'spiral', 'aimed', 'ring', 'wave',
            'random', 'cross', 'doubleCircle', 'flower', 'laser', 'zigzag', 'heart'
        ];

        this.currentConfig = {
            pattern: 'circle',
            bulletCount: 12,
            bulletSpeed: 4,
            spreadAngle: Math.PI,
            fireRate: 500,
            color: '#ff4444'
        };
    }

    init() {
        this.setupControls();
        this.bindEvents();
        this.refreshSavedPatterns();
        this.startAnimationLoop();
    }

    setupControls() {
        this.patternSelect = document.getElementById('patternSelect');
        this.bulletCountSlider = document.getElementById('bulletCount');
        this.bulletCountVal = document.getElementById('bulletCountVal');
        this.bulletSpeedSlider = document.getElementById('bulletSpeed');
        this.bulletSpeedVal = document.getElementById('bulletSpeedVal');
        this.spreadAngleSlider = document.getElementById('spreadAngle');
        this.spreadAngleVal = document.getElementById('spreadAngleVal');
        this.fireRateSlider = document.getElementById('fireRate');
        this.fireRateVal = document.getElementById('fireRateVal');
        this.bulletColorInput = document.getElementById('bulletColor');
        this.patternNameInput = document.getElementById('patternName');
        this.savedPatternsList = document.getElementById('savedPatternsList');
        this.previewBtn = document.getElementById('previewPatternBtn');
        this.saveBtn = document.getElementById('savePatternBtn');
        this.testBtn = document.getElementById('testPatternBtn');
        this.exportBtn = document.getElementById('exportPatternBtn');
        this.editorScreen = document.getElementById('editorScreen');
        this.editorCanvas = document.getElementById('editorCanvas');
    }

    bindEvents() {
        this.patternSelect.addEventListener('change', (e) => {
            this.currentConfig.pattern = e.target.value;
            this.firePreviewBullets();
        });

        this.bulletCountSlider.addEventListener('input', (e) => {
            this.currentConfig.bulletCount = parseInt(e.target.value);
            this.bulletCountVal.textContent = e.target.value;
        });

        this.bulletSpeedSlider.addEventListener('input', (e) => {
            this.currentConfig.bulletSpeed = parseInt(e.target.value);
            this.bulletSpeedVal.textContent = e.target.value;
        });

        this.spreadAngleSlider.addEventListener('input', (e) => {
            this.currentConfig.spreadAngle = (parseInt(e.target.value) * Math.PI) / 180;
            this.spreadAngleVal.textContent = e.target.value;
        });

        this.fireRateSlider.addEventListener('input', (e) => {
            this.currentConfig.fireRate = parseInt(e.target.value);
            this.fireRateVal.textContent = e.target.value;
        });

        this.bulletColorInput.addEventListener('input', (e) => {
            this.currentConfig.color = e.target.value;
        });

        this.previewBtn.addEventListener('click', () => {
            this.isAutoPreview = !this.isAutoPreview;
            this.previewBtn.textContent = this.isAutoPreview ? '停止预览' : '预览';
            if (this.isAutoPreview) {
                this.firePreviewBullets();
            }
        });

        this.saveBtn.addEventListener('click', () => {
            this.saveCurrentPattern();
        });

        this.testBtn.addEventListener('click', () => {
            this.startTestMode();
        });

        this.exportBtn.addEventListener('click', () => {
            this.exportPattern();
        });

        this.editorCanvas.addEventListener('click', (e) => {
            const rect = this.editorCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.firePreviewBulletsAt(x, y);
        });

        document.getElementById('backToMenuFromEditorBtn').addEventListener('click', () => {
            this.isAutoPreview = false;
            this.previewBtn.textContent = '预览';
        });
    }

    getCurrentConfig() {
        return {
            id: 'pattern_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: this.patternNameInput.value.trim() || '未命名弹幕',
            pattern: this.currentConfig.pattern,
            bulletCount: this.currentConfig.bulletCount,
            bulletSpeed: this.currentConfig.bulletSpeed,
            spreadAngle: this.currentConfig.spreadAngle,
            fireRate: this.currentConfig.fireRate,
            color: this.currentConfig.color,
            createdAt: Date.now()
        };
    }

    loadConfig(config) {
        this.currentConfig.pattern = config.pattern;
        this.currentConfig.bulletCount = config.bulletCount;
        this.currentConfig.bulletSpeed = config.bulletSpeed;
        this.currentConfig.spreadAngle = config.spreadAngle;
        this.currentConfig.fireRate = config.fireRate;
        this.currentConfig.color = config.color;

        this.patternSelect.value = config.pattern;
        this.bulletCountSlider.value = config.bulletCount;
        this.bulletCountVal.textContent = config.bulletCount;
        this.bulletSpeedSlider.value = config.bulletSpeed;
        this.bulletSpeedVal.textContent = config.bulletSpeed;
        const angleDeg = Math.round((config.spreadAngle * 180) / Math.PI);
        this.spreadAngleSlider.value = angleDeg;
        this.spreadAngleVal.textContent = angleDeg;
        this.fireRateSlider.value = config.fireRate;
        this.fireRateVal.textContent = config.fireRate;
        this.bulletColorInput.value = config.color;
        this.patternNameInput.value = config.name;

        this.firePreviewBullets();
    }

    saveCurrentPattern() {
        const config = this.getCurrentConfig();
        const saved = this.getSavedPatterns();
        saved.push(config);
        localStorage.setItem('bulletPatterns', JSON.stringify(saved));
        this.refreshSavedPatterns();
        this.showNotification('弹幕已保存!');
    }

    deletePattern(id) {
        if (!confirm('确定要删除这个弹幕配置吗？')) return;
        let saved = this.getSavedPatterns();
        saved = saved.filter(p => p.id !== id);
        localStorage.setItem('bulletPatterns', JSON.stringify(saved));
        this.refreshSavedPatterns();
        this.showNotification('弹幕已删除');
    }

    exportPattern() {
        const config = this.getCurrentConfig();
        delete config.id;
        delete config.createdAt;
        const jsonStr = JSON.stringify(config, null, 2);
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>导出弹幕配置</h3>
                <textarea readonly class="export-textarea">${jsonStr}</textarea>
                <div class="modal-buttons">
                    <button class="neon-btn" id="copyExportBtn">复制</button>
                    <button class="neon-btn secondary" id="closeExportBtn">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#copyExportBtn').addEventListener('click', () => {
            modal.querySelector('.export-textarea').select();
            document.execCommand('copy');
            this.showNotification('已复制到剪贴板!');
        });

        modal.querySelector('#closeExportBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    getSavedPatterns() {
        const saved = localStorage.getItem('bulletPatterns');
        return saved ? JSON.parse(saved) : [];
    }

    refreshSavedPatterns() {
        const patterns = this.getSavedPatterns();
        this.savedPatternsList.innerHTML = '';

        if (patterns.length === 0) {
            this.savedPatternsList.innerHTML = '<div class="no-patterns">暂无保存的弹幕</div>';
            return;
        }

        patterns.forEach(pattern => {
            const item = document.createElement('div');
            item.className = 'pattern-item';
            item.innerHTML = `
                <div class="pattern-info">
                    <div class="pattern-color" style="background: ${pattern.color}"></div>
                    <div class="pattern-details">
                        <div class="pattern-name">${pattern.name}</div>
                        <div class="pattern-meta">${this.getPatternLabel(pattern.pattern)} | ${pattern.bulletCount}发</div>
                    </div>
                </div>
                <div class="pattern-actions">
                    <button class="load-btn" title="加载">📥</button>
                    <button class="delete-btn" title="删除">🗑️</button>
                </div>
            `;

            item.querySelector('.load-btn').addEventListener('click', () => {
                this.loadConfig(pattern);
            });

            item.querySelector('.delete-btn').addEventListener('click', () => {
                this.deletePattern(pattern.id);
            });

            this.savedPatternsList.appendChild(item);
        });
    }

    getPatternLabel(pattern) {
        const labels = {
            circle: '圆形扩散',
            spread: '扇形散射',
            spiral: '螺旋弹幕',
            aimed: '追踪弹',
            ring: '环形弹幕',
            wave: '波浪弹幕',
            random: '随机散射',
            cross: '十字弹幕',
            doubleCircle: '双层圆环',
            flower: '花瓣弹幕',
            laser: '激光射线',
            zigzag: '锯齿弹幕',
            heart: '爱心弹幕'
        };
        return labels[pattern] || pattern;
    }

    firePreviewBullets() {
        this.firePreviewBulletsAt(this.canvas.width / 2, this.canvas.height / 3);
    }

    hexToRgba(hex, alpha = 0.5) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})` : `rgba(255, 68, 68, ${alpha})`;
    }

    firePreviewBulletsAt(x, y) {
        const config = this.currentConfig;
        const glowColor = this.hexToRgba(config.color, 0.5);

        const bulletConfig = {
            type: config.pattern,
            x: x,
            y: y,
            count: config.bulletCount,
            speed: config.bulletSpeed,
            angle: Math.PI / 2,
            spreadAngle: config.spreadAngle,
            color: config.color,
            glowColor: glowColor,
            radius: 6,
            waveAmplitude: config.pattern === 'wave' || config.pattern === 'zigzag' ? 3 : 0,
            waveFrequency: 2,
            targetX: this.testModeActive && this.game && this.game.player ? this.game.player.x : x,
            targetY: this.testModeActive && this.game && this.game.player ? this.game.player.y : y + 200,
            homingStrength: config.pattern === 'aimed' || config.pattern === 'homing' ? 2 : 0,
            rotation: 0,
            size: config.pattern === 'laser' ? 0.8 : 1
        };

        const newBullets = BulletPattern.create(bulletConfig);
        this.bullets.push(...newBullets);

        this.particles.emit(x, y, config.color, 15, 3, 20, 3);
    }

    startTestMode() {
        if (!this.game) {
            this.showNotification('无法进入测试模式');
            return;
        }

        this.testModeActive = true;
        this.testModeConfig = this.getCurrentConfig();
        this.lastTestFireTime = 0;
        this.editorScreen.classList.add('hidden');
        
        this.game.state = 'playing';
        this.game.startTime = Date.now();
        this.game.player.reset();
        this.game.enemyManager.reset();
        this.game.bulletManager.reset();
        this.game.itemManager.clear();
        this.game.particles.clear();
        this.game.hideAllScreens();
        this.game.updateHUD();

        this.testEnemy = {
            x: this.game.canvas.width / 2,
            y: 100,
            active: true,
            lastFireTime: 0
        };

        this.showNotification('测试模式已启动，按 ESC 退出');

        this.originalGameUpdate = this.game.update.bind(this.game);
        this.game.update = () => {
            if (this.testModeActive) {
                const currentTime = Date.now();
                this.game.elapsedTime = currentTime - this.game.startTime;
                this.game.score += 10 * (this.game.deltaTime / 1000);

                this.game.handleInput();
                this.game.player.update(this.game.deltaTime, this.game.particles);

                if (this.game.player.isShooting) {
                    const bullets = this.game.player.shoot(currentTime);
                    this.game.bulletManager.addPlayerBullets(bullets);
                }

                if (currentTime - this.testEnemy.lastFireTime > this.testModeConfig.fireRate) {
                    this.testEnemy.lastFireTime = currentTime;
                    const glowColor = this.hexToRgba(this.testModeConfig.color, 0.5);

                    const bulletConfig = {
                        type: this.testModeConfig.pattern,
                        x: this.testEnemy.x,
                        y: this.testEnemy.y,
                        count: this.testModeConfig.bulletCount,
                        speed: this.testModeConfig.bulletSpeed,
                        angle: Math.PI / 2,
                        spreadAngle: this.testModeConfig.spreadAngle,
                        color: this.testModeConfig.color,
                        glowColor: glowColor,
                        radius: 6,
                        waveAmplitude: this.testModeConfig.pattern === 'wave' || this.testModeConfig.pattern === 'zigzag' ? 3 : 0,
                        waveFrequency: 2,
                        targetX: this.game.player.x,
                        targetY: this.game.player.y,
                        homingStrength: this.testModeConfig.pattern === 'aimed' ? 2 : 0,
                        rotation: 0,
                        size: this.testModeConfig.pattern === 'laser' ? 0.8 : 1
                    };

                    const bullets = BulletPattern.create(bulletConfig);
                    this.game.bulletManager.addEnemyBullets(bullets);
                }

                this.game.bulletManager.update(this.game.canvas, this.game.player);

                const playerHit = this.game.bulletManager.checkEnemyBulletCollision(this.game.player, this.game.particles);
                if (playerHit) {
                    this.game.screenShake = 15;
                    this.game.flashColor = '#ff0000';
                    this.game.flashAlpha = 0.3;

                    if (this.game.player.lives <= 0) {
                        this.exitTestMode();
                        return;
                    }
                }

                this.game.itemManager.update(this.game.player, this.game.canvas);
                this.game.particles.update();
                this.game.starField.update();

                if (this.game.screenShake > 0) this.game.screenShake *= 0.9;
                if (this.game.flashAlpha > 0) this.game.flashAlpha *= 0.9;

                this.game.updateHUD();
            } else {
                this.originalGameUpdate();
            }
        };

        const testKeyHandler = (e) => {
            if (e.code === 'Escape' && this.testModeActive) {
                e.preventDefault();
                this.exitTestMode();
            }
        };
        window.addEventListener('keydown', testKeyHandler);
        this.testKeyHandler = testKeyHandler;
    }

    exitTestMode() {
        this.testModeActive = false;
        this.testModeConfig = null;
        this.testEnemy = null;

        if (this.testKeyHandler) {
            window.removeEventListener('keydown', this.testKeyHandler);
            this.testKeyHandler = null;
        }

        if (this.originalGameUpdate) {
            this.game.update = this.originalGameUpdate;
            this.originalGameUpdate = null;
        }

        this.game.state = 'menu';
        this.editorScreen.classList.remove('hidden');
        this.showNotification('已退出测试模式');
    }

    startAnimationLoop() {
        const loop = (timestamp) => {
            const deltaTime = timestamp - this.lastTime;
            this.lastTime = timestamp;

            this.update(deltaTime);
            this.draw();

            this.animationId = requestAnimationFrame(loop);
        };
        this.animationId = requestAnimationFrame(loop);
    }

    update(deltaTime) {
        if (this.editorScreen.classList.contains('hidden')) {
            return;
        }

        this.starField.update();
        this.particles.update();

        this.bullets.forEach(bullet => {
            bullet.update(this.canvas);
        });
        this.bullets = this.bullets.filter(b => b.active);

        if (this.isAutoPreview) {
            this.previewFireTimer += deltaTime;
            if (this.previewFireTimer >= this.currentConfig.fireRate) {
                this.previewFireTimer = 0;
                this.firePreviewBullets();
            }
        }
    }

    draw() {
        if (this.editorScreen.classList.contains('hidden')) {
            return;
        }

        this.ctx.fillStyle = '#0a0a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.starField.draw(this.ctx);

        this.bullets.forEach(bullet => {
            bullet.draw(this.ctx);
        });

        this.particles.draw(this.ctx);

        const emitterX = this.canvas.width / 2;
        const emitterY = this.canvas.height / 3;
        Utils.drawGlow(this.ctx, emitterX, emitterY, 20, 'rgba(255, 68, 68, 0.3)');
        this.ctx.fillStyle = '#ff4444';
        this.ctx.beginPath();
        this.ctx.arc(emitterX, emitterY, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'editor-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 255, 255, 0.9);
            color: #000;
            padding: 12px 24px;
            border-radius: 8px;
            font-family: 'Noto Sans SC', sans-serif;
            font-weight: bold;
            z-index: 1000;
            animation: slideDown 0.3s ease-out;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
    }
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    }
    .modal-content {
        background: #1a1a3a;
        border: 2px solid #00ffff;
        border-radius: 12px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
    }
    .modal-content h3 {
        color: #00ffff;
        margin-bottom: 16px;
        font-family: 'Noto Sans SC', sans-serif;
        text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    }
    .export-textarea {
        width: 100%;
        height: 200px;
        background: #0a0a1a;
        color: #00ff00;
        border: 1px solid #00ffff;
        border-radius: 8px;
        padding: 12px;
        font-family: 'Consolas', monospace;
        font-size: 12px;
        resize: none;
        margin-bottom: 16px;
    }
    .export-textarea:focus {
        outline: none;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
    }
    .modal-buttons {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
    }
    .patterns-list {
        max-height: 200px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .pattern-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(0, 255, 255, 0.1);
        border: 1px solid rgba(0, 255, 255, 0.3);
        border-radius: 8px;
        padding: 8px 12px;
        transition: all 0.2s;
    }
    .pattern-item:hover {
        background: rgba(0, 255, 255, 0.2);
        border-color: rgba(0, 255, 255, 0.5);
    }
    .pattern-info {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .pattern-color {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid #fff;
        box-shadow: 0 0 10px currentColor;
    }
    .pattern-name {
        color: #ffffff;
        font-size: 13px;
        font-weight: bold;
    }
    .pattern-meta {
        color: #888;
        font-size: 11px;
    }
    .pattern-actions {
        display: flex;
        gap: 4px;
    }
    .pattern-actions button {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 14px;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s;
    }
    .pattern-actions button:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    .load-btn:hover {
        color: #00ff00;
    }
    .delete-btn:hover {
        color: #ff4444;
    }
    .no-patterns {
        color: #666;
        text-align: center;
        padding: 20px;
        font-size: 12px;
    }
    .saved-patterns h3 {
        color: #00ffff;
        font-size: 13px;
        margin-bottom: 8px;
        font-family: 'Noto Sans SC', sans-serif;
    }
`;
document.head.appendChild(style);

window.addEventListener('load', () => {
    const editorCanvas = document.getElementById('editorCanvas');
    const game = window.gameInstance;
    window.bulletEditor = new BulletEditor(editorCanvas, game);
    window.bulletEditor.init();

    const editorBtn = document.getElementById('editorBtn');
    const editorScreen = document.getElementById('editorScreen');
    const startScreen = document.getElementById('startScreen');

    if (editorBtn && editorScreen) {
        editorBtn.addEventListener('click', () => {
            startScreen.classList.add('hidden');
            editorScreen.classList.remove('hidden');
            window.bulletEditor.isAutoPreview = false;
            window.bulletEditor.previewBtn.textContent = '预览';
        });
    }

    const backBtn = document.getElementById('backToMenuFromEditorBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            editorScreen.classList.add('hidden');
            startScreen.classList.remove('hidden');
            window.bulletEditor.isAutoPreview = false;
            window.bulletEditor.previewBtn.textContent = '预览';
        });
    }
});
