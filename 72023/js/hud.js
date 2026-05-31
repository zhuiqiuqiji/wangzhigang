class HUD {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }

    resize(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }

    render(ctx, gameState, players, oxygen, score, collected, required, level, mapName, boss) {
        if (players.length > 1) {
            this._renderCoopHUD(ctx, players, oxygen, score, collected, required, level, mapName, boss);
        } else {
            this._renderSinglePlayerHUD(ctx, players[0], oxygen, score, collected, required, level, mapName, boss);
        }
    }

    _renderSinglePlayerHUD(ctx, player, oxygen, score, collected, required, level, mapName, boss) {
        this._renderLives(ctx, player, 20, 25);
        this._renderOxygenBar(ctx, oxygen, 20, 75, 20, 120);
        this._renderScore(ctx, score, this.canvasWidth - 20, 25);
        this._renderProgress(ctx, collected, required, this.canvasWidth / 2 - 100, 18, 200, 14);
        this._renderLevelMap(ctx, level, mapName, 20, this.canvasHeight - 25);

        if (boss && boss.active) {
            boss.renderHealthBar(ctx, this.canvasWidth);
        }

        if (oxygen.isLow()) {
            this._renderOxygenWarning(ctx);
        }
    }

    _renderCoopHUD(ctx, players, oxygen, score, collected, required, level, mapName, boss) {
        this._renderLives(ctx, players[0], 20, 25, 'P1');
        if (players[1]) {
            this._renderLives(ctx, players[1], this.canvasWidth - 110, 25, 'P2');
        }
        this._renderOxygenBar(ctx, oxygen, this.canvasWidth / 2 - 15, 75, 30, 150);
        this._renderScore(ctx, score, this.canvasWidth / 2, 25, true);
        this._renderProgress(ctx, collected, required, this.canvasWidth / 2 - 100, 18, 200, 14);
        this._renderLevelMap(ctx, level, mapName, 20, this.canvasHeight - 25);

        if (boss && boss.active) {
            boss.renderHealthBar(ctx, this.canvasWidth);
        }

        if (oxygen.isLow()) {
            this._renderOxygenWarning(ctx);
        }
    }

    _renderLives(ctx, player, x, y, label = null) {
        const lives = player.alive ? 3 - (3 - player.invincibleTimer > 0 ? 0 : 0) : 0;
        const actualLives = this._getPlayerLives(player);

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this._roundRect(ctx, x - 5, y - 18, 100, 36, 18);
        ctx.fill();

        if (label) {
            ctx.fillStyle = player.color;
            ctx.font = 'bold 11px Nunito, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(label, x, y - 2);
        }

        for (let i = 0; i < 3; i++) {
            const hx = x + (label ? 30 : 10) + i * 22;
            const alive = i < actualLives && player.alive;
            if (alive) {
                this._renderHeart(ctx, hx, y, 10, '#ff4757', '#ff6b81');
            } else {
                this._renderHeart(ctx, hx, y, 10, '#3a3a4a', '#4a4a5a');
            }
        }
        ctx.restore();
    }

    _getPlayerLives(player) {
        if (!player.alive) return 0;
        return window.__playerLives ? window.__playerLives[player.id] || 3 : 3;
    }

    _renderHeart(ctx, x, y, size, color, highlight) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y + size * 0.3);
        ctx.bezierCurveTo(x, y - size * 0.3, x - size, y - size * 0.3, x - size, y + size * 0.1);
        ctx.bezierCurveTo(x - size, y + size * 0.6, x, y + size, x, y + size);
        ctx.bezierCurveTo(x, y + size, x + size, y + size * 0.6, x + size, y + size * 0.1);
        ctx.bezierCurveTo(x + size, y - size * 0.3, x, y - size * 0.3, x, y + size * 0.3);
        ctx.fill();

        ctx.fillStyle = highlight;
        ctx.beginPath();
        ctx.arc(x - size * 0.35, y + size * 0.1, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    _renderOxygenBar(ctx, oxygen, x, y, width, height) {
        oxygen.render(ctx, x, y, width, height);
    }

    _renderScore(ctx, score, x, y, centered = false) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this._roundRect(ctx, centered ? x - 65 : x - 130, y - 18, 130, 36, 18);
        ctx.fill();

        ctx.fillStyle = '#ffd93d';
        ctx.font = 'bold 14px Nunito, sans-serif';
        ctx.textAlign = centered ? 'center' : 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐ ' + score, centered ? x : x - 10, y);
        ctx.restore();
    }

    _renderProgress(ctx, collected, required, x, y, width, height) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this._roundRect(ctx, x - 8, y - 6, width + 16, height + 12, 14);
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this._roundRect(ctx, x, y, width, height, 7);
        ctx.fill();

        const progress = Math.min(collected / required, 1);
        const fillWidth = width * progress;

        if (fillWidth > 0) {
            const grad = ctx.createLinearGradient(x, y, x + fillWidth, y);
            grad.addColorStop(0, '#00e5ff');
            grad.addColorStop(0.5, '#00d4aa');
            grad.addColorStop(1, '#2ecc71');
            ctx.fillStyle = grad;
            this._roundRect(ctx, x, y, Math.max(fillWidth, height), height, 7);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this._roundRect(ctx, x + 2, y + 1, Math.max(fillWidth - 4, 0), height / 2 - 1, 4);
            ctx.fill();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${collected} / ${required}`, x + width / 2, y + height / 2 + 1);

        ctx.restore();
    }

    _renderLevelMap(ctx, level, mapName, x, y) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this._roundRect(ctx, x - 5, y - 12, 140, 24, 12);
        ctx.fill();

        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 13px Nunito, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`第 ${level} 关 · ${mapName}`, x + 5, y);
        ctx.restore();
    }

    _renderOxygenWarning(ctx) {
        const cx = this.canvasWidth / 2;
        const cy = this.canvasHeight * 0.85;

        ctx.save();
        const pulse = 0.3 + Math.sin(Date.now() / 150) * 0.2;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#ff4757';
        ctx.font = 'bold 24px Fredoka, Comic Sans MS, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff4757';
        ctx.shadowBlur = 10;
        ctx.fillText('⚠ 氧气不足！', cx, cy);
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    renderModeSelect(ctx, selectedMode, time) {
        const cx = this.canvasWidth / 2;
        const cy = this.canvasHeight / 2;

        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 15;
        ctx.font = 'bold 32px Fredoka, Comic Sans MS, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('选择模式', cx, cy - 120);
        ctx.shadowBlur = 0;

        const cardW = 180;
        const cardH = 200;
        const gap = 40;
        const startX = cx - cardW - gap / 2;

        for (let i = 0; i < 2; i++) {
            const x = startX + i * (cardW + gap);
            const y = cy - cardH / 2;
            const selected = (i === 0 && selectedMode === 'single') || (i === 1 && selectedMode === 'coop');

            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            if (selected) {
                ctx.shadowColor = '#00e5ff';
                ctx.shadowBlur = 20;
            }
            this._roundRect(ctx, x, y, cardW, cardH, 16);
            ctx.fill();

            ctx.strokeStyle = selected ? '#00e5ff' : 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = selected ? 3 : 1.5;
            ctx.stroke();
            ctx.shadowBlur = 0;

            const icon = i === 0 ? '👤' : '👥';
            const title = i === 0 ? '单人冒险' : '双人协作';
            const desc = i === 0 ? '独自探索海底世界' : '与朋友一起冒险';

            ctx.font = '48px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(icon, x + cardW / 2, y + 70);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px Nunito, sans-serif';
            ctx.fillText(title, x + cardW / 2, y + 125);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '12px Nunito, sans-serif';
            ctx.fillText(desc, x + cardW / 2, y + 155);

            ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
            ctx.font = '11px Nunito, sans-serif';
            if (i === 0) {
                ctx.fillText('方向键 / WASD', x + cardW / 2, y + 180);
            } else {
                ctx.fillText('P1: WASD  P2: 方向键', x + cardW / 2, y + 180);
            }
        }

        const pulse = 0.6 + Math.sin(time * 3) * 0.4;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 18px Nunito, sans-serif';
        ctx.fillText('按空格键或点击确认', cx, cy + 140);
        ctx.globalAlpha = 1;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px Nunito, sans-serif';
        ctx.fillText('← → 选择模式', cx, cy + 175);

        ctx.restore();
    }

    renderCharacterSelect(ctx, characters, selectedIndices, mode, time) {
        const cx = this.canvasWidth / 2;
        const cy = this.canvasHeight / 2;

        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 15;
        ctx.font = 'bold 32px Fredoka, Comic Sans MS, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('选择角色', cx, cy - 150);
        ctx.shadowBlur = 0;

        const cardW = 120;
        const cardH = 160;
        const gap = 15;
        const totalW = characters.length * cardW + (characters.length - 1) * gap;
        const startX = cx - totalW / 2;

        for (let i = 0; i < characters.length; i++) {
            const x = startX + i * (cardW + gap);
            const y = cy - cardH / 2 - 20;
            const selected = selectedIndices.includes(i);
            const character = characters[i];

            character.renderCard(ctx, x, y, selected, character.unlocked);

            if (mode === 'coop' && selected) {
                const pIndex = selectedIndices.indexOf(i) + 1;
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px Nunito, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`P${pIndex}`, x + cardW / 2, y + cardH + 15);
            }
        }

        const pulse = 0.6 + Math.sin(time * 3) * 0.4;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 18px Nunito, sans-serif';
        ctx.fillText('按空格键或点击确认', cx, cy + 130);
        ctx.globalAlpha = 1;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px Nunito, sans-serif';
        if (mode === 'coop') {
            ctx.fillText('P1: ← → 选择  P2: A D 选择', cx, cy + 165);
        } else {
            ctx.fillText('← → 选择角色', cx, cy + 165);
        }

        ctx.restore();
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }
}
