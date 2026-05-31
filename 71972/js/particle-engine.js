const ParticleEngine = {
  canvas: null,
  ctx: null,
  particles: [],
  weatherType: 'sunny',
  windSpeed: 10,
  lightningTimer: 0,
  lightningFlash: 0,
  sunRays: [],
  fogParticles: [],

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._initSunRays();
    this._initFog();
  },

  _initSunRays() {
    this.sunRays = [];
    for (let i = 0; i < 8; i++) {
      this.sunRays.push({
        angle: (Math.PI * 2 / 8) * i,
        length: 80 + Math.random() * 60,
        width: 2 + Math.random() * 3,
        speed: 0.002 + Math.random() * 0.003,
        opacity: 0.15 + Math.random() * 0.15
      });
    }
  },

  _initFog() {
    this.fogParticles = [];
    for (let i = 0; i < 15; i++) {
      this.fogParticles.push({
        x: Math.random() * 2000,
        y: Math.random() * 600 + 200,
        radius: 100 + Math.random() * 200,
        speed: 0.2 + Math.random() * 0.5,
        opacity: 0.03 + Math.random() * 0.06
      });
    }
  },

  setWeather(type, windSpeed) {
    this.weatherType = type;
    this.windSpeed = windSpeed;
    this.particles = [];
    this._generateParticles();
  },

  _generateParticles() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const count = this._getParticleCount();
    for (let i = 0; i < count; i++) {
      this.particles.push(this._createParticle(w, h, true));
    }
  },

  _getParticleCount() {
    const counts = {
      sunny: 0,
      cloudy: 0,
      rain: 300,
      snow: 200,
      storm: 450
    };
    return counts[this.weatherType] || 0;
  },

  _createParticle(w, h, randomY) {
    const type = this.weatherType;
    if (type === 'rain' || type === 'storm') {
      return {
        x: Math.random() * w * 1.2 - w * 0.1,
        y: randomY ? Math.random() * h : -10,
        speed: 8 + Math.random() * 8 + (type === 'storm' ? 6 : 0),
        length: 15 + Math.random() * 15,
        opacity: 0.3 + Math.random() * 0.5,
        windOffset: this.windSpeed * 0.05
      };
    } else if (type === 'snow') {
      return {
        x: Math.random() * w * 1.2 - w * 0.1,
        y: randomY ? Math.random() * h : -10,
        speed: 1 + Math.random() * 2,
        radius: 2 + Math.random() * 4,
        opacity: 0.5 + Math.random() * 0.5,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.02 + Math.random() * 0.03,
        windOffset: this.windSpeed * 0.02
      };
    }
    return { x: 0, y: 0, speed: 0 };
  },

  update() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (this.weatherType === 'rain' || this.weatherType === 'storm') {
        p.y += p.speed;
        p.x += p.windOffset;
        if (p.y > h) {
          this.particles[i] = this._createParticle(w, h, false);
        }
      } else if (this.weatherType === 'snow') {
        p.y += p.speed;
        p.wobble += p.wobbleSpeed;
        p.x += Math.sin(p.wobble) * 0.5 + p.windOffset;
        if (p.y > h) {
          this.particles[i] = this._createParticle(w, h, false);
        }
      }
    }

    if (this.weatherType === 'storm') {
      this.lightningTimer++;
      if (this.lightningTimer > 120 + Math.random() * 180) {
        this.lightningFlash = 8;
        this.lightningTimer = 0;
      }
      if (this.lightningFlash > 0) this.lightningFlash--;
    }

    this.sunRays.forEach(r => {
      r.angle += r.speed;
    });

    this.fogParticles.forEach(f => {
      f.x += f.speed;
      if (f.x > this.canvas.width + f.radius) {
        f.x = -f.radius;
      }
    });
  },

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (this.weatherType === 'sunny') {
      this._renderSunEffect(ctx, w, h);
    }

    if (this.weatherType === 'rain' || this.weatherType === 'storm') {
      this._renderRain(ctx);
    } else if (this.weatherType === 'snow') {
      this._renderSnow(ctx);
    }

    if (this.weatherType === 'storm' && this.lightningFlash > 0) {
      this._renderLightning(ctx, w, h);
    }

    if (this.weatherType === 'cloudy' || this.weatherType === 'rain') {
      this._renderFog(ctx, w, h, 0.3);
    }
    if (this.weatherType === 'storm') {
      this._renderFog(ctx, w, h, 0.5);
    }
  },

  _renderSunEffect(ctx, w, h) {
    const sunX = w * 0.8;
    const sunY = h * 0.15;
    const gradient = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 100);
    gradient.addColorStop(0, 'rgba(255, 220, 50, 0.9)');
    gradient.addColorStop(0.3, 'rgba(255, 200, 50, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 200, 50, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 100, 0, Math.PI * 2);
    ctx.fill();

    this.sunRays.forEach(ray => {
      ctx.save();
      ctx.translate(sunX, sunY);
      ctx.rotate(ray.angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(ray.length, -ray.width / 2);
      ctx.lineTo(ray.length, ray.width / 2);
      ctx.closePath();
      ctx.fillStyle = `rgba(255, 230, 100, ${ray.opacity})`;
      ctx.fill();
      ctx.restore();
    });
  },

  _renderRain(ctx) {
    ctx.strokeStyle = 'rgba(174, 214, 241, 0.6)';
    ctx.lineWidth = 1.5;
    this.particles.forEach(p => {
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.windOffset * 2, p.y + p.length);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  },

  _renderSnow(ctx) {
    this.particles.forEach(p => {
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  },

  _renderLightning(ctx, w, h) {
    ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlash * 0.08})`;
    ctx.fillRect(0, 0, w, h);

    if (this.lightningFlash > 5) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      let lx = w * (0.3 + Math.random() * 0.4);
      let ly = 0;
      ctx.moveTo(lx, ly);
      while (ly < h * 0.7) {
        lx += (Math.random() - 0.5) * 60;
        ly += 20 + Math.random() * 30;
        ctx.lineTo(lx, ly);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  },

  _renderFog(ctx, w, h, baseOpacity) {
    this.fogParticles.forEach(f => {
      const gradient = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
      gradient.addColorStop(0, `rgba(180, 190, 200, ${f.opacity * baseOpacity * 5})`);
      gradient.addColorStop(1, 'rgba(180, 190, 200, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(f.x - f.radius, f.y - f.radius, f.radius * 2, f.radius * 2);
    });
  },

  resize() {
    this.particles = [];
    this._generateParticles();
  }
};
