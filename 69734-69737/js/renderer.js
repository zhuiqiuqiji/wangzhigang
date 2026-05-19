class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.scorePopups = [];
        this.comboPopups = [];
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
    }

    clear() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, Math.max(this.width, this.height) / 1.5
        );
        gradient.addColorStop(0, '#16213e');
        gradient.addColorStop(1, '#0f0f23');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawBackground() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;

        const gridSize = 50;
        for (let x = 0; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    drawParticles(particles) {
        particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            if (p.type === 'sparkle') {
                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.life * 0.1);
                this.ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    const angle = (i * Math.PI) / 2;
                    const r = i % 2 === 0 ? p.radius * alpha : p.radius * 0.4 * alpha;
                    this.ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
                }
                this.ctx.closePath();
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = alpha;
                this.ctx.fill();
                this.ctx.restore();
            } else if (p.type === 'juice') {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = alpha * 0.9;
                this.ctx.fill();

                this.ctx.beginPath();
                this.ctx.arc(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.3 * alpha, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                this.ctx.globalAlpha = alpha * 0.5;
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
            } else {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = alpha;
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
            }
        });
    }

    updateParticles(particles) {
        particles.forEach(p => {
            const gravity = p.gravity !== undefined ? p.gravity : 0.15;
            p.vy += gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.99;
            p.life--;
        });
        return particles.filter(p => p.life > 0);
    }

    addScorePopup(x, y, score) {
        this.scorePopups.push({
            x, y,
            score,
            life: 60,
            maxLife: 60,
            vy: -2
        });
    }

    addComboPopup(x, y, count, totalCombo) {
        this.comboPopups.push({
            x, y,
            count,
            totalCombo,
            life: 50,
            maxLife: 50,
            vy: -1.5
        });
    }

    addEffectPopup(x, y, text) {
        this.scorePopups.push({
            x, y,
            score: text,
            isText: true,
            life: 80,
            maxLife: 80,
            vy: -1.2
        });
    }

    updateScorePopups() {
        this.scorePopups.forEach(popup => {
            popup.y += popup.vy;
            popup.life--;
        });
        this.scorePopups = this.scorePopups.filter(popup => popup.life > 0);

        this.comboPopups.forEach(popup => {
            popup.y += popup.vy;
            popup.life--;
        });
        this.comboPopups = this.comboPopups.filter(popup => popup.life > 0);
    }

    clearPopups() {
        this.scorePopups = [];
        this.comboPopups = [];
    }

    drawScorePopups() {
        this.scorePopups.forEach(popup => {
            const alpha = popup.life / popup.maxLife;
            this.ctx.save();
            if (popup.isText) {
                this.ctx.font = 'bold 24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                this.ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
                this.ctx.lineWidth = 4;
                this.ctx.strokeText(popup.score, popup.x, popup.y);
                this.ctx.fillText(popup.score, popup.x, popup.y);
            } else {
                this.ctx.font = 'bold 28px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
                this.ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
                this.ctx.lineWidth = 3;
                this.ctx.strokeText(`+${popup.score}`, popup.x, popup.y);
                this.ctx.fillText(`+${popup.score}`, popup.x, popup.y);
            }
            this.ctx.restore();
        });

        this.comboPopups.forEach(popup => {
            const alpha = popup.life / popup.maxLife;
            const scale = 1 + (1 - alpha) * 0.3;
            this.ctx.save();
            this.ctx.translate(popup.x, popup.y);
            this.ctx.scale(scale, scale);
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = `rgba(255, 100, 100, ${alpha})`;
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.lineWidth = 4;
            this.ctx.strokeText(`${popup.count}连击!`, 0, 0);
            this.ctx.fillText(`${popup.count}连击!`, 0, 0);

            if (popup.totalCombo >= 5) {
                this.ctx.font = 'bold 20px Arial';
                this.ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
                this.ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
                this.ctx.lineWidth = 2;
                this.ctx.strokeText(`总连击: ${popup.totalCombo}`, 0, 30);
                this.ctx.fillText(`总连击: ${popup.totalCombo}`, 0, 30);
            }
            this.ctx.restore();
        });
    }

    drawUI(score, highScore, missedCount, maxMissed, combo, gameMode, timeLeft, scoreMultiplier) {
        this.ctx.save();

        const barHeight = 70;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.width, barHeight);

        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(`得分: ${score}`, 20, 45);

        if (gameMode === 'timed') {
            this.ctx.font = 'bold 28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = timeLeft <= 10 ? '#e74c3c' : '#f39c12';
            this.ctx.fillText(`⏱️ ${timeLeft}s`, this.width / 2, 48);
        } else {
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            const hearts = '❤️'.repeat(Math.max(0, maxMissed - missedCount)) + '🖤'.repeat(Math.min(missedCount, maxMissed));
            this.ctx.fillText(hearts, this.width / 2, 48);
        }

        if (combo >= 2) {
            this.ctx.font = 'bold 22px Arial';
            this.ctx.fillStyle = '#ff6b6b';
            this.ctx.fillText(`🔥 ${combo}连击`, this.width / 2, 95);
        }

        if (scoreMultiplier > 1) {
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillText(`✨ ${scoreMultiplier}x`, this.width / 2, 120);
        }

        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = '#4ecdc4';
        const modeText = gameMode === 'timed' ? '限时模式' : gameMode === 'endless' ? '无尽模式' : '经典模式';
        this.ctx.fillText(modeText, this.width - 20, 28);

        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillText(`最高分: ${highScore}`, this.width - 20, 55);

        this.ctx.restore();
    }

    drawStartScreen(highScore) {
        this.ctx.save();

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const centerX = this.width / 2;
        const centerY = this.height / 2;

        this.ctx.font = 'bold 72px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText('切 水 果', centerX, centerY - 150);
        this.ctx.fillText('切 水 果', centerX, centerY - 150);

        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('选择游戏模式', centerX, centerY - 80);

        const buttonWidth = 250;
        const buttonHeight = 70;
        const buttonY = centerY - 20;

        this.drawModeButton(centerX, buttonY - 100, buttonWidth, buttonHeight, '🎮 经典模式', '#4ecdc4');
        this.drawModeButton(centerX, buttonY, buttonWidth, buttonHeight, '⏱️ 限时模式', '#f39c12');
        this.drawModeButton(centerX, buttonY + 100, buttonWidth, buttonHeight, '♾️ 无尽模式', '#e74c3c');

        if (highScore > 0) {
            this.ctx.font = '20px Arial';
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillText(`历史最高分: ${highScore}`, centerX, centerY + 200);
        }

        this.ctx.restore();
    }

    drawModeButton(x, y, width, height, text, color) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.roundRect(x - width / 2, y, width, height, 15);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        this.ctx.font = 'bold 26px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(text, x, y + height / 2);
        this.ctx.restore();
    }

    drawGameOverScreen(score, highScore, isNewRecord, missedCount, maxCombo) {
        this.ctx.save();

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const centerX = this.width / 2;
        const centerY = this.height / 2;

        this.ctx.font = 'bold 64px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText('游戏结束', centerX, centerY - 100);
        this.ctx.fillText('游戏结束', centerX, centerY - 100);

        this.ctx.font = 'bold 36px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(`本局得分: ${score}`, centerX, centerY - 20);

        if (maxCombo > 0) {
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillStyle = '#ff6b6b';
            this.ctx.fillText(`最大连击: ${maxCombo}`, centerX, centerY + 20);
        }

        if (isNewRecord) {
            this.ctx.font = 'bold 28px Arial';
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillText('🎉 新纪录！🎉', centerX, centerY + 60);
        }

        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillText(`历史最高分: ${highScore}`, centerX, centerY + 105);

        this.ctx.font = 'bold 26px Arial';
        this.ctx.fillStyle = '#4ecdc4';
        this.ctx.fillText('点击屏幕重新开始', centerX, centerY + 160);

        this.ctx.restore();
    }

    render(gameState, inputManager, fruitManager, bombManager, particles) {
        this.clear();
        this.drawBackground();

        fruitManager.draw(this.ctx);
        bombManager.draw(this.ctx);
        this.drawParticles(particles);
        inputManager.drawTrail(this.ctx);
        this.drawScorePopups();
        this.drawUI(gameState.score, gameState.highScore, gameState.missedCount, gameState.maxMissed, gameState.combo, gameState.gameMode, gameState.timeLeft, gameState.scoreMultiplier);

        if (!gameState.isPlaying && !gameState.isGameOver) {
            this.drawStartScreen(gameState.highScore);
        }

        if (gameState.isGameOver) {
            this.drawGameOverScreen(gameState.score, gameState.highScore, gameState.isNewRecord, gameState.missedCount, gameState.maxCombo);
        }
    }
}
