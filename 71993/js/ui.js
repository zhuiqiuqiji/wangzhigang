class UI {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.score = 0;
    this.displayScore = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;
    this.comboDecayTime = 3;
    this.trickHistory = [];
    this.speedTrail = [];
    this.hudPulse = 0;
    this.messageText = '';
    this.messageTimer = 0;
    this.messageColor = '#00ff88';
  }

  update(dt, moto, gameState) {
    this.displayScore += (this.score - this.displayScore) * 0.1;

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    this.hudPulse += dt * 3;

    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
    }

    if (gameState === 'playing' && moto) {
      this.speedTrail.push(moto.getSpeed());
      if (this.speedTrail.length > 60) this.speedTrail.shift();
    }
  }

  addScore(points) {
    const multiplier = Math.max(1, this.combo);
    const totalPoints = points * multiplier;
    this.score += totalPoints;
    this.combo++;
    this.comboTimer = this.comboDecayTime;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    return totalPoints;
  }

  showMessage(text, color) {
    this.messageText = text;
    this.messageTimer = 2.0;
    this.messageColor = color || '#00ff88';
  }

  renderHUD(ctx, moto, gameTime, gameState, terrain) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (gameState !== 'playing' && gameState !== 'finished') return;

    this.renderScore(ctx, w, h);
    this.renderSpeed(ctx, moto, w, h);
    this.renderCombo(ctx, w, h);
    this.renderTimer(ctx, gameTime, w, h);
    this.renderProgressBar(ctx, moto, terrain, w, h);
    this.renderMessage(ctx, w, h);
    this.renderTrickIndicator(ctx, moto, w, h);
  }

  renderScore(ctx, w, h) {
    ctx.save();
    const x = 30;
    const y = 40;

    ctx.fillStyle = 'rgba(10, 22, 40, 0.7)';
    this.roundRect(ctx, x - 10, y - 25, 220, 55, 8);
    ctx.fill();
    ctx.strokeStyle = '#00ff8840';
    ctx.lineWidth = 1;
    this.roundRect(ctx, x - 10, y - 25, 220, 55, 8);
    ctx.stroke();

    ctx.font = '12px Orbitron, monospace';
    ctx.fillStyle = '#00ff8888';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', x, y - 5);

    ctx.font = 'bold 28px Orbitron, monospace';
    const pulse = Math.sin(this.hudPulse) * 0.05 + 1;
    ctx.save();
    ctx.translate(x, y + 22);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 10;
    ctx.fillText(Math.floor(this.displayScore).toString().padStart(8, '0'), 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.restore();
  }

  renderSpeed(ctx, moto, w, h) {
    ctx.save();
    const x = w - 250;
    const y = 40;

    ctx.fillStyle = 'rgba(10, 22, 40, 0.7)';
    this.roundRect(ctx, x - 10, y - 25, 230, 55, 8);
    ctx.fill();
    ctx.strokeStyle = '#ff6b3540';
    ctx.lineWidth = 1;
    this.roundRect(ctx, x - 10, y - 25, 230, 55, 8);
    ctx.stroke();

    ctx.font = '12px Orbitron, monospace';
    ctx.fillStyle = '#ff6b3588';
    ctx.textAlign = 'left';
    ctx.fillText('SPEED', x, y - 5);

    const speed = Math.floor(moto.getSpeed() * 0.36);
    ctx.font = 'bold 28px Orbitron, monospace';
    ctx.fillStyle = speed > 200 ? '#ff6b35' : speed > 100 ? '#ffaa55' : '#ff6b3588';
    ctx.shadowColor = '#ff6b35';
    ctx.shadowBlur = speed > 200 ? 12 : 5;
    ctx.fillText(speed + ' KM/H', x, y + 22);
    ctx.shadowBlur = 0;

    const barW = 200;
    const barH = 4;
    const barX = x;
    const barY = y + 32;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(barX, barY, barW, barH);

    const fillW = Math.min(1, moto.getSpeed() / 900) * barW;
    const barGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
    barGrad.addColorStop(0, '#ff6b35');
    barGrad.addColorStop(1, '#ff3333');
    ctx.fillStyle = barGrad;
    ctx.fillRect(barX, barY, fillW, barH);

    ctx.restore();
  }

  renderCombo(ctx, w, h) {
    if (this.combo <= 1) return;

    ctx.save();
    const x = w / 2;
    const y = 45;

    const comboAlpha = Math.min(1, this.comboTimer / this.comboDecayTime + 0.3);
    ctx.globalAlpha = comboAlpha;

    const scale = 1 + Math.sin(this.hudPulse * 2) * 0.08;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.font = 'bold 36px Orbitron, monospace';
    ctx.textAlign = 'center';

    const comboColor = this.combo >= 5 ? '#ff3366' : this.combo >= 3 ? '#ff6b35' : '#00ff88';

    ctx.shadowColor = comboColor;
    ctx.shadowBlur = 20;
    ctx.fillStyle = comboColor;
    ctx.fillText('x' + this.combo + ' COMBO', 0, 0);
    ctx.shadowBlur = 0;

    ctx.font = '14px Orbitron, monospace';
    ctx.fillStyle = comboColor + '99';
    ctx.fillText('MULTIPLIER ACTIVE', 0, 20);

    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  renderTimer(ctx, gameTime, w, h) {
    ctx.save();
    const x = w / 2;
    const y = 25;

    ctx.font = '18px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff88';

    const minutes = Math.floor(gameTime / 60);
    const seconds = Math.floor(gameTime % 60);
    const ms = Math.floor((gameTime % 1) * 100);
    ctx.fillText(
      minutes.toString().padStart(2, '0') + ':' +
      seconds.toString().padStart(2, '0') + '.' +
      ms.toString().padStart(2, '0'),
      x, y
    );

    ctx.restore();
  }

  renderProgressBar(ctx, moto, terrain, w, h) {
    const barW = 300;
    const barH = 6;
    const barX = (w - barW) / 2;
    const barY = h - 30;

    ctx.fillStyle = 'rgba(10, 22, 40, 0.6)';
    this.roundRect(ctx, barX - 5, barY - 5, barW + 10, barH + 10, 5);
    ctx.fill();

    ctx.fillStyle = '#1a1a2e';
    this.roundRect(ctx, barX, barY, barW, barH, 3);
    ctx.fill();

    const progress = Math.min(1, moto.x / terrain.finishX);
    const fillW = progress * barW;

    const progGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
    progGrad.addColorStop(0, '#00ff88');
    progGrad.addColorStop(1, '#ff6b35');
    ctx.fillStyle = progGrad;
    this.roundRect(ctx, barX, barY, fillW, barH, 3);
    ctx.fill();

    const dotX = barX + fillW;
    ctx.beginPath();
    ctx.arc(dotX, barY + barH / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6b35';
    ctx.shadowColor = '#ff6b35';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = '10px Orbitron, monospace';
    ctx.fillStyle = '#ffffff55';
    ctx.textAlign = 'center';
    ctx.fillText(Math.floor(progress * 100) + '%', barX + barW / 2, barY + barH + 15);
  }

  renderTrickIndicator(ctx, moto, w, h) {
    if (moto.isGrounded || moto.isCrashed) return;

    ctx.save();
    const x = w / 2;
    const y = h / 2 - 60;

    const trickRot = moto.getCurrentTrickRotations();
    if (trickRot > 0.2) {
      const trickName = moto.getTrickName();
      const fullRotations = Math.floor(trickRot);

      ctx.font = 'bold 24px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff6b35';
      ctx.shadowColor = '#ff6b35';
      ctx.shadowBlur = 15;
      ctx.fillText(trickName, x, y);
      ctx.shadowBlur = 0;

      if (fullRotations > 0) {
        ctx.font = 'bold 18px Orbitron, monospace';
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 10;
        ctx.fillText('+' + (fullRotations * 500) + ' PTS', x, y + 28);
        ctx.shadowBlur = 0;
      }

      const rotProgress = trickRot % 1;
      const arcRadius = 25;
      ctx.beginPath();
      ctx.arc(x, y + 55, arcRadius, -Math.PI / 2, -Math.PI / 2 + rotProgress * Math.PI * 2);
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  renderMessage(ctx, w, h) {
    if (this.messageTimer <= 0) return;

    ctx.save();
    const alpha = Math.min(1, this.messageTimer / 0.5);
    ctx.globalAlpha = alpha;

    ctx.font = 'bold 32px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.messageColor;
    ctx.shadowColor = this.messageColor;
    ctx.shadowBlur = 20;
    ctx.fillText(this.messageText, w / 2, h / 2);
    ctx.shadowBlur = 0;

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  renderStartScreen(ctx, w, h) {
    ctx.fillStyle = 'rgba(5, 13, 26, 0.85)';
    ctx.fillRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;

    ctx.font = 'bold 56px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6b35';
    ctx.shadowColor = '#ff6b35';
    ctx.shadowBlur = 30;
    ctx.fillText('MOTO STUNT', centerX, centerY - 80);
    ctx.shadowBlur = 0;

    ctx.font = 'bold 28px Orbitron, monospace';
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 15;
    ctx.fillText('RACING', centerX, centerY - 40);
    ctx.shadowBlur = 0;

    const pulse = Math.sin(Date.now() * 0.004) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.font = '20px Orbitron, monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('PRESS ENTER TO START', centerX, centerY + 40);
    ctx.globalAlpha = 1;

    ctx.font = '14px Orbitron, monospace';
    ctx.fillStyle = '#ffffff66';
    ctx.fillText('↑ ACCELERATE  ↓ BRAKE', centerX, centerY + 100);
    ctx.fillText('← → AIR ROTATION / LEAN', centerX, centerY + 125);

    this.drawDecorativeLines(ctx, centerX, centerY, w, h);
  }

  renderGameOver(ctx, w, h, score, gameTime) {
    ctx.fillStyle = 'rgba(5, 13, 26, 0.88)';
    ctx.fillRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;

    ctx.font = 'bold 48px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff3366';
    ctx.shadowColor = '#ff3366';
    ctx.shadowBlur = 25;
    ctx.fillText('CRASHED!', centerX, centerY - 80);
    ctx.shadowBlur = 0;

    ctx.font = '22px Orbitron, monospace';
    ctx.fillStyle = '#ff6b35';
    ctx.fillText('SCORE: ' + Math.floor(score), centerX, centerY - 20);

    const minutes = Math.floor(gameTime / 60);
    const seconds = Math.floor(gameTime % 60);
    ctx.fillStyle = '#ffffff88';
    ctx.font = '18px Orbitron, monospace';
    ctx.fillText('TIME: ' + minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0'), centerX, centerY + 20);

    const pulse = Math.sin(Date.now() * 0.004) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.font = '20px Orbitron, monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('PRESS ENTER TO RETRY', centerX, centerY + 80);
    ctx.globalAlpha = 1;
  }

  renderFinished(ctx, w, h, score, gameTime, maxCombo) {
    ctx.fillStyle = 'rgba(5, 13, 26, 0.88)';
    ctx.fillRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;

    ctx.font = 'bold 48px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 25;
    ctx.fillText('FINISH!', centerX, centerY - 100);
    ctx.shadowBlur = 0;

    const timeScore = Math.max(0, 10000 - Math.floor(gameTime * 50));
    const trickScore = Math.floor(score);
    const totalScore = timeScore + trickScore;

    ctx.font = '20px Orbitron, monospace';
    ctx.fillStyle = '#ff6b35';
    ctx.fillText('TRICK SCORE: ' + trickScore, centerX, centerY - 40);

    ctx.fillStyle = '#00ff88';
    ctx.fillText('TIME BONUS: ' + timeScore, centerX, centerY - 10);

    ctx.fillStyle = '#ffffff88';
    ctx.fillText('MAX COMBO: x' + maxCombo, centerX, centerY + 20);

    ctx.font = 'bold 32px Orbitron, monospace';
    ctx.fillStyle = '#ff6b35';
    ctx.shadowColor = '#ff6b35';
    ctx.shadowBlur = 15;
    ctx.fillText('TOTAL: ' + totalScore, centerX, centerY + 65);
    ctx.shadowBlur = 0;

    const minutes = Math.floor(gameTime / 60);
    const seconds = Math.floor(gameTime % 60);
    ctx.font = '16px Orbitron, monospace';
    ctx.fillStyle = '#ffffff55';
    ctx.fillText('TIME: ' + minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0'), centerX, centerY + 95);

    const pulse = Math.sin(Date.now() * 0.004) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.font = '20px Orbitron, monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('PRESS ENTER TO PLAY AGAIN', centerX, centerY + 140);
    ctx.globalAlpha = 1;
  }

  drawDecorativeLines(ctx, cx, cy, w, h) {
    ctx.strokeStyle = '#ff6b3515';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const offset = i * 40 - 80;
      ctx.beginPath();
      ctx.moveTo(cx - 200, cy + offset);
      ctx.lineTo(cx + 200, cy + offset);
      ctx.stroke();
    }

    ctx.strokeStyle = '#00ff8815';
    for (let i = 0; i < 5; i++) {
      const offset = i * 40 - 80;
      ctx.beginPath();
      ctx.moveTo(cx + offset, cy - 150);
      ctx.lineTo(cx + offset, cy + 150);
      ctx.stroke();
    }
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

window.UI = UI;
