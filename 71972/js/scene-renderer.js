const SceneRenderer = {
  canvas: null,
  ctx: null,
  currentScene: 'grassland',
  weatherType: 'sunny',
  temperature: 25,
  humidity: 50,
  pressure: 1013,
  windSpeed: 10,
  waveOffset: 0,
  cloudPositions: [],
  time: 0,

  puddleSeeds: [],

  _initPuddleSeeds() {
    this.puddleSeeds = [];
    for (let i = 0; i < 12; i++) {
      this.puddleSeeds.push({
        rx: Math.random(),
        ry: Math.random(),
        size1: 15 + Math.random() * 20,
        size2: 3 + Math.random() * 3
      });
    }
  },

  grassSeeds: [],

  _initGrassSeeds() {
    this.grassSeeds = [];
    for (let i = 0; i < 80; i++) {
      this.grassSeeds.push({
        offset: Math.random() * 10,
        yOffset: Math.random(),
        height: 12 + Math.random() * 18,
        bendMul1: 0.5 + Math.random(),
        bendMul2: 0.8 + Math.random()
      });
    }
  },

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._initClouds();
    this._initWindowSeeds();
    this._initPuddleSeeds();
    this._initGrassSeeds();
  },

  _initClouds() {
    this.cloudPositions = [];
    for (let i = 0; i < 6; i++) {
      this.cloudPositions.push({
        x: Math.random() * 2000,
        y: 30 + Math.random() * 120,
        width: 120 + Math.random() * 180,
        height: 40 + Math.random() * 30,
        speed: 0.2 + Math.random() * 0.4,
        opacity: 0.6 + Math.random() * 0.4
      });
    }
  },

  setScene(scene) {
    this.currentScene = scene;
  },

  setWeather(weatherType, temperature, humidity, pressure, windSpeed) {
    this.weatherType = weatherType;
    this.temperature = temperature;
    this.humidity = humidity;
    this.pressure = pressure;
    this.windSpeed = windSpeed;
  },

  update() {
    this.time += 0.016;
    this.waveOffset += 0.03;

    this.cloudPositions.forEach(c => {
      c.x += c.speed * (1 + this.windSpeed * 0.03);
      if (c.x > this.canvas.width + c.width) {
        c.x = -c.width;
      }
    });
  },

  buildingWindowSeeds: [],

  _initWindowSeeds() {
    this.buildingWindowSeeds = [];
    for (let i = 0; i < 500; i++) {
      this.buildingWindowSeeds.push(Math.random() > 0.35);
    }
  },

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    this._renderSky(ctx, w, h);
    this._renderClouds(ctx, w, h);

    if (this.currentScene === 'grassland') {
      this._renderGrassland(ctx, w, h);
    } else if (this.currentScene === 'ocean') {
      this._renderOcean(ctx, w, h);
    } else if (this.currentScene === 'city') {
      this._renderCity(ctx, w, h);
    }
  },

  _renderSky(ctx, w, h) {
    const colors = WeatherEngine.getSkyColors(this.weatherType, this.temperature);
    const gradient = ctx.createLinearGradient(0, 0, 0, h * 0.65);
    gradient.addColorStop(0, colors.top);
    gradient.addColorStop(0.5, colors.mid);
    gradient.addColorStop(1, colors.bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h * 0.65);
  },

  _renderClouds(ctx, w, h) {
    const opacity = {
      sunny: 0.2,
      cloudy: 0.85,
      rain: 0.9,
      snow: 0.7,
      storm: 0.95
    };
    const baseOpacity = opacity[this.weatherType] || 0.5;

    this.cloudPositions.forEach(c => {
      ctx.globalAlpha = c.opacity * baseOpacity;
      const isDark = this.weatherType === 'storm' || this.weatherType === 'rain';
      const color = isDark ? 'rgb(60,60,70)' : (this.weatherType === 'snow' ? 'rgb(200,210,220)' : 'rgb(230,235,240)');
      this._drawCloud(ctx, c.x, c.y, c.width, c.height, color);
    });
    ctx.globalAlpha = 1;
  },

  _drawCloud(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.4, h * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - w * 0.25, y + h * 0.15, w * 0.3, h * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w * 0.25, y + h * 0.1, w * 0.35, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w * 0.1, y - h * 0.2, w * 0.25, h * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  _renderGrassland(ctx, w, h) {
    const groundY = h * 0.6;
    const isSnowy = this.weatherType === 'snow';
    const isDry = this.temperature > 35;

    const groundGradient = ctx.createLinearGradient(0, groundY, 0, h);
    if (isSnowy) {
      groundGradient.addColorStop(0, '#e8edf2');
      groundGradient.addColorStop(1, '#cdd5de');
    } else if (isDry) {
      groundGradient.addColorStop(0, '#b8a640');
      groundGradient.addColorStop(1, '#8b7d3c');
    } else {
      groundGradient.addColorStop(0, '#4a7c3f');
      groundGradient.addColorStop(1, '#3a6232');
    }
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, groundY, w, h - groundY);

    const hillColor = isSnowy ? '#d5dde5' : (isDry ? '#c4a83a' : '#5a9a4a');
    ctx.fillStyle = hillColor;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 20);
    ctx.quadraticCurveTo(w * 0.15, groundY - 40, w * 0.3, groundY + 10);
    ctx.quadraticCurveTo(w * 0.45, groundY - 25, w * 0.6, groundY + 15);
    ctx.quadraticCurveTo(w * 0.8, groundY - 35, w, groundY + 5);
    ctx.lineTo(w, groundY + 30);
    ctx.lineTo(0, groundY + 30);
    ctx.closePath();
    ctx.fill();

    this._renderGrass(ctx, w, h, groundY);
  },

  _renderGrass(ctx, w, h, groundY) {
    const isSnowy = this.weatherType === 'snow';
    const grassColor = isSnowy ? '#b8c6d4' : (this.temperature > 35 ? '#a89630' : '#3d7a2e');
    const bendFactor = this.windSpeed * 0.3;

    for (let i = 0; i < 80; i++) {
      const seed = this.grassSeeds[i];
      const x = (w / 80) * i + seed.offset;
      const baseY = groundY + 10 + seed.yOffset * (h - groundY - 30);

      ctx.strokeStyle = grassColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.quadraticCurveTo(
        x + bendFactor * seed.bendMul1,
        baseY - seed.height * 0.6,
        x + bendFactor * seed.bendMul2,
        baseY - seed.height
      );
      ctx.stroke();
    }
  },

  _renderOcean(ctx, w, h) {
    const beachY = h * 0.45;
    const waterY = h * 0.52;

    const beachGradient = ctx.createLinearGradient(0, beachY, 0, waterY);
    beachGradient.addColorStop(0, '#e8d5b7');
    beachGradient.addColorStop(0.6, '#dbc9a0');
    beachGradient.addColorStop(1, '#c4a870');
    ctx.fillStyle = beachGradient;
    ctx.fillRect(0, beachY, w, waterY - beachY);

    ctx.fillStyle = '#d4c098';
    ctx.beginPath();
    ctx.moveTo(0, beachY + 5);
    ctx.quadraticCurveTo(w * 0.2, beachY - 8, w * 0.4, beachY + 3);
    ctx.quadraticCurveTo(w * 0.6, beachY - 5, w * 0.8, beachY + 4);
    ctx.quadraticCurveTo(w * 0.9, beachY - 3, w, beachY + 2);
    ctx.lineTo(w, beachY + 10);
    ctx.lineTo(0, beachY + 10);
    ctx.closePath();
    ctx.fill();

    const waterGradient = ctx.createLinearGradient(0, waterY, 0, h);

    if (this.weatherType === 'storm') {
      waterGradient.addColorStop(0, '#1a3a4a');
      waterGradient.addColorStop(1, '#0d1f2d');
    } else if (this.weatherType === 'rain') {
      waterGradient.addColorStop(0, '#2c5f7c');
      waterGradient.addColorStop(1, '#1a3a4a');
    } else {
      waterGradient.addColorStop(0, '#2196f3');
      waterGradient.addColorStop(1, '#0d47a1');
    }
    ctx.fillStyle = waterGradient;
    ctx.fillRect(0, waterY, w, h - waterY);

    ctx.fillStyle = 'rgba(150,200,255,0.15)';
    ctx.fillRect(0, waterY, w, 8);

    const waveAmplitude = this.weatherType === 'storm' ? 15 : (this.weatherType === 'rain' ? 8 : 3);
    const waveColor = this.weatherType === 'storm' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.25)';

    for (let wave = 0; wave < 5; wave++) {
      const y = waterY + 15 + wave * 25;
      ctx.strokeStyle = waveColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x < w; x += 3) {
        const wy = y + Math.sin((x * 0.015) + this.waveOffset + wave * 1.5) * waveAmplitude;
        if (x === 0) ctx.moveTo(x, wy);
        else ctx.lineTo(x, wy);
      }
      ctx.stroke();
    }

    if (this.weatherType === 'sunny') {
      const sunReflect = ctx.createLinearGradient(w * 0.7, waterY, w * 0.9, h);
      sunReflect.addColorStop(0, 'rgba(255,220,50,0.15)');
      sunReflect.addColorStop(1, 'rgba(255,220,50,0)');
      ctx.fillStyle = sunReflect;
      ctx.fillRect(w * 0.7, waterY, w * 0.2, h - waterY);

      this._drawBoat(ctx, w * 0.6, waterY + 20);
    }
  },

  _drawBoat(ctx, x, y) {
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.moveTo(x - 20, y);
    ctx.lineTo(x - 25, y + 10);
    ctx.lineTo(x + 25, y + 10);
    ctx.lineTo(x + 20, y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(x + 3, y - 5);
    ctx.lineTo(x + 3, y - 30);
    ctx.lineTo(x + 20, y - 5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 3, y - 5);
    ctx.lineTo(x + 3, y + 5);
    ctx.stroke();
  },

  _renderCity(ctx, w, h) {
    const groundY = h * 0.65;

    const roadGradient = ctx.createLinearGradient(0, groundY, 0, h);
    if (this.weatherType === 'snow') {
      roadGradient.addColorStop(0, '#d0d8e0');
      roadGradient.addColorStop(1, '#b8c4d0');
    } else {
      roadGradient.addColorStop(0, '#4a4a4a');
      roadGradient.addColorStop(1, '#333333');
    }
    ctx.fillStyle = roadGradient;
    ctx.fillRect(0, groundY, w, h - groundY);

    if ((this.weatherType === 'rain' || this.weatherType === 'storm') && this.weatherType !== 'snow') {
      ctx.fillStyle = 'rgba(100,150,200,0.15)';
      ctx.fillRect(0, groundY, w, h - groundY);
    }

    const buildings = [
      { x: 0.05, w: 0.1, h: 0.28, color: '#5c6370' },
      { x: 0.16, w: 0.08, h: 0.38, color: '#4a5568' },
      { x: 0.25, w: 0.12, h: 0.32, color: '#6b7280' },
      { x: 0.38, w: 0.09, h: 0.45, color: '#4b5563' },
      { x: 0.48, w: 0.11, h: 0.35, color: '#5c6370' },
      { x: 0.6, w: 0.08, h: 0.42, color: '#6b7280' },
      { x: 0.69, w: 0.13, h: 0.3, color: '#4a5568' },
      { x: 0.83, w: 0.1, h: 0.36, color: '#5c6370' }
    ];

    buildings.forEach(b => {
      const bx = b.x * w;
      const bw = b.w * w;
      const bh = b.h * h;
      const by = groundY - bh;

      ctx.fillStyle = b.color;
      ctx.fillRect(bx, by, bw, bh);

      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, bh);

      const windowCols = Math.floor(bw / 18);
      const windowRows = Math.floor(bh / 22);
      for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
          const wx = bx + 6 + col * (bw - 12) / Math.max(1, windowCols);
          const wy = by + 10 + row * 22;
          const isLit = this.buildingWindowSeeds[(row * windowCols + col) % this.buildingWindowSeeds.length] || this.weatherType === 'storm';
          if (this.weatherType === 'storm' && ParticleEngine.lightningFlash > 0) {
            ctx.fillStyle = 'rgba(200,200,255,0.3)';
          } else {
            ctx.fillStyle = isLit ? 'rgba(255, 230, 120, 0.8)' : 'rgba(30,40,50,0.6)';
          }
          ctx.fillRect(wx, wy, 8, 12);
        }
      }

      if (this.weatherType === 'snow') {
        ctx.fillStyle = '#e8edf2';
        ctx.beginPath();
        ctx.moveTo(bx - 3, by);
        ctx.lineTo(bx + bw / 2, by - 10);
        ctx.lineTo(bx + bw + 3, by);
        ctx.closePath();
        ctx.fill();
      }
    });

    if (this.weatherType === 'rain' || this.weatherType === 'storm') {
      this.puddleSeeds.forEach(ps => {
        const px = ps.rx * w;
        const py = groundY + 5 + ps.ry * 30;
        ctx.fillStyle = 'rgba(150,200,255,0.2)';
        ctx.beginPath();
        ctx.ellipse(px, py, ps.size1, ps.size2, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  },

  resize() {
  }
};
