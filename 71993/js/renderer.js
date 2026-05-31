class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cameraX = 0;
    this.cameraY = 0;
    this.targetCameraX = 0;
    this.targetCameraY = 0;
    this.screenShake = 0;
    this.stars = [];
    this.bgMountains = [];
    this.bgCityLights = [];
    this.trickPopups = [];
    this.landingParticles = [];
    this.trickParticles = [];
    this.speedLines = [];
    this.theme = 'desert';
    this.themeConfig = TRACK_THEMES.desert;
    this.ghostRenderer = null;
    this.initBackground();
  }

  initBackground() {
    for (let i = 0; i < 200; i++) {
      this.stars.push({
        x: Math.random() * 16000,
        y: Math.random() * 300,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random(),
        twinkleSpeed: Math.random() * 3 + 1,
      });
    }

    for (let i = 0; i < 60; i++) {
      this.bgMountains.push({
        x: i * 300,
        height: 80 + Math.random() * 120,
        width: 200 + Math.random() * 200,
      });
    }

    for (let i = 0; i < 40; i++) {
      this.bgCityLights.push({
        x: i * 400 + Math.random() * 200,
        y: 350 + Math.random() * 80,
        height: 20 + Math.random() * 60,
        width: 15 + Math.random() * 25,
        color: Math.random() > 0.5 ? '#ff6b35' : '#00ff88',
      });
    }
  }

  setTheme(theme) {
    this.theme = theme;
    this.themeConfig = TRACK_THEMES[theme] || TRACK_THEMES.desert;
  }

  setGhostRenderer(ghostRenderer) {
    this.ghostRenderer = ghostRenderer;
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  updateCamera(moto, dt) {
    this.targetCameraX = moto.x - this.canvas.width * 0.3;
    this.targetCameraY = moto.y - this.canvas.height * 0.5;

    const speed = Math.abs(moto.velocityX);
    const camSmooth = speed > 400 ? 0.08 : 0.06;
    this.cameraX += (this.targetCameraX - this.cameraX) * camSmooth;
    this.cameraY += (this.targetCameraY - this.cameraY) * 0.04;

    if (this.screenShake > 0) {
      this.screenShake *= 0.9;
      if (this.screenShake < 0.5) this.screenShake = 0;
    }

    if (speed > 500 && !moto.isCrashed) {
      for (let i = 0; i < 2; i++) {
        this.speedLines.push({
          x: moto.x + this.canvas.width * 0.3 + Math.random() * this.canvas.width * 0.5,
          y: moto.y - this.canvas.height / 2 + Math.random() * this.canvas.height,
          len: 30 + Math.random() * 60,
          life: 0.15 + Math.random() * 0.15,
          maxLife: 0.3,
        });
      }
    }
  }

  addScreenShake(amount) {
    this.screenShake = Math.min(this.screenShake + amount, 15);
  }

  addTrickPopup(text, x, y, color) {
    this.trickPopups.push({
      text,
      x,
      y,
      color: color || this.themeConfig.visual.accentColor,
      life: 2.0,
      maxLife: 2.0,
      scale: 0,
      targetScale: 1,
    });
  }

  addLandingParticles(x, y, count) {
    const particleType = this.themeConfig.visual.particleType;
    for (let i = 0; i < count; i++) {
      this.landingParticles.push({
        x: x + (Math.random() - 0.5) * 20,
        y,
        vx: (Math.random() - 0.5) * 200,
        vy: -Math.random() * 150 - 50,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1.0,
        size: 2 + Math.random() * 4,
        type: particleType,
      });
    }
  }

  addTrickParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      this.trickParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1.0,
        size: 2 + Math.random() * 3,
        color: color || this.themeConfig.visual.accentColor,
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.landingParticles.length - 1; i >= 0; i--) {
      const p = this.landingParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 400 * dt;
      p.life -= dt;
      if (p.life <= 0) this.landingParticles.splice(i, 1);
    }

    for (let i = this.trickParticles.length - 1; i >= 0; i--) {
      const p = this.trickParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.trickParticles.splice(i, 1);
    }

    for (let i = this.trickPopups.length - 1; i >= 0; i--) {
      const p = this.trickPopups[i];
      p.life -= dt;
      p.scale += (p.targetScale - p.scale) * 0.15;
      p.y -= 40 * dt;
      if (p.life < 0.5) p.targetScale = 0;
      if (p.life <= 0) this.trickPopups.splice(i, 1);
    }

    for (let i = this.speedLines.length - 1; i >= 0; i--) {
      this.speedLines[i].life -= dt;
      if (this.speedLines[i].life <= 0) this.speedLines.splice(i, 1);
    }

    if (this.speedLines.length > 40) {
      this.speedLines.splice(0, this.speedLines.length - 40);
    }
  }

  render(gameState, moto, terrain, gameTime, ghostPlayer = null) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();

    if (this.screenShake > 0) {
      ctx.translate(
        (Math.random() - 0.5) * this.screenShake * 2,
        (Math.random() - 0.5) * this.screenShake * 2
      );
    }

    this.drawSky(ctx, w, h, gameTime);
    this.drawStars(ctx, w, h, gameTime);
    this.drawMountains(ctx, w, h);
    this.drawCityLights(ctx, w, h);
    this.drawDecorations(ctx, terrain, w, h);
    this.drawTerrain(ctx, terrain, w, h);
    this.drawObstacles(ctx, terrain, w, h);
    this.drawFinishLine(ctx, terrain, w, h);
    this.drawSpeedLines(ctx, moto);

    if (ghostPlayer && ghostPlayer.hasData() && ghostPlayer.isActive()) {
      this.drawGhost(ctx, ghostPlayer);
    }

    this.drawGhostTrail(ctx, moto);
    this.drawExhaust(ctx, moto);
    this.drawLandingParticles(ctx);
    this.drawTrickParticles(ctx);
    this.drawMotorcycle(ctx, moto);
    this.drawTrickPopups(ctx);
    this.drawSpeedBoostGlow(ctx, moto, w, h);

    if (this.themeConfig.visual.ambientColor) {
      ctx.fillStyle = this.themeConfig.visual.ambientColor;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }

  drawSky(ctx, w, h, time) {
    const colors = this.themeConfig.visual.skyGradient;
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    colors.forEach((color, i) => {
      gradient.addColorStop(i / (colors.length - 1), color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  drawStars(ctx, w, h, time) {
    if (this.theme === 'moon' || this.theme === 'city') {
      this.stars.forEach(star => {
        const screenX = star.x - this.cameraX * 0.05;
        const sx = ((screenX % w) + w) % w;
        const sy = star.y - this.cameraY * 0.05;
        const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed);
        ctx.globalAlpha = star.brightness * twinkle;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
  }

  drawMountains(ctx, w, h) {
    const visual = this.themeConfig.visual;
    const mountainColor = visual.terrainColors[2] || '#0d1f35';
    const mountainColor2 = visual.terrainColors[3] || '#091828';

    ctx.fillStyle = mountainColor;
    this.bgMountains.forEach(m => {
      const screenX = m.x - this.cameraX * 0.15;
      if (screenX > -m.width && screenX < w + m.width) {
        const baseY = h * 0.65 - this.cameraY * 0.15;
        ctx.beginPath();
        ctx.moveTo(screenX - m.width / 2, baseY);
        ctx.lineTo(screenX, baseY - m.height);
        ctx.lineTo(screenX + m.width / 2, baseY);
        ctx.closePath();
        ctx.fill();
      }
    });

    ctx.fillStyle = mountainColor2;
    this.bgMountains.forEach((m, i) => {
      if (i % 2 === 0) return;
      const screenX = m.x - this.cameraX * 0.25 + 100;
      if (screenX > -m.width && screenX < w + m.width) {
        const baseY = h * 0.7 - this.cameraY * 0.25;
        ctx.beginPath();
        ctx.moveTo(screenX - m.width / 2, baseY);
        ctx.lineTo(screenX + 20, baseY - m.height * 0.7);
        ctx.lineTo(screenX + m.width / 2, baseY);
        ctx.closePath();
        ctx.fill();
      }
    });
  }

  drawCityLights(ctx, w, h) {
    if (this.theme !== 'city') return;

    this.bgCityLights.forEach(light => {
      const screenX = light.x - this.cameraX * 0.35;
      const screenY = light.y - this.cameraY * 0.35;
      if (screenX > -50 && screenX < w + 50) {
        ctx.fillStyle = '#0a1520';
        ctx.fillRect(screenX, screenY, light.width, light.height);

        const glowSize = light.width * 2;
        const glow = ctx.createRadialGradient(
          screenX + light.width / 2, screenY, 0,
          screenX + light.width / 2, screenY, glowSize
        );
        glow.addColorStop(0, light.color + '30');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(screenX - glowSize, screenY - glowSize, glowSize * 2, glowSize * 2);

        ctx.fillStyle = light.color;
        for (let wy = 0; wy < light.height; wy += 8) {
          if (Math.random() > 0.4) {
            ctx.fillRect(screenX + 3, screenY + wy, 3, 3);
          }
          if (Math.random() > 0.4) {
            ctx.fillRect(screenX + light.width - 6, screenY + wy, 3, 3);
          }
        }
      }
    });
  }

  drawDecorations(ctx, terrain, w, h) {
    const decorations = terrain.getDecorationsInRange(this.cameraX - 100, this.cameraX + w + 100);
    const accentColor = this.themeConfig.visual.accentColor;

    decorations.forEach(deco => {
      const sx = deco.x - this.cameraX;
      const sy = deco.y - this.cameraY;
      const scale = deco.scale;

      if (sx < -50 || sx > w + 50) return;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(scale, scale);

      switch (deco.type) {
        case 'cactus':
          ctx.fillStyle = '#2d5a27';
          ctx.fillRect(-4, -30, 8, 30);
          ctx.fillRect(-12, -20, 8, 4);
          ctx.fillRect(-12, -20, 4, 12);
          ctx.fillRect(4, -25, 8, 4);
          ctx.fillRect(8, -25, 4, 15);
          break;
        case 'rock':
          ctx.fillStyle = '#555';
          ctx.beginPath();
          ctx.moveTo(-15, 0);
          ctx.lineTo(-10, -12);
          ctx.lineTo(5, -15);
          ctx.lineTo(15, -8);
          ctx.lineTo(12, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 1;
          ctx.stroke();
          break;
        case 'pine':
          ctx.fillStyle = '#4a3728';
          ctx.fillRect(-3, -8, 6, 8);
          ctx.fillStyle = '#1a4a2a';
          ctx.beginPath();
          ctx.moveTo(0, -40);
          ctx.lineTo(-15, -20);
          ctx.lineTo(15, -20);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(0, -32);
          ctx.lineTo(-18, -15);
          ctx.lineTo(18, -15);
          ctx.closePath();
          ctx.fill();
          break;
        case 'barrel':
          ctx.fillStyle = '#8b4513';
          ctx.fillRect(-10, -25, 20, 25);
          ctx.strokeStyle = '#5c2a0a';
          ctx.lineWidth = 2;
          ctx.strokeRect(-10, -25, 20, 25);
          ctx.fillStyle = accentColor;
          ctx.fillRect(-8, -20, 16, 2);
          ctx.fillRect(-8, -10, 16, 2);
          break;
        case 'cone':
          ctx.fillStyle = '#ff6600';
          ctx.beginPath();
          ctx.moveTo(0, -25);
          ctx.lineTo(-12, 0);
          ctx.lineTo(12, 0);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-10, -15, 20, 3);
          ctx.fillRect(-9, -8, 18, 3);
          break;
        case 'crater':
          ctx.fillStyle = '#333';
          ctx.beginPath();
          ctx.ellipse(0, 0, 25, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#222';
          ctx.beginPath();
          ctx.ellipse(0, 2, 20, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
      }

      ctx.restore();
    });
  }

  drawTerrain(ctx, terrain, w, h) {
    const visual = this.themeConfig.visual;
    const colors = visual.terrainColors;
    const accentColor = visual.accentColor;
    const glowColor = visual.glowColor;

    const startX = Math.max(0, Math.floor((this.cameraX - 50) / terrain.segmentWidth));
    const endX = Math.min(
      terrain.points.length - 1,
      Math.ceil((this.cameraX + w + 50) / terrain.segmentWidth)
    );

    if (startX >= terrain.points.length) return;

    ctx.beginPath();
    ctx.moveTo(
      terrain.points[startX].x - this.cameraX,
      terrain.points[startX].y - this.cameraY
    );

    for (let i = startX; i <= endX; i++) {
      const p = terrain.points[i];
      ctx.lineTo(p.x - this.cameraX, p.y - this.cameraY);
    }

    const lastPoint = terrain.points[endX] || terrain.points[terrain.points.length - 1];
    ctx.lineTo(lastPoint.x - this.cameraX, h + 100);
    ctx.lineTo(terrain.points[startX].x - this.cameraX, h + 100);
    ctx.closePath();

    const terrainGrad = ctx.createLinearGradient(0, 300 - this.cameraY, 0, h);
    terrainGrad.addColorStop(0, colors[0] || '#2a1a0e');
    terrainGrad.addColorStop(0.3, colors[1] || '#1e140a');
    terrainGrad.addColorStop(1, colors[3] || '#0a0604');
    ctx.fillStyle = terrainGrad;
    ctx.fill();

    ctx.beginPath();
    for (let i = startX; i <= endX; i++) {
      const p = terrain.points[i];
      if (i === startX) {
        ctx.moveTo(p.x - this.cameraX, p.y - this.cameraY);
      } else {
        ctx.lineTo(p.x - this.cameraX, p.y - this.cameraY);
      }
    }
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    for (let i = startX; i <= endX; i++) {
      const p = terrain.points[i];
      if (i === startX) {
        ctx.moveTo(p.x - this.cameraX, p.y - this.cameraY + 5);
      } else {
        ctx.lineTo(p.x - this.cameraX, p.y - this.cameraY + 5);
      }
    }
    ctx.strokeStyle = accentColor + '30';
    ctx.lineWidth = 8;
    ctx.stroke();

    terrain.ramps.forEach(ramp => {
      const rsx = ramp.startX - this.cameraX;
      const rex = ramp.endX - this.cameraX;
      if (rex > 0 && rsx < w) {
        ctx.fillStyle = accentColor + '10';
        ctx.fillRect(rsx, 0, rex - rsx, h);
      }
    });
  }

  drawObstacles(ctx, terrain, w, h) {
    const accentColor = this.themeConfig.visual.accentColor;
    const obstacles = terrain.obstacles;

    obstacles.forEach(obs => {
      const sx = obs.x - this.cameraX;
      const sy = terrain.getHeight(obs.x + obs.width / 2) - this.cameraY;

      if (sx > -100 && sx < w + 100) {
        ctx.fillStyle = '#444';
        ctx.fillRect(sx, sy - obs.height, obs.width, obs.height);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(sx, sy - obs.height, obs.width, obs.height);
      }
    });
  }

  drawFinishLine(ctx, terrain, w, h) {
    const accentColor = this.themeConfig.visual.accentColor;
    const fx = terrain.finishX - this.cameraX;
    const fy = terrain.getHeight(terrain.finishX) - this.cameraY;

    if (fx > -50 && fx < w + 50) {
      ctx.fillStyle = accentColor;
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 15;
      ctx.fillRect(fx - 3, fy - 150, 6, 150);
      ctx.shadowBlur = 0;

      const flagW = 40;
      const flagH = 25;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          ctx.fillStyle = (row + col) % 2 === 0 ? '#ffffff' : '#000000';
          ctx.fillRect(fx + 3 + col * (flagW / 3), fy - 150 + row * (flagH / 3), flagW / 3, flagH / 3);
        }
      }

      ctx.font = 'bold 16px Orbitron, monospace';
      ctx.fillStyle = accentColor;
      ctx.textAlign = 'center';
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 10;
      ctx.fillText('FINISH', fx + 20, fy - 160);
      ctx.shadowBlur = 0;
    }
  }

  drawSpeedLines(ctx, moto) {
    const accentColor = this.themeConfig.visual.accentColor;
    this.speedLines.forEach(line => {
      const sx = line.x - this.cameraX;
      const sy = line.y - this.cameraY;
      const alpha = line.life / line.maxLife;
      ctx.globalAlpha = alpha * 0.3;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - line.len, sy);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  drawGhost(ctx, ghostPlayer) {
    const ghostPos = ghostPlayer.getPosition();
    const sx = ghostPos.x - this.cameraX;
    const sy = ghostPos.y - this.cameraY;

    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.translate(sx, sy);
    ctx.rotate(ghostPos.angle);

    ctx.fillStyle = '#00ff8840';
    ctx.strokeStyle = '#00ff8880';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 15;

    const bodyLen = 50;
    const bodyH = 12;
    ctx.beginPath();
    ctx.moveTo(-bodyLen / 2, -bodyH);
    ctx.lineTo(bodyLen / 2 - 5, -bodyH - 8);
    ctx.lineTo(bodyLen / 2 + 5, -bodyH);
    ctx.lineTo(bodyLen / 2, 0);
    ctx.lineTo(-bodyLen / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    this.drawWheelGhost(ctx, -20, 5, 10);
    this.drawWheelGhost(ctx, 22, 5, 10);

    ctx.shadowBlur = 0;
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawWheelGhost(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#00ff8820';
    ctx.fill();
    ctx.strokeStyle = '#00ff8860';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  drawGhostTrail(ctx, moto) {
    if (!moto.ghostTrail) return;
    const accentColor = this.themeConfig.visual.accentColor;
    moto.ghostTrail.forEach(ghost => {
      const sx = ghost.x - this.cameraX;
      const sy = ghost.y - this.cameraY;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(ghost.angle);
      ctx.globalAlpha = ghost.alpha * 0.4;
      ctx.fillStyle = accentColor + '40';
      ctx.strokeStyle = accentColor + '60';
      ctx.lineWidth = 1;

      const bodyLen = 50;
      const bodyH = 12;
      ctx.beginPath();
      ctx.moveTo(-bodyLen / 2, -bodyH);
      ctx.lineTo(bodyLen / 2 - 5, -bodyH - 8);
      ctx.lineTo(bodyLen / 2 + 5, -bodyH);
      ctx.lineTo(bodyLen / 2, 0);
      ctx.lineTo(-bodyLen / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }

  drawMotorcycle(ctx, moto) {
    if (moto.isCrashed) {
      ctx.globalAlpha = Math.max(0, 1 - (Date.now() - moto.crashTime) / 2000);
    }

    const screenX = moto.x - this.cameraX;
    const screenY = moto.y - this.cameraY;
    const visual = this.themeConfig.visual;
    const accentColor = visual.accentColor;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(moto.angle);

    const bodyLen = 50;
    const bodyH = 12;
    const wheelBase = 50;
    const wheelRadius = 12;

    const frontCompression = moto.frontWheel ? moto.frontWheel.compression : 0;
    const rearCompression = moto.rearWheel ? moto.rearWheel.compression : 0;

    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-wheelBase / 2, wheelRadius + rearCompression);
    ctx.lineTo(-5, -bodyH + 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(wheelBase / 2, wheelRadius + frontCompression);
    ctx.lineTo(10, -bodyH + 2);
    ctx.stroke();

    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.moveTo(-bodyLen / 2, -bodyH);
    ctx.lineTo(bodyLen / 2 - 5, -bodyH - 8);
    ctx.lineTo(bodyLen / 2 + 5, -bodyH);
    ctx.lineTo(bodyLen / 2, 0);
    ctx.lineTo(-bodyLen / 2, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const engineGlow = ctx.createLinearGradient(-5, -bodyH, 15, 0);
    engineGlow.addColorStop(0, accentColor + '40');
    engineGlow.addColorStop(1, accentColor + '05');
    ctx.fillStyle = engineGlow;
    ctx.fillRect(-5, -bodyH, 20, bodyH);

    this.drawWheel(ctx, -wheelBase / 2, wheelRadius + rearCompression, wheelRadius - 2, moto.wheelAngle, rearCompression);
    this.drawWheel(ctx, wheelBase / 2, wheelRadius + frontCompression, wheelRadius - 2, moto.wheelAngle, frontCompression);

    if (moto.supermanState && moto.supermanState.active) {
      this.drawSupermanPose(ctx, bodyLen, bodyH);
    } else {
      ctx.beginPath();
      ctx.moveTo(20, -bodyH);
      ctx.lineTo(28, -bodyH - 20);
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(5, -bodyH - 5);
      ctx.lineTo(15, -bodyH - 25);
      ctx.lineTo(25, -bodyH - 28);
      ctx.lineTo(30, -bodyH - 20);
      ctx.lineTo(15, -bodyH - 18);
      ctx.closePath();
      ctx.fillStyle = '#2a1a3e';
      ctx.fill();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(28, -bodyH - 22, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#0a1628';
      ctx.fill();
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    if (moto.driftState && moto.driftState.isDrifting) {
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = visual.glowColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    if (moto.getSpeed() > 600) {
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 15;
      ctx.strokeStyle = accentColor + '40';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-bodyLen / 2, -bodyH - 2);
      ctx.lineTo(bodyLen / 2, -bodyH - 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawSupermanPose(ctx, bodyLen, bodyH) {
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(15, -bodyH - 5);
    ctx.lineTo(35, -bodyH - 35);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(5, -bodyH - 5);
    ctx.lineTo(-15, -bodyH - 25);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(35, -bodyH - 38, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#2a1a3e';
    ctx.fill();
    ctx.strokeStyle = this.themeConfig.visual.accentColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-5, -bodyH + 5);
    ctx.lineTo(-25, -bodyH - 10);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  drawWheel(ctx, x, y, radius, rotation, compression) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const compressedRadius = radius - Math.min(compression * 0.3, radius * 0.3);

    ctx.beginPath();
    ctx.ellipse(0, 0, radius, compressedRadius, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, radius - 3, 0, Math.PI * 2);
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * (radius - 2), Math.sin(angle) * (radius - 2));
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#444';
    ctx.fill();

    ctx.restore();
  }

  drawExhaust(ctx, moto) {
    const visual = this.themeConfig.visual;
    moto.exhaustParticles.forEach(p => {
      const screenX = p.x - this.cameraX;
      const screenY = p.y - this.cameraY;
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha * 0.6;
      const intensity = p.intensity || 0.5;

      let color;
      if (visual.particleType === 'sand') {
        color = 'rgba(210, 180, 140, ' + (alpha * 0.6) + ')';
      } else if (visual.particleType === 'snow') {
        color = 'rgba(200, 230, 255, ' + (alpha * 0.6) + ')';
      } else if (visual.particleType === 'spark') {
        const r = Math.floor(255 * intensity);
        const g = Math.floor(100 * (1 - intensity * 0.5));
        const b = Math.floor(50 * (1 - intensity));
        color = 'rgb(' + r + ',' + g + ',' + b + ')';
      } else {
        color = 'rgba(200, 200, 200, ' + (alpha * 0.6) + ')';
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  drawLandingParticles(ctx) {
    const visual = this.themeConfig.visual;
    this.landingParticles.forEach(p => {
      const screenX = p.x - this.cameraX;
      const screenY = p.y - this.cameraY;
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha * 0.7;

      let color;
      if (p.type === 'sand') {
        color = '#d4a574';
      } else if (p.type === 'snow') {
        color = '#e8f4f8';
      } else if (p.type === 'spark') {
        color = visual.accentColor;
      } else {
        color = '#8B7355';
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  drawTrickParticles(ctx) {
    this.trickParticles.forEach(p => {
      const screenX = p.x - this.cameraX;
      const screenY = p.y - this.cameraY;
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  drawTrickPopups(ctx) {
    this.trickPopups.forEach(popup => {
      const screenX = popup.x - this.cameraX;
      const screenY = popup.y - this.cameraY;
      const alpha = Math.min(1, popup.life / (popup.maxLife * 0.3));
      const scale = popup.scale;

      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;

      ctx.font = 'bold 28px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.shadowColor = popup.color;
      ctx.shadowBlur = 20;
      ctx.fillStyle = popup.color;
      ctx.fillText(popup.text, 0, 0);
      ctx.shadowBlur = 0;

      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }

  drawSpeedBoostGlow(ctx, moto, w, h) {
    if (moto.getSpeed() > 500 && !moto.isCrashed) {
      const intensity = Math.min(1, (moto.getSpeed() - 500) / 400);
      const screenX = moto.x - this.cameraX;
      const screenY = moto.y - this.cameraY;
      const accentColor = this.themeConfig.visual.accentColor;

      const glow = ctx.createRadialGradient(
        screenX, screenY, 0,
        screenX, screenY, 100
      );
      glow.addColorStop(0, accentColor + Math.floor(intensity * 38).toString(16).padStart(2, '0'));
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(screenX - 100, screenY - 100, 200, 200);
    }
  }
}

window.Renderer = Renderer;
