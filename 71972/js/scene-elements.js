const SceneElements = {
  canvas: null,
  ctx: null,
  currentScene: 'grassland',
  weatherType: 'sunny',
  temperature: 25,
  windSpeed: 10,
  time: 0,
  flowers: [],
  trees: [],

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._generateElements();
  },

  _generateElements() {
    this.flowers = [];
    this.trees = [];
    const w = this.canvas.width;
    const h = this.canvas.height;

    for (let i = 0; i < 15; i++) {
      this.flowers.push({
        x: Math.random() * w,
        y: h * 0.6 + 20 + Math.random() * (h * 0.3),
        size: 4 + Math.random() * 5,
        color: ['#ff6b9d', '#c084fc', '#fbbf24', '#f87171', '#fb923c'][Math.floor(Math.random() * 5)],
        phase: Math.random() * Math.PI * 2
      });
    }

    this.trees = [];
    const treeCount = this.currentScene === 'grassland' ? 5 : (this.currentScene === 'city' ? 3 : 2);
    for (let i = 0; i < treeCount; i++) {
      this.trees.push({
        x: w * (0.1 + (0.8 / treeCount) * i + Math.random() * 0.05),
        baseY: this.currentScene === 'ocean' ? h * 0.46 : h * 0.6,
        trunkHeight: 40 + Math.random() * 30,
        canopySize: 25 + Math.random() * 20,
        phase: Math.random() * Math.PI * 2
      });
    }
  },

  setScene(scene) {
    this.currentScene = scene;
    this._generateElements();
  },

  setWeather(weatherType, temperature, windSpeed) {
    this.weatherType = weatherType;
    this.temperature = temperature;
    this.windSpeed = windSpeed;
  },

  update() {
    this.time += 0.016;
  },

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (this.currentScene === 'grassland') {
      this._renderGrasslandElements(ctx, w, h);
    } else if (this.currentScene === 'ocean') {
      this._renderOceanElements(ctx, w, h);
    } else if (this.currentScene === 'city') {
      this._renderCityElements(ctx, w, h);
    }
  },

  _renderGrasslandElements(ctx, w, h) {
    this.trees.forEach(tree => {
      this._drawTree(ctx, tree);
    });

    if (this.weatherType !== 'snow') {
      this.flowers.forEach(f => {
        const visible = this.temperature > 5 && this.temperature < 40;
        if (!visible) return;
        const sway = Math.sin(this.time * 2 + f.phase) * this.windSpeed * 0.1;
        const scale = this.temperature > 10 && this.temperature < 30 ? 1 : 0.6;

        ctx.save();
        ctx.translate(f.x + sway, f.y);
        ctx.scale(scale, scale);

        ctx.fillStyle = f.color;
        for (let p = 0; p < 5; p++) {
          const angle = (Math.PI * 2 / 5) * p;
          ctx.beginPath();
          ctx.ellipse(
            Math.cos(angle) * f.size * 0.5,
            Math.sin(angle) * f.size * 0.5,
            f.size * 0.4, f.size * 0.25,
            angle, 0, Math.PI * 2
          );
          ctx.fill();
        }
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, 0, f.size * 0.25, 0, Math.PI * 2);
        ctx.fill();

        if (this.weatherType === 'rain' || this.weatherType === 'storm') {
          ctx.fillStyle = 'rgba(100,180,255,0.5)';
          ctx.beginPath();
          ctx.arc(f.size * 0.3, -f.size * 0.2, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });
    }

    if (this.weatherType === 'sunny' && this.temperature > 25) {
      const butterflyX = w * 0.3 + Math.sin(this.time * 1.5) * 100;
      const butterflyY = h * 0.5 + Math.cos(this.time * 2) * 30;
      this._drawButterfly(ctx, butterflyX, butterflyY);
    }
  },

  _renderOceanElements(ctx, w, h) {
    this.trees.forEach(tree => {
      tree.baseY = h * 0.46;
      this._drawPalmTree(ctx, tree);
    });

    if (this.weatherType === 'sunny') {
      ctx.fillStyle = '#e8d5b7';
      ctx.beginPath();
      ctx.ellipse(w * 0.15, h * 0.47, 35, 10, -0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#8b4513';
      ctx.fillRect(w * 0.148, h * 0.47 - 8, 4, -15);

      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(w * 0.152, h * 0.47 - 23, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(w * 0.152, h * 0.47 - 23, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.weatherType === 'storm') {
      const seagullY = h * 0.2 + Math.sin(this.time * 3) * 20;
      this._drawSeagull(ctx, w * 0.4, seagullY);
      this._drawSeagull(ctx, w * 0.6, seagullY + 15);
    }

    if (this.weatherType !== 'storm') {
      const birdY = h * 0.25 + Math.sin(this.time * 2) * 15;
      this._drawSeagull(ctx, w * 0.3 + Math.sin(this.time) * 30, birdY);
    }
  },

  _renderCityElements(ctx, w, h) {
    this.trees.forEach(tree => {
      tree.baseY = h * 0.65;
      this._drawTree(ctx, tree);
    });

    const lampX = [w * 0.2, w * 0.5, w * 0.8];
    lampX.forEach(lx => {
      const groundY = h * 0.65;
      ctx.fillStyle = '#555';
      ctx.fillRect(lx - 2, groundY - 60, 4, 60);
      ctx.fillStyle = '#777';
      ctx.fillRect(lx - 10, groundY - 63, 20, 5);

      if (this.weatherType !== 'sunny') {
        const glowGradient = ctx.createRadialGradient(lx, groundY - 58, 2, lx, groundY - 58, 50);
        glowGradient.addColorStop(0, 'rgba(255, 220, 100, 0.4)');
        glowGradient.addColorStop(1, 'rgba(255, 220, 100, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(lx, groundY - 58, 50, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  },

  _drawTree(ctx, tree) {
    const bend = Math.sin(this.time * 1.5 + tree.phase) * this.windSpeed * 0.2;
    const isSnowy = this.weatherType === 'snow';
    const isDry = this.temperature > 35;
    const isCold = this.temperature < 5;

    const trunkColor = '#5d4037';
    const canopyColor = isSnowy ? '#b8c6d4' : (isDry || isCold ? '#b8a040' : '#2e7d32');
    const canopyHighlight = isSnowy ? '#d5dde5' : (isDry || isCold ? '#d4b84a' : '#43a047');

    ctx.save();
    ctx.translate(tree.x, tree.baseY);

    ctx.fillStyle = trunkColor;
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.quadraticCurveTo(-4 + bend * 0.5, -tree.trunkHeight * 0.5, -3 + bend, -tree.trunkHeight);
    ctx.lineTo(3 + bend, -tree.trunkHeight);
    ctx.quadraticCurveTo(4 + bend * 0.5, -tree.trunkHeight * 0.5, 5, 0);
    ctx.closePath();
    ctx.fill();

    const cx = bend;
    const cy = -tree.trunkHeight;

    ctx.fillStyle = canopyColor;
    ctx.beginPath();
    ctx.arc(cx - tree.canopySize * 0.4, cy, tree.canopySize * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + tree.canopySize * 0.4, cy, tree.canopySize * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy - tree.canopySize * 0.4, tree.canopySize * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = canopyHighlight;
    ctx.beginPath();
    ctx.arc(cx - tree.canopySize * 0.2, cy - tree.canopySize * 0.3, tree.canopySize * 0.4, 0, Math.PI * 2);
    ctx.fill();

    if (isSnowy) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - tree.canopySize * 0.3, cy - tree.canopySize * 0.5, tree.canopySize * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + tree.canopySize * 0.3, cy - tree.canopySize * 0.3, tree.canopySize * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.weatherType === 'rain' || this.weatherType === 'storm') {
      for (let d = 0; d < 4; d++) {
        const angle = (Math.PI * 2 / 4) * d + tree.phase;
        const dx = Math.sin(angle + this.time * 2) * tree.canopySize * 0.6;
        const dy = (Math.cos(angle + this.time * 3) * 0.5 + 0.5) * tree.canopySize * 0.4;
        ctx.fillStyle = 'rgba(100,180,255,0.5)';
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  },

  _drawPalmTree(ctx, tree) {
    const bend = Math.sin(this.time * 1.5 + tree.phase) * this.windSpeed * 0.25;

    ctx.save();
    ctx.translate(tree.x, tree.baseY);

    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(bend * 0.5, -tree.trunkHeight * 0.5, bend, -tree.trunkHeight);
    ctx.stroke();

    const cx = bend;
    const cy = -tree.trunkHeight;
    const leafCount = 6;

    for (let i = 0; i < leafCount; i++) {
      const angle = (Math.PI * 2 / leafCount) * i + Math.sin(this.time + i) * 0.1;
      const leafBend = 0.3 + this.windSpeed * 0.01;

      ctx.strokeStyle = this.weatherType === 'storm' ? '#33691e' : '#558b2f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);

      const endX = cx + Math.cos(angle) * tree.canopySize * 1.5;
      const endY = cy + Math.sin(angle) * tree.canopySize * 0.5 + leafBend * tree.canopySize;
      const cpX = cx + Math.cos(angle) * tree.canopySize * 0.7;
      const cpY = cy + Math.sin(angle) * tree.canopySize * 0.2;

      ctx.quadraticCurveTo(cpX, cpY, endX, endY);
      ctx.stroke();
    }

    ctx.fillStyle = '#8d6e63';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  _drawButterfly(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    const wingAngle = Math.sin(this.time * 8) * 0.3;

    ctx.fillStyle = 'rgba(255, 107, 157, 0.7)';
    ctx.beginPath();
    ctx.ellipse(-5, 0, 6, 4, -wingAngle, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(5, 0, 6, 4, wingAngle, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.fillRect(-0.5, -3, 1, 6);

    ctx.restore();
  },

  _drawSeagull(ctx, x, y) {
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    const wingFlap = Math.sin(this.time * 5) * 5;
    ctx.beginPath();
    ctx.moveTo(x - 15, y + wingFlap);
    ctx.quadraticCurveTo(x - 5, y - 5, x, y);
    ctx.quadraticCurveTo(x + 5, y - 5, x + 15, y + wingFlap);
    ctx.stroke();
  },

  resize() {
    this._generateElements();
  }
};
