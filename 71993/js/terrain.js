class Terrain {
  constructor(length, theme = 'desert', seed = Date.now()) {
    this.length = length || 12000;
    this.theme = theme;
    this.seed = seed;
    this.points = [];
    this.segmentWidth = 8;
    this.ramps = [];
    this.obstacles = [];
    this.decorations = [];
    this.finishX = this.length;

    this.themeConfig = TRACK_THEMES[theme] || TRACK_THEMES.desert;
    this.terrainParams = this.themeConfig.terrain || {};

    this.generate();
  }

  generate() {
    this.points = [];
    this.ramps = [];
    this.obstacles = [];
    this.decorations = [];

    this.random = this.seededRandom(this.seed);

    const numPoints = Math.ceil(this.length / this.segmentWidth) + 1;

    for (let i = 0; i < numPoints; i++) {
      const x = i * this.segmentWidth;
      const y = this.getBaseHeight(x);
      this.points.push({ x, y });
    }

    this.addObstacles();
    this.addRamps();
    this.smoothTerrain(3);
    this.generateDecorations();
  }

  seededRandom(seed) {
    let s = seed;
    return function() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  getBaseHeight(x) {
    const progress = x / this.length;
    const params = this.terrainParams;

    let y = params.baseHeight || 400;

    const amplitude = params.amplitude || 1.0;
    const roughness = params.roughness || 1.0;

    y += Math.sin(x * 0.002 * roughness) * 60 * amplitude;
    y += Math.sin(x * 0.005 * roughness + 1.3) * 30 * amplitude;
    y += Math.sin(x * 0.01 * roughness + 2.7) * 15 * amplitude;
    y += Math.sin(x * 0.02 * roughness + 0.5) * 8 * amplitude;

    if (params.additionalFeatures) {
      y = this.applyThemeFeatures(x, y, progress);
    }

    return y;
  }

  applyThemeFeatures(x, y, progress) {
    const params = this.terrainParams;

    switch (this.theme) {
      case 'desert':
        if (progress > 0.1 && progress < 0.2) {
          y += Math.sin((x - this.length * 0.1) * 0.015) * 40;
        }
        if (progress > 0.4 && progress < 0.5) {
          y -= Math.sin((x - this.length * 0.4) * 0.012) * 50;
        }
        if (progress > 0.7 && progress < 0.8) {
          y += Math.sin((x - this.length * 0.7) * 0.008) * 80;
        }
        break;

      case 'snow':
        if (progress > 0.05 && progress < 0.15) {
          y += Math.sin((x - this.length * 0.05) * 0.02) * 30;
        }
        if (progress > 0.25 && progress < 0.35) {
          y -= Math.sin((x - this.length * 0.25) * 0.018) * 45;
        }
        if (progress > 0.5 && progress < 0.6) {
          y += Math.sin((x - this.length * 0.5) * 0.015) * 55;
        }
        if (progress > 0.75 && progress < 0.85) {
          y -= Math.sin((x - this.length * 0.75) * 0.012) * 65;
        }
        break;

      case 'city':
        for (let i = 0; i < 8; i++) {
          const sectionStart = 0.1 + i * 0.11;
          const sectionEnd = sectionStart + 0.05;
          if (progress > sectionStart && progress < sectionEnd) {
            const sectionX = (progress - sectionStart) / (sectionEnd - sectionStart);
            y += Math.sin(sectionX * Math.PI) * -35;
          }
        }
        if (progress > 0.3 && progress < 0.32) {
          y += 25;
        }
        if (progress > 0.6 && progress < 0.62) {
          y += 30;
        }
        break;

      case 'moon':
        if (progress > 0.1 && progress < 0.2) {
          y += Math.sin((x - this.length * 0.1) * 0.01) * 50;
        }
        if (progress > 0.35 && progress < 0.45) {
          y -= Math.sin((x - this.length * 0.35) * 0.008) * 70;
        }
        if (progress > 0.6 && progress < 0.7) {
          y += Math.sin((x - this.length * 0.6) * 0.012) * 60;
        }
        if (progress > 0.8 && progress < 0.9) {
          y -= Math.sin((x - this.length * 0.8) * 0.006) * 90;
        }
        for (let i = 0; i < 15; i++) {
          const craterX = (0.05 + i * 0.065) * this.length;
          const craterDist = Math.abs(x - craterX);
          if (craterDist < 80) {
            const craterDepth = Math.sin((craterDist / 80) * Math.PI * 0.5) * 25;
            y += craterDepth;
          }
        }
        break;
    }

    return y;
  }

  addRamps() {
    const rampConfigs = this.terrainParams.ramps || [
      { startPct: 0.15, widthPct: 0.025, height: -80 },
      { startPct: 0.30, widthPct: 0.02, height: -100 },
      { startPct: 0.45, widthPct: 0.03, height: -120 },
      { startPct: 0.55, widthPct: 0.02, height: -90 },
      { startPct: 0.65, widthPct: 0.035, height: -140 },
      { startPct: 0.78, widthPct: 0.025, height: -110 },
      { startPct: 0.88, widthPct: 0.03, height: -130 },
    ];

    rampConfigs.forEach(ramp => {
      const startX = ramp.startPct * this.length;
      const endX = startX + ramp.widthPct * this.length;
      const midX = (startX + endX) / 2;
      const height = ramp.height || -100;

      this.ramps.push({ startX, endX, midX, height: height });

      const startIdx = Math.floor(startX / this.segmentWidth);
      const endIdx = Math.ceil(endX / this.segmentWidth);

      for (let i = startIdx; i <= endIdx && i < this.points.length; i++) {
        const t = (i - startIdx) / (endIdx - startIdx);
        const rampCurve = Math.sin(t * Math.PI);
        this.points[i].y += height * rampCurve;
      }
    });
  }

  addObstacles() {
    const obstacleConfigs = this.terrainParams.obstacles || [];

    obstacleConfigs.forEach(obstacle => {
      const x = obstacle.startPct * this.length;
      const width = (obstacle.widthPct || 0.01) * this.length;
      const height = obstacle.height || 20;

      this.obstacles.push({
        x: x,
        width: width,
        height: height,
        type: obstacle.type || 'rock',
      });

      const startIdx = Math.floor(x / this.segmentWidth);
      const endIdx = Math.ceil((x + width) / this.segmentWidth);

      for (let i = startIdx; i <= endIdx && i < this.points.length; i++) {
        const t = (i - startIdx) / (endIdx - startIdx);
        const obstacleCurve = Math.sin(t * Math.PI);
        this.points[i].y += height * obstacleCurve;
      }
    });
  }

  smoothTerrain(iterations) {
    for (let iter = 0; iter < iterations; iter++) {
      const smoothed = [this.points[0]];
      for (let i = 1; i < this.points.length - 1; i++) {
        smoothed.push({
          x: this.points[i].x,
          y: (this.points[i - 1].y + this.points[i].y + this.points[i + 1].y) / 3,
        });
      }
      smoothed.push(this.points[this.points.length - 1]);
      this.points = smoothed;
    }
  }

  generateDecorations() {
    const decoCount = this.terrainParams.decorationCount || 30;

    for (let i = 0; i < decoCount; i++) {
      const x = (this.random() * 0.9 + 0.05) * this.length;
      const y = this.getHeight(x);

      let type;
      switch (this.theme) {
        case 'desert':
          type = this.random() > 0.7 ? 'cactus' : 'rock';
          break;
        case 'snow':
          type = this.random() > 0.5 ? 'pine' : 'rock';
          break;
        case 'city':
          type = this.random() > 0.5 ? 'barrel' : 'cone';
          break;
        case 'moon':
          type = this.random() > 0.5 ? 'crater' : 'rock';
          break;
        default:
          type = 'rock';
      }

      this.decorations.push({
        x: x,
        y: y,
        type: type,
        scale: 0.8 + this.random() * 0.4,
      });
    }
  }

  getHeight(x) {
    if (x <= 0) return this.points[0].y;
    if (x >= this.length) return this.points[this.points.length - 1].y;

    const idx = x / this.segmentWidth;
    const i = Math.floor(idx);
    const t = idx - i;

    if (i >= this.points.length - 1) return this.points[this.points.length - 1].y;

    return this.points[i].y * (1 - t) + this.points[i + 1].y * t;
  }

  getAngle(x) {
    const dx = 2;
    const y1 = this.getHeight(x - dx);
    const y2 = this.getHeight(x + dx);
    return Math.atan2(y2 - y1, dx * 2);
  }

  getCurvature(x) {
    const dx = 10;
    const a1 = this.getAngle(x - dx);
    const a2 = this.getAngle(x + dx);
    return (a2 - a1) / (dx * 2);
  }

  isRamp(x) {
    return this.ramps.some(r => x >= r.startX && x <= r.endX);
  }

  getRampAt(x) {
    return this.ramps.find(r => x >= r.startX && x <= r.endX);
  }

  isObstacle(x) {
    return this.obstacles.some(o => x >= o.x && x <= o.x + o.width);
  }

  getObstacleAt(x) {
    return this.obstacles.find(o => x >= o.x && o.x <= x + o.width);
  }

  isFinish(x) {
    return x >= this.finishX;
  }

  getThemeConfig() {
    return { ...this.themeConfig };
  }

  getTheme() {
    return this.theme;
  }

  getPhysicsParams() {
    return { ...this.themeConfig.physics };
  }

  getVisualParams() {
    return { ...this.themeConfig.visual };
  }

  getDifficulty() {
    return this.terrainParams.difficulty || 1;
  }

  getProgress(x) {
    return Math.max(0, Math.min(1, x / this.length));
  }

  getSegmentData(startX, endX) {
    const startIdx = Math.max(0, Math.floor(startX / this.segmentWidth));
    const endIdx = Math.min(this.points.length - 1, Math.ceil(endX / this.segmentWidth));
    return this.points.slice(startIdx, endIdx + 1);
  }

  getDecorationsInRange(startX, endX) {
    return this.decorations.filter(d => d.x >= startX && d.x <= endX);
  }

  getRampsInRange(startX, endX) {
    return this.ramps.filter(r => r.endX >= startX && r.startX <= endX);
  }

  reset() {
    this.generate();
  }

  setTheme(theme) {
    this.theme = theme;
    this.themeConfig = TRACK_THEMES[theme] || TRACK_THEMES.desert;
    this.terrainParams = this.themeConfig.terrain || {};
    this.generate();
  }

  setSeed(seed) {
    this.seed = seed;
    this.generate();
  }

  loadCustomPoints(points) {
    if (!points || points.length < 2) return false;
    this.points = points.map(p => ({ x: p.x, y: p.y }));
    this.length = points[points.length - 1].x;
    this.finishX = this.length;
    this.ramps = [];
    this.obstacles = [];
    this.smoothTerrain(1);
    return true;
  }

  getStartPosition() {
    return {
      x: 50,
      y: this.getHeight(50) - 30,
    };
  }

  getFinishPosition() {
    return {
      x: this.finishX,
      y: this.getHeight(this.finishX),
    };
  }

  getCheckpoints() {
    if (this.terrainParams.checkpoints) {
      return this.terrainParams.checkpoints.map(pct => ({
        x: pct * this.length,
        y: this.getHeight(pct * this.length),
      }));
    }
    return [];
  }
}

window.Terrain = Terrain;
