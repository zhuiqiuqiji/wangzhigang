class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.starCanvas = null;
    this.stars = [];
    this.pulsePhase = 0;
    this._initStars();
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this._initStars();
  }

  _initStars() {
    this.stars = [];
    const count = Math.floor((this.canvas.width * this.canvas.height) / 800);
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 1.8 + 0.2,
        brightness: Math.random() * 0.6 + 0.4,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }

  render(planets, viewState, timeState, selectedPlanet) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2 + viewState.offsetX;
    const cy = h / 2 + viewState.offsetY;

    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, w, h);

    this._drawNebula(ctx, w, h);
    this._drawStars(ctx);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(viewState.zoom, viewState.zoom);
    ctx.rotate(viewState.rotation);

    this._drawOrbits(ctx, planets, selectedPlanet);
    this._drawSun(ctx);
    this._drawPlanets(ctx, planets, selectedPlanet);

    ctx.restore();

    this.pulsePhase += 0.02;
  }

  _drawNebula(ctx, w, h) {
    const nebulae = [
      { x: w * 0.15, y: h * 0.2, r: 250, color1: 'rgba(30,10,60,0.15)', color2: 'rgba(30,10,60,0)' },
      { x: w * 0.85, y: h * 0.7, r: 300, color1: 'rgba(10,20,60,0.12)', color2: 'rgba(10,20,60,0)' },
      { x: w * 0.5, y: h * 0.9, r: 200, color1: 'rgba(40,10,40,0.1)', color2: 'rgba(40,10,40,0)' },
    ];
    nebulae.forEach(n => {
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      grad.addColorStop(0, n.color1);
      grad.addColorStop(1, n.color2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    });
  }

  _drawStars(ctx) {
    this.stars.forEach(star => {
      star.twinklePhase += star.twinkleSpeed;
      const twinkle = 0.5 + 0.5 * Math.sin(star.twinklePhase);
      const alpha = star.brightness * (0.6 + 0.4 * twinkle);
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,230,255,${alpha})`;
      ctx.fill();
    });
  }

  _drawSun(ctx) {
    const pulse = 1 + 0.08 * Math.sin(this.pulsePhase);
    const sunRadius = 22;

    for (let i = 4; i >= 0; i--) {
      const r = sunRadius * (1 + i * 0.8) * pulse;
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      const alpha = 0.12 - i * 0.02;
      grad.addColorStop(0, `rgba(255,200,50,${alpha})`);
      grad.addColorStop(0.5, `rgba(255,150,20,${alpha * 0.5})`);
      grad.addColorStop(1, 'rgba(255,100,0,0)');
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    const sunGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sunRadius * pulse);
    sunGrad.addColorStop(0, '#fff8e0');
    sunGrad.addColorStop(0.3, '#ffe066');
    sunGrad.addColorStop(0.7, '#f0a020');
    sunGrad.addColorStop(1, '#e06010');
    ctx.beginPath();
    ctx.arc(0, 0, sunRadius * pulse, 0, Math.PI * 2);
    ctx.fillStyle = sunGrad;
    ctx.fill();

    const coronaGrad = ctx.createRadialGradient(0, 0, sunRadius * 0.8, 0, 0, sunRadius * 2.5 * pulse);
    coronaGrad.addColorStop(0, 'rgba(255,200,50,0.3)');
    coronaGrad.addColorStop(0.5, 'rgba(255,150,30,0.1)');
    coronaGrad.addColorStop(1, 'rgba(255,100,0,0)');
    ctx.beginPath();
    ctx.arc(0, 0, sunRadius * 2.5 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = coronaGrad;
    ctx.fill();
  }

  _drawOrbits(ctx, planets, selectedPlanet) {
    planets.forEach(planet => {
      const isSelected = selectedPlanet && selectedPlanet.nameEn === planet.nameEn;
      ctx.beginPath();
      ctx.arc(0, 0, planet.displayOrbitRadius, 0, Math.PI * 2);
      if (isSelected) {
        ctx.strokeStyle = 'rgba(240,192,64,0.25)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  _drawPlanets(ctx, planets, selectedPlanet) {
    planets.forEach(planet => {
      const x = Math.cos(planet.angle) * planet.displayOrbitRadius;
      const y = Math.sin(planet.angle) * planet.displayOrbitRadius;
      planet.x = x;
      planet.y = y;

      const isSelected = selectedPlanet && selectedPlanet.nameEn === planet.nameEn;

      const glowSize = isSelected ? planet.displayRadius * 6 : planet.displayRadius * 4;
      const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
      glowGrad.addColorStop(0, planet.glowColor);
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(x, y, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      if (isSelected) {
        const ringPhase = this.pulsePhase * 2;
        const ringAlpha = 0.3 + 0.15 * Math.sin(ringPhase);
        ctx.beginPath();
        ctx.arc(x, y, planet.displayRadius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(240,192,64,${ringAlpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, planet.displayRadius + 10, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(240,192,64,${ringAlpha * 0.4})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (planet.hasRing) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, 0.35);
        ctx.beginPath();
        ctx.arc(0, 0, planet.displayRadius * 2.2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(210,190,140,0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, planet.displayRadius * 1.8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(200,180,130,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      const planetGrad = ctx.createRadialGradient(
        x - planet.displayRadius * 0.3,
        y - planet.displayRadius * 0.3,
        0,
        x, y, planet.displayRadius
      );
      planetGrad.addColorStop(0, this._lightenColor(planet.color, 40));
      planetGrad.addColorStop(0.7, planet.color);
      planetGrad.addColorStop(1, this._darkenColor(planet.color, 40));
      ctx.beginPath();
      ctx.arc(x, y, planet.displayRadius, 0, Math.PI * 2);
      ctx.fillStyle = planetGrad;
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `${10}px "Orbitron", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(planet.name, x, y - planet.displayRadius - 8);
    });
  }

  _lightenColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
    const b = Math.min(255, (num & 0x0000FF) + amount);
    return `rgb(${r},${g},${b})`;
  }

  _darkenColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
    const b = Math.max(0, (num & 0x0000FF) - amount);
    return `rgb(${r},${g},${b})`;
  }
}
