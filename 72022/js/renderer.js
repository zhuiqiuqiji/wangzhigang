class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.particles = [];
  }

  resize() {
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  drawPhysicsObject(obj) {
    switch (obj.type) {
      case 'balloon':
        this.drawBalloon(obj);
        break;
      case 'fan':
        this.drawFan(obj);
        break;
      case 'rocket':
        this.drawRocket(obj);
        break;
      case 'portal':
        this.drawPortal(obj);
        break;
      case 'pulley':
        this.drawPulley(obj);
        break;
      case 'star':
        if (!obj.collected) {
          this.drawStar(obj);
        }
        break;
      case 'obstacle':
        this.drawObstacle(obj);
        break;
    }
  }

  clear() {
    const gradient = this.ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, this.width * 0.7
    );
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.7, '#98D8C8');
    gradient.addColorStop(1, '#4ECDC4');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.drawWoodTexture();
  }

  drawWoodTexture() {
    this.ctx.save();
    this.ctx.globalAlpha = 0.1;
    
    for (let i = 0; i < 8; i++) {
      const y = (this.height / 8) * i;
      const gradient = this.ctx.createLinearGradient(0, y, 0, y + this.height / 8);
      gradient.addColorStop(0, '#8B4513');
      gradient.addColorStop(0.5, '#A0522D');
      gradient.addColorStop(1, '#8B4513');
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, y, this.width, this.height / 8 + 1);
    }
    
    this.ctx.restore();
  }

  drawAnchor(x, y) {
    this.ctx.save();

    const glowGradient = this.ctx.createRadialGradient(x, y, 0, x, y, 30);
    glowGradient.addColorStop(0, 'rgba(255, 200, 100, 0.6)');
    glowGradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
    this.ctx.fillStyle = glowGradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 30, 0, Math.PI * 2);
    this.ctx.fill();

    const baseGradient = this.ctx.createRadialGradient(x - 5, y - 5, 0, x, y, 20);
    baseGradient.addColorStop(0, '#FFD700');
    baseGradient.addColorStop(0.7, '#FFA500');
    baseGradient.addColorStop(1, '#FF8C00');

    this.ctx.fillStyle = baseGradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 18, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#8B4513';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    this.ctx.fillStyle = '#8B4513';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 6, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawRope(rope) {
    if (rope.points.length < 2) return;

    this.ctx.save();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    for (let i = 0; i < rope.constraints.length; i++) {
      const c = rope.constraints[i];
      if (c.cut) continue;

      const gradient = this.ctx.createLinearGradient(
        c.p1.x, c.p1.y, c.p2.x, c.p2.y
      );
      gradient.addColorStop(0, '#D2691E');
      gradient.addColorStop(0.5, '#CD853F');
      gradient.addColorStop(1, '#D2691E');

      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = 6;
      this.ctx.beginPath();
      this.ctx.moveTo(c.p1.x, c.p1.y);
      this.ctx.lineTo(c.p2.x, c.p2.y);
      this.ctx.stroke();

      this.ctx.strokeStyle = '#8B4513';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawRopeWithState(rope, state) {
    if (!state || state.points.length < 2) {
      this.drawRope(rope);
      return;
    }

    this.ctx.save();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    for (let i = 0; i < rope.constraints.length; i++) {
      const c = rope.constraints[i];
      if (c.cut) continue;

      const p1 = state.points[i];
      const p2 = state.points[i + 1];

      const gradient = this.ctx.createLinearGradient(
        p1.x, p1.y, p2.x, p2.y
      );
      gradient.addColorStop(0, '#D2691E');
      gradient.addColorStop(0.5, '#CD853F');
      gradient.addColorStop(1, '#D2691E');

      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = 6;
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.stroke();

      this.ctx.strokeStyle = '#8B4513';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawCandy(x, y, radius, rotation = 0) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);

    const glowGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.8);
    glowGradient.addColorStop(0, 'rgba(255, 150, 200, 0.4)');
    glowGradient.addColorStop(1, 'rgba(255, 150, 200, 0)');
    this.ctx.fillStyle = glowGradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * 1.8, 0, Math.PI * 2);
    this.ctx.fill();

    const bodyGradient = this.ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
    bodyGradient.addColorStop(0, '#FF69B4');
    bodyGradient.addColorStop(0.6, '#FF1493');
    bodyGradient.addColorStop(1, '#C71585');

    this.ctx.fillStyle = bodyGradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.beginPath();
    this.ctx.ellipse(-radius * 0.3, -radius * 0.3, radius * 0.3, radius * 0.2, -0.5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#FFF';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([4, 4]);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.strokeStyle = '#C71585';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(-radius - 8, 0);
    this.ctx.lineTo(-radius, 0);
    this.ctx.moveTo(radius, 0);
    this.ctx.lineTo(radius + 8, 0);
    this.ctx.stroke();

    this.ctx.fillStyle = '#FF69B4';
    this.drawWrapper(-radius - 8, 0, 8);
    this.drawWrapper(radius + 8, 0, 8);

    this.ctx.restore();
  }

  drawWrapper(x, y, size) {
    this.ctx.beginPath();
    this.ctx.moveTo(x - size, y - size);
    this.ctx.lineTo(x + size, y);
    this.ctx.lineTo(x - size, y + size);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  drawTarget(x, y, radius) {
    this.ctx.save();

    const glowGradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius * 1.5);
    glowGradient.addColorStop(0, 'rgba(100, 255, 100, 0.3)');
    glowGradient.addColorStop(1, 'rgba(100, 255, 100, 0)');
    this.ctx.fillStyle = glowGradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
    this.ctx.fill();

    this.drawMonster(x, y, radius);

    this.ctx.restore();
  }

  drawMonster(x, y, radius) {
    const bodyGradient = this.ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    bodyGradient.addColorStop(0, '#90EE90');
    bodyGradient.addColorStop(0.6, '#32CD32');
    bodyGradient.addColorStop(1, '#228B22');

    this.ctx.fillStyle = bodyGradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#006400';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    const eyeY = y - radius * 0.15;
    const eyeSpacing = radius * 0.35;

    this.ctx.fillStyle = '#FFF';
    this.ctx.beginPath();
    this.ctx.ellipse(x - eyeSpacing, eyeY, radius * 0.22, radius * 0.28, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.ellipse(x + eyeSpacing, eyeY, radius * 0.22, radius * 0.28, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(x - eyeSpacing + 2, eyeY + 2, radius * 0.1, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(x + eyeSpacing + 2, eyeY + 2, radius * 0.1, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#8B0000';
    this.ctx.beginPath();
    this.ctx.arc(x, y + radius * 0.35, radius * 0.35, 0, Math.PI);
    this.ctx.fill();

    this.ctx.fillStyle = '#FFF';
    this.ctx.beginPath();
    this.ctx.moveTo(x - radius * 0.2, y + radius * 0.35);
    this.ctx.lineTo(x - radius * 0.1, y + radius * 0.55);
    this.ctx.lineTo(x, y + radius * 0.35);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(x, y + radius * 0.35);
    this.ctx.lineTo(x + radius * 0.1, y + radius * 0.55);
    this.ctx.lineTo(x + radius * 0.2, y + radius * 0.35);
    this.ctx.fill();
  }

  drawTrail(trail) {
    if (trail.length < 2) return;

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();
    this.ctx.moveTo(trail[0].x, trail[0].y);

    for (let i = 1; i < trail.length; i++) {
      this.ctx.globalAlpha = i / trail.length;
      this.ctx.lineTo(trail[i].x, trail[i].y);
    }

    this.ctx.stroke();
    this.ctx.restore();
  }

  addCutParticles(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 2 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        color: ['#D2691E', '#CD853F', '#8B4513', '#DEB887'][Math.floor(Math.random() * 4)]
      });
    }
  }

  addSuccessParticles(x, y) {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        life: 1,
        color: ['#FFD700', '#FFA500', '#FF69B4', '#00FF7F', '#87CEEB'][Math.floor(Math.random() * 5)]
      });
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life -= 0.02;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  drawParticles() {
    this.ctx.save();

    for (const p of this.particles) {
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  drawUI(level, score, levelName) {
    this.ctx.save();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetY = 3;

    this.roundRect(20, 15, 180, 70, 15, true, false);
    this.roundRect(this.width - 200, 15, 180, 70, 15, true, false);

    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetY = 0;

    this.ctx.fillStyle = '#FF6B35';
    this.ctx.font = 'bold 18px "Baloo 2", "Comic Sans MS", cursive';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`第 ${level} 关`, 40, 45);

    this.ctx.fillStyle = '#4ECDC4';
    this.ctx.font = '14px "Baloo 2", "Comic Sans MS", cursive';
    this.ctx.fillText(levelName, 40, 68);

    this.ctx.fillStyle = '#FF6B35';
    this.ctx.font = 'bold 18px "Baloo 2", "Comic Sans MS", cursive';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('得分', this.width - 40, 45);

    this.ctx.fillStyle = '#4ECDC4';
    this.ctx.font = 'bold 24px "Baloo 2", "Comic Sans MS", cursive';
    this.ctx.fillText(score.toString(), this.width - 40, 72);

    this.ctx.restore();
  }

  drawSuccess() {
    this.ctx.save();

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.ctx.fillStyle = '#FFF';
    this.ctx.shadowColor = '#FFD700';
    this.ctx.shadowBlur = 30;
    this.roundRect(centerX - 180, centerY - 120, 360, 240, 25, true, false);

    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#FF6B35';
    this.ctx.font = 'bold 48px "Baloo 2", "Comic Sans MS", cursive';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🎉 太棒了！', centerX, centerY - 40);

    this.ctx.fillStyle = '#4ECDC4';
    this.ctx.font = '24px "Baloo 2", "Comic Sans MS", cursive';
    this.ctx.fillText('糖果成功送达！', centerX, centerY + 5);

    this.ctx.fillStyle = '#666';
    this.ctx.font = '18px "Baloo 2", "Comic Sans MS", cursive';
    this.ctx.fillText('点击继续下一关', centerX, centerY + 50);

    this.ctx.restore();
  }

  drawFail() {
    this.ctx.save();

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.ctx.fillStyle = '#FFF';
    this.ctx.shadowColor = '#FF6B6B';
    this.ctx.shadowBlur = 30;
    this.roundRect(centerX - 180, centerY - 120, 360, 240, 25, true, false);

    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#FF6B6B';
    this.ctx.font = 'bold 48px "Baloo 2", "Comic Sans MS", cursive';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('😢 哎呀！', centerX, centerY - 40);

    this.ctx.fillStyle = '#666';
    this.ctx.font = '24px "Baloo 2", "Comic Sans MS", cursive';
    this.ctx.fillText('糖果掉出去了', centerX, centerY + 5);

    this.ctx.fillStyle = '#4ECDC4';
    this.ctx.font = '18px "Baloo 2", "Comic Sans MS", cursive';
    this.ctx.fillText('点击重新开始', centerX, centerY + 50);

    this.ctx.restore();
  }

  drawGameComplete(totalScore) {
    this.ctx.save();

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.ctx.fillStyle = '#FFF';
    this.ctx.shadowColor = '#FFD700';
    this.ctx.shadowBlur = 50;
    this.roundRect(centerX - 200, centerY - 150, 400, 300, 30, true, false);

    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#FF6B35';
    this.ctx.font = 'bold 52px "Baloo 2", "Comic Sans MS", cursive';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🏆 恭喜通关！', centerX, centerY - 70);

    this.ctx.fillStyle = '#4ECDC4';
    this.ctx.font = '28px "Baloo 2", "Comic Sans MS", cursive';
    this.ctx.fillText('最终得分', centerX, centerY - 10);

    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 48px "Baloo 2", "Comic Sans MS", cursive';
    this.ctx.fillText(totalScore.toString(), centerX, centerY + 45);

    this.ctx.fillStyle = '#666';
    this.ctx.font = '18px "Baloo 2", "Comic Sans MS", cursive';
    this.ctx.fillText('点击重新开始游戏', centerX, centerY + 90);

    this.ctx.restore();
  }

  drawButtons() {
    this.ctx.save();

    const btnY = this.height - 60;
    const btnWidth = 120;
    const btnHeight = 45;
    const spacing = 20;
    const totalWidth = btnWidth * 2 + spacing;
    const startX = (this.width - totalWidth) / 2;

    this.drawButton(startX, btnY, btnWidth, btnHeight, '重置', '#FF6B35');
    this.drawButton(startX + btnWidth + spacing, btnY, btnWidth, btnHeight, '下一关', '#4ECDC4');

    this.ctx.restore();
  }

  drawButton(x, y, width, height, text, color) {
    this.ctx.fillStyle = color;
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetY = 3;

    this.roundRect(x, y, width, height, 12, true, false);

    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 18px "Baloo 2", "Comic Sans MS", cursive';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x + width / 2, y + height / 2);
    this.ctx.textBaseline = 'alphabetic';
  }

  isPointInButton(px, py, btnX, btnY, btnWidth, btnHeight) {
    return px >= btnX && px <= btnX + btnWidth &&
           py >= btnY && py <= btnY + btnHeight;
  }

  roundRect(x, y, width, height, radius, fill, stroke) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();

    if (fill) this.ctx.fill();
    if (stroke) this.ctx.stroke();
  }

  drawBalloon(balloon) {
    if (!balloon.active) return;

    this.ctx.save();
    this.ctx.translate(balloon.x, balloon.y);

    const glowGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, balloon.radius * 1.5);
    glowGradient.addColorStop(0, 'rgba(255, 100, 100, 0.4)');
    glowGradient.addColorStop(1, 'rgba(255, 100, 100, 0)');
    this.ctx.fillStyle = glowGradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, balloon.radius * 1.5, 0, Math.PI * 2);
    this.ctx.fill();

    const bodyGradient = this.ctx.createRadialGradient(-balloon.radius * 0.3, -balloon.radius * 0.3, 0, 0, 0, balloon.radius);
    bodyGradient.addColorStop(0, '#FF6B6B');
    bodyGradient.addColorStop(0.6, '#FF4757');
    bodyGradient.addColorStop(1, '#C0392B');

    this.ctx.fillStyle = bodyGradient;
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, balloon.radius, balloon.radius * 1.15, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#922B21';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.beginPath();
    this.ctx.ellipse(-balloon.radius * 0.3, -balloon.radius * 0.3, balloon.radius * 0.25, balloon.radius * 0.15, -0.5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#922B21';
    this.ctx.beginPath();
    this.ctx.moveTo(-8, balloon.radius);
    this.ctx.lineTo(8, balloon.radius);
    this.ctx.lineTo(0, balloon.radius + 10);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.strokeStyle = '#8B4513';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, balloon.radius + 10);
    this.ctx.lineTo(0, balloon.radius + 25);
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawFan(fan) {
    this.ctx.save();
    this.ctx.translate(fan.x, fan.y);

    const rangeGradient = this.ctx.createRadialGradient(0, 0, fan.width * 0.3, 0, 0, fan.range);
    rangeGradient.addColorStop(0, 'rgba(100, 200, 255, 0.3)');
    rangeGradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
    this.ctx.fillStyle = rangeGradient;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.arc(0, 0, fan.range, fan.direction - fan.angle / 2, fan.direction + fan.angle / 2);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.rotate(fan.direction);

    this.ctx.fillStyle = '#34495E';
    this.roundRect(-fan.width / 2, -fan.height / 2, fan.width, fan.height, 8, true, false);

    this.ctx.fillStyle = '#5D6D7E';
    this.roundRect(-fan.width / 2 + 5, -fan.height / 2 + 3, fan.width - 10, fan.height - 6, 6, true, false);

    this.ctx.save();
    this.ctx.translate(fan.width * 0.3, 0);
    this.ctx.rotate(fan.rotation * 5);

    const bladeGradient = this.ctx.createLinearGradient(-15, 0, 15, 0);
    bladeGradient.addColorStop(0, '#7F8C8D');
    bladeGradient.addColorStop(0.5, '#BDC3C7');
    bladeGradient.addColorStop(1, '#7F8C8D');

    this.ctx.fillStyle = bladeGradient;
    for (let i = 0; i < 3; i++) {
      this.ctx.rotate(Math.PI * 2 / 3);
      this.ctx.beginPath();
      this.ctx.ellipse(12, 0, 15, 5, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.fillStyle = '#2C3E50';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();

    if (fan.active) {
      const arrowCount = 5;
      for (let i = 0; i < arrowCount; i++) {
        const offset = ((Date.now() / 200 + i) % arrowCount) / arrowCount;
        const arrowX = fan.width * 0.5 + offset * 50;
        const arrowY = (i - arrowCount / 2) * 10;

        this.ctx.fillStyle = `rgba(100, 200, 255, ${0.5 - offset * 0.5})`;
        this.ctx.beginPath();
        this.ctx.moveTo(arrowX, arrowY);
        this.ctx.lineTo(arrowX + 10, arrowY - 5);
        this.ctx.lineTo(arrowX + 10, arrowY + 5);
        this.ctx.closePath();
        this.ctx.fill();
      }
    }

    this.ctx.restore();
  }

  drawRocket(rocket) {
    this.ctx.save();
    this.ctx.translate(rocket.x, rocket.y);
    this.ctx.rotate(rocket.direction + Math.PI / 2);

    const fuelRatio = rocket.fuel / rocket.maxFuel;

    const bodyGradient = this.ctx.createLinearGradient(-rocket.radius, 0, rocket.radius, 0);
    bodyGradient.addColorStop(0, '#E74C3C');
    bodyGradient.addColorStop(0.5, '#FF6B6B');
    bodyGradient.addColorStop(1, '#C0392B');

    this.ctx.fillStyle = bodyGradient;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -rocket.radius * 1.5);
    this.ctx.lineTo(rocket.radius, rocket.radius);
    this.ctx.lineTo(-rocket.radius, rocket.radius);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.strokeStyle = '#922B21';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.fillStyle = '#85C1E9';
    this.ctx.beginPath();
    this.ctx.arc(0, -rocket.radius * 0.3, rocket.radius * 0.35, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#2C3E50';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.fillStyle = '#F39C12';
    this.ctx.beginPath();
    this.ctx.moveTo(-rocket.radius * 0.8, rocket.radius);
    this.ctx.lineTo(-rocket.radius * 1.2, rocket.radius * 1.3);
    this.ctx.lineTo(-rocket.radius * 0.4, rocket.radius);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(rocket.radius * 0.8, rocket.radius);
    this.ctx.lineTo(rocket.radius * 1.2, rocket.radius * 1.3);
    this.ctx.lineTo(rocket.radius * 0.4, rocket.radius);
    this.ctx.closePath();
    this.ctx.fill();

    if (rocket.active && rocket.fuel > 0) {
      const flameHeight = 15 + Math.sin(Date.now() / 50) * 5;

      const flameGradient = this.ctx.createLinearGradient(0, rocket.radius, 0, rocket.radius + flameHeight);
      flameGradient.addColorStop(0, '#F39C12');
      flameGradient.addColorStop(0.5, '#E74C3C');
      flameGradient.addColorStop(1, 'rgba(231, 76, 60, 0)');

      this.ctx.fillStyle = flameGradient;
      this.ctx.beginPath();
      this.ctx.moveTo(-rocket.radius * 0.5, rocket.radius);
      this.ctx.lineTo(0, rocket.radius + flameHeight);
      this.ctx.lineTo(rocket.radius * 0.5, rocket.radius);
      this.ctx.closePath();
      this.ctx.fill();
    }

    this.ctx.fillStyle = '#2C3E50';
    this.ctx.fillRect(-rocket.radius * 0.8, rocket.radius * 1.5, rocket.radius * 1.6, 6);
    this.ctx.fillStyle = '#27AE60';
    this.ctx.fillRect(-rocket.radius * 0.8, rocket.radius * 1.5, rocket.radius * 1.6 * fuelRatio, 6);

    this.ctx.restore();
  }

  drawPortal(portal) {
    this.ctx.save();
    this.ctx.translate(portal.x, portal.y);

    const glowGradient = this.ctx.createRadialGradient(0, 0, portal.radius * 0.5, 0, 0, portal.radius * 2);
    glowGradient.addColorStop(0, portal.color + '80');
    glowGradient.addColorStop(1, portal.color + '00');
    this.ctx.fillStyle = glowGradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, portal.radius * 2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.rotate(portal.rotation);

    for (let i = 0; i < 3; i++) {
      this.ctx.rotate(Math.PI * 2 / 3);
      const ringGradient = this.ctx.createRadialGradient(0, 0, portal.radius * 0.6, 0, 0, portal.radius);
      ringGradient.addColorStop(0, 'transparent');
      ringGradient.addColorStop(0.7, portal.color);
      ringGradient.addColorStop(1, '#2C3E50');

      this.ctx.strokeStyle = ringGradient;
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, portal.radius, 0, Math.PI * 1.5);
      this.ctx.stroke();
    }

    const innerGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, portal.radius * 0.7);
    innerGradient.addColorStop(0, '#000');
    innerGradient.addColorStop(0.7, portal.color + 'AA');
    innerGradient.addColorStop(1, 'transparent');

    this.ctx.fillStyle = innerGradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, portal.radius * 0.7, 0, Math.PI * 2);
    this.ctx.fill();

    if (portal.cooldown > 0) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, portal.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  drawPulley(pulley) {
    this.ctx.save();
    this.ctx.translate(pulley.x, pulley.y);
    this.ctx.rotate(pulley.rotation);

    const gradient = this.ctx.createRadialGradient(-pulley.radius * 0.3, -pulley.radius * 0.3, 0, 0, 0, pulley.radius);
    gradient.addColorStop(0, '#95A5A6');
    gradient.addColorStop(0.6, '#7F8C8D');
    gradient.addColorStop(1, '#5D6D7E');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, pulley.radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#2C3E50';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    this.ctx.strokeStyle = '#2C3E50';
    this.ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(Math.cos(angle) * pulley.radius * 0.4, Math.sin(angle) * pulley.radius * 0.4);
      this.ctx.lineTo(Math.cos(angle) * pulley.radius * 0.85, Math.sin(angle) * pulley.radius * 0.85);
      this.ctx.stroke();
    }

    this.ctx.fillStyle = '#2C3E50';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, pulley.radius * 0.25, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#BDC3C7';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, pulley.radius * 0.1, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawStar(star) {
    const displayY = star.getDisplayY ? star.getDisplayY() : star.y;

    this.ctx.save();
    this.ctx.translate(star.x, displayY);
    this.ctx.rotate(star.rotation);

    const glowGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, star.radius * 2);
    glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
    glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    this.ctx.fillStyle = glowGradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, star.radius * 2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#FFD700';
    this.ctx.strokeStyle = '#FFA500';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    for (let i = 0; i < 5; i++) {
      const outerAngle = (Math.PI * 2 / 5) * i - Math.PI / 2;
      const innerAngle = outerAngle + Math.PI / 5;

      const outerX = Math.cos(outerAngle) * star.radius;
      const outerY = Math.sin(outerAngle) * star.radius;
      const innerX = Math.cos(innerAngle) * star.radius * 0.45;
      const innerY = Math.sin(innerAngle) * star.radius * 0.45;

      if (i === 0) {
        this.ctx.moveTo(outerX, outerY);
      } else {
        this.ctx.lineTo(outerX, outerY);
      }
      this.ctx.lineTo(innerX, innerY);
    }

    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.beginPath();
    this.ctx.ellipse(-star.radius * 0.2, -star.radius * 0.2, star.radius * 0.25, star.radius * 0.15, -0.5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawObstacle(obstacle) {
    this.ctx.save();
    this.ctx.translate(obstacle.x, obstacle.y);

    let fillColor = '#5D6D7E';
    let strokeColor = '#2C3E50';

    if (obstacle.isDeadly) {
      fillColor = '#C0392B';
      strokeColor = '#922B21';
    } else if (obstacle.isBouncy) {
      fillColor = '#27AE60';
      strokeColor = '#1E8449';
    }

    const gradient = this.ctx.createLinearGradient(0, -obstacle.height / 2, 0, obstacle.height / 2);
    gradient.addColorStop(0, fillColor);
    gradient.addColorStop(1, strokeColor);

    this.ctx.fillStyle = gradient;
    this.roundRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height, 5, true, false);

    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = 3;
    this.roundRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height, 5, false, true);

    if (obstacle.isBouncy) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let i = 0; i < 3; i++) {
        const x = -obstacle.width / 3 + i * obstacle.width / 3;
        this.ctx.beginPath();
        this.ctx.arc(x, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    if (obstacle.isDeadly) {
      this.ctx.fillStyle = '#000';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('☠', 0, 0);
    }

    this.ctx.restore();
  }

  drawStarRating(stars, maxStars = 3, x, y, size = 20) {
    this.ctx.save();

    for (let i = 0; i < maxStars; i++) {
      const starX = x + i * (size * 1.5);
      const starY = y;

      if (i < stars) {
        const glowGradient = this.ctx.createRadialGradient(starX, starY, 0, starX, starY, size * 1.5);
        glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
        glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(starX, starY, size * 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#FFD700';
        this.ctx.strokeStyle = '#FFA500';
      } else {
        this.ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
        this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)';
      }

      this.ctx.lineWidth = 2;
      this.ctx.beginPath();

      for (let j = 0; j < 5; j++) {
        const outerAngle = (Math.PI * 2 / 5) * j - Math.PI / 2;
        const innerAngle = outerAngle + Math.PI / 5;

        const outerX = starX + Math.cos(outerAngle) * size;
        const outerY = starY + Math.sin(outerAngle) * size;
        const innerX = starX + Math.cos(innerAngle) * size * 0.45;
        const innerY = starY + Math.sin(innerAngle) * size * 0.45;

        if (j === 0) {
          this.ctx.moveTo(outerX, outerY);
        } else {
          this.ctx.lineTo(outerX, outerY);
        }
        this.ctx.lineTo(innerX, innerY);
      }

      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawLevelSelect(levels, currentLevel, levelProgress, x, y, width, height) {
    this.ctx.save();

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.roundRect(x, y, width, height, 15, true, false);

    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 24px "Baloo 2", "Comic Sans MS", cursive';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('选择关卡', x + width / 2, y + 40);

    const cols = 3;
    const buttonSize = Math.min((width - 40) / cols - 10, 60);
    const startX = x + 20;
    const startY = y + 70;

    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const btnX = startX + col * (buttonSize + 10);
      const btnY = startY + row * (buttonSize + 15);

      const progress = levelProgress[level.id] || {};
      const isUnlocked = isLevelUnlocked(level, levelProgress);

      if (!isUnlocked) {
        this.ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
      } else if (i === currentLevel) {
        this.ctx.fillStyle = '#FF6B35';
      } else {
        this.ctx.fillStyle = '#4ECDC4';
      }

      this.ctx.strokeStyle = '#FFF';
      this.ctx.lineWidth = 2;
      this.roundRect(btnX, btnY, buttonSize, buttonSize, 10, true, true);

      if (!isUnlocked) {
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🔒', btnX + buttonSize / 2, btnY + buttonSize / 2);
      } else {
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 18px "Baloo 2", "Comic Sans MS", cursive';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(level.id.toString(), btnX + buttonSize / 2, btnY + buttonSize / 2);

        if (progress.stars) {
          this.drawStarRating(progress.stars, 3, btnX + 5, btnY + buttonSize - 8, 6);
        }
      }
    }

    this.ctx.restore();
  }

  drawReplayControls(isReplaying, playbackSpeed, x, y) {
    this.ctx.save();

    const btnWidth = 80;
    const btnHeight = 35;
    const spacing = 10;

    this.ctx.fillStyle = isReplaying ? '#E74C3C' : '#3498DB';
    this.ctx.strokeStyle = '#FFF';
    this.ctx.lineWidth = 2;
    this.roundRect(x, y, btnWidth, btnHeight, 8, true, true);

    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 14px "Baloo 2", "Comic Sans MS", cursive';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(isReplaying ? '⏸ 暂停' : '▶ 回放', x + btnWidth / 2, y + btnHeight / 2);

    this.ctx.fillStyle = '#2C3E50';
    this.ctx.strokeStyle = '#FFF';
    this.ctx.lineWidth = 2;
    this.roundRect(x + btnWidth + spacing, y, btnWidth, btnHeight, 8, true, true);

    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 14px "Baloo 2", "Comic Sans MS", cursive';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${playbackSpeed.toFixed(1)}x`, x + btnWidth + spacing + btnWidth / 2, y + btnHeight / 2);

    this.ctx.restore();
  }

  drawEditorUI(selectedTool, x, y) {
    this.ctx.save();

    const tools = [
      { id: 'anchor', icon: '⚓', name: '锚点' },
      { id: 'rope', icon: '🪢', name: '绳子' },
      { id: 'star', icon: '⭐', name: '星星' },
      { id: 'balloon', icon: '🎈', name: '气球' },
      { id: 'fan', icon: '🌀', name: '风扇' },
      { id: 'rocket', icon: '🚀', name: '火箭' },
      { id: 'portal', icon: '🌀', name: '传送门' },
      { id: 'obstacle', icon: '🧱', name: '障碍' }
    ];

    const btnWidth = 50;
    const btnHeight = 50;
    const spacing = 8;

    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i];
      const btnX = x + i * (btnWidth + spacing);
      const btnY = y;

      this.ctx.fillStyle = selectedTool === tool.id ? '#FF6B35' : '#34495E';
      this.ctx.strokeStyle = '#FFF';
      this.ctx.lineWidth = 2;
      this.roundRect(btnX, btnY, btnWidth, btnHeight, 8, true, true);

      this.ctx.font = '24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(tool.icon, btnX + btnWidth / 2, btnY + btnHeight / 2);

      this.ctx.fillStyle = '#FFF';
      this.ctx.font = '10px "Baloo 2", "Comic Sans MS", cursive';
      this.ctx.fillText(tool.name, btnX + btnWidth / 2, btnY + btnHeight + 12);
    }

    this.ctx.restore();
  }
}
