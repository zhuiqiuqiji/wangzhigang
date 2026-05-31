class ReplaySystem {
  constructor() {
    this.frames = [];
    this.maxFrames = 60 * 120;
    this.isRecording = false;
    this.isReplaying = false;
    this.replayIndex = 0;
    this.playbackSpeed = 1.0;
    this.bestSolution = null;
  }

  startRecording() {
    this.frames = [];
    this.isRecording = true;
    this.isReplaying = false;
  }

  stopRecording() {
    this.isRecording = false;
  }

  recordFrame(state) {
    if (!this.isRecording) return;
    if (this.frames.length >= this.maxFrames) {
      this.frames.shift();
    }
    this.frames.push(JSON.parse(JSON.stringify(state)));
  }

  getFrame(index) {
    if (index >= 0 && index < this.frames.length) {
      return this.frames[index];
    }
    return null;
  }

  startReplay() {
    if (this.frames.length === 0) return false;
    this.isReplaying = true;
    this.replayIndex = 0;
    this.isRecording = false;
    return true;
  }

  stopReplay() {
    this.isReplaying = false;
    this.replayIndex = 0;
  }

  getNextFrame() {
    if (!this.isReplaying) return null;

    const index = Math.floor(this.replayIndex);
    const frame = this.getFrame(index);

    this.replayIndex += this.playbackSpeed;

    if (this.replayIndex >= this.frames.length) {
      this.stopReplay();
    }

    return frame;
  }

  saveAsBestSolution(stars) {
    if (!this.bestSolution || stars > this.bestSolution.stars) {
      this.bestSolution = {
        frames: [...this.frames],
        stars: stars,
        time: this.frames.length / 60
      };
      return true;
    }
    return false;
  }

  getBestSolution() {
    return this.bestSolution;
  }

  getProgress() {
    if (!this.isReplaying || this.frames.length === 0) return 0;
    return this.replayIndex / this.frames.length;
  }

  getDuration() {
    return this.frames.length / 60;
  }
}

class LevelEditor {
  constructor(game) {
    this.game = game;
    this.isActive = false;
    this.selectedTool = null;
    this.selectedObject = null;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.editedLevel = null;
    this.tempRopeStart = null;
  }

  activate() {
    this.isActive = true;
    this.editedLevel = LEVEL_TEMPLATES.createEmptyLevel(this.game.width, this.game.height);
    this.selectedTool = 'anchor';
  }

  deactivate() {
    this.isActive = false;
    this.selectedTool = null;
    this.selectedObject = null;
  }

  handleMouseDown(x, y) {
    if (!this.isActive) return;

    const clickedObject = this.findObjectAt(x, y);

    if (clickedObject) {
      this.selectedObject = clickedObject;
      this.isDragging = true;
      this.dragOffset.x = x - clickedObject.x;
      this.dragOffset.y = y - clickedObject.y;
      return;
    }

    if (this.selectedTool === 'rope' && this.tempRopeStart === null) {
      const anchor = this.findAnchorAt(x, y);
      if (anchor) {
        this.tempRopeStart = { x: anchor.x * this.game.width, y: anchor.y * this.game.height };
      }
      return;
    }

    if (this.selectedTool === 'rope' && this.tempRopeStart !== null) {
      const endAnchor = this.findAnchorAt(x, y);
      if (endAnchor) {
        const anchorIndex = this.editedLevel.anchors.indexOf(endAnchor);
        if (anchorIndex >= 0) {
          this.editedLevel.ropes.push({
            anchorIndex: anchorIndex,
            segments: 10,
            length: 0.3,
            type: 'normal'
          });
        }
      }
      this.tempRopeStart = null;
      return;
    }

    this.addObject(x, y);
  }

  handleMouseMove(x, y) {
    if (!this.isActive || !this.isDragging || !this.selectedObject) return;

    this.selectedObject.ref.x = (x - this.dragOffset.x) / this.game.width;
    this.selectedObject.ref.y = (y - this.dragOffset.y) / this.game.height;
  }

  handleMouseUp(x, y) {
    this.isDragging = false;
  }

  findObjectAt(x, y) {
    const threshold = 25;

    for (const anchor of this.editedLevel.anchors) {
      const dx = anchor.x * this.game.width - x;
      const dy = anchor.y * this.game.height - y;
      if (Math.sqrt(dx * dx + dy * dy) < threshold) {
        return { type: 'anchor', ref: anchor, x: anchor.x * this.game.width, y: anchor.y * this.game.height };
      }
    }

    for (const star of this.editedLevel.stars) {
      const dx = star.x * this.game.width - x;
      const dy = star.y * this.game.height - y;
      if (Math.sqrt(dx * dx + dy * dy) < threshold) {
        return { type: 'star', ref: star, x: star.x * this.game.width, y: star.y * this.game.height };
      }
    }

    for (const obj of this.editedLevel.objects) {
      const dx = obj.x * this.game.width - x;
      const dy = obj.y * this.game.height - y;
      if (Math.sqrt(dx * dx + dy * dy) < threshold) {
        return { type: 'object', ref: obj, x: obj.x * this.game.width, y: obj.y * this.game.height };
      }
    }

    const target = this.editedLevel.target;
    const dx = target.x * this.game.width - x;
    const dy = target.y * this.game.height - y;
    if (Math.sqrt(dx * dx + dy * dy) < threshold) {
      return { type: 'target', ref: target, x: target.x * this.game.width, y: target.y * this.game.height };
    }

    const candy = this.editedLevel.candy;
    const cdx = candy.x * this.game.width - x;
    const cdy = candy.y * this.game.height - y;
    if (Math.sqrt(cdx * cdx + cdy * cdy) < threshold) {
      return { type: 'candy', ref: candy, x: candy.x * this.game.width, y: candy.y * this.game.height };
    }

    return null;
  }

  findAnchorAt(x, y) {
    const threshold = 30;
    for (const anchor of this.editedLevel.anchors) {
      const dx = anchor.x * this.game.width - x;
      const dy = anchor.y * this.game.height - y;
      if (Math.sqrt(dx * dx + dy * dy) < threshold) {
        return anchor;
      }
    }
    return null;
  }

  addObject(x, y) {
    const relX = x / this.game.width;
    const relY = y / this.game.height;

    switch (this.selectedTool) {
      case 'anchor':
        this.editedLevel.anchors.push({ x: relX, y: relY });
        break;
      case 'star':
        this.editedLevel.stars.push({ x: relX, y: relY });
        break;
      case 'balloon':
        this.editedLevel.objects.push({ type: 'balloon', x: relX, y: relY, options: {} });
        break;
      case 'fan':
        this.editedLevel.objects.push({ type: 'fan', x: relX, y: relY, options: { direction: 0 } });
        break;
      case 'rocket':
        this.editedLevel.objects.push({ type: 'rocket', x: relX, y: relY, options: {} });
        break;
      case 'portal':
        this.editedLevel.objects.push({ type: 'portal', x: relX, y: relY, targetX: 0.5, targetY: 0.5, options: {} });
        break;
      case 'obstacle':
        this.editedLevel.objects.push({ type: 'obstacle', x: relX, y: relY, options: { isBouncy: true } });
        break;
    }
  }

  deleteSelected() {
    if (!this.selectedObject) return;

    const { type, ref } = this.selectedObject;

    if (type === 'anchor') {
      const index = this.editedLevel.anchors.indexOf(ref);
      if (index >= 0) {
        this.editedLevel.anchors.splice(index, 1);
        this.editedLevel.ropes = this.editedLevel.ropes.filter(r => r.anchorIndex !== index);
      }
    } else if (type === 'star') {
      const index = this.editedLevel.stars.indexOf(ref);
      if (index >= 0) this.editedLevel.stars.splice(index, 1);
    } else if (type === 'object') {
      const index = this.editedLevel.objects.indexOf(ref);
      if (index >= 0) this.editedLevel.objects.splice(index, 1);
    }

    this.selectedObject = null;
  }

  exportLevel() {
    return JSON.parse(JSON.stringify(this.editedLevel));
  }

  importLevel(levelData) {
    this.editedLevel = JSON.parse(JSON.stringify(levelData));
  }

  testLevel() {
    const levelData = this.exportLevel();
    this.game.loadCustomLevel(levelData);
  }

  shareLevel() {
    const levelData = this.exportLevel();
    const json = JSON.stringify(levelData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `level_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  render(renderer) {
    if (!this.isActive) return;

    renderer.drawEditorUI(this.selectedTool, 20, this.game.height - 100);

    if (this.tempRopeStart) {
      renderer.ctx.save();
      renderer.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      renderer.ctx.lineWidth = 3;
      renderer.ctx.setLineDash([5, 5]);
      renderer.ctx.beginPath();
      renderer.ctx.moveTo(this.tempRopeStart.x, this.tempRopeStart.y);
      renderer.ctx.lineTo(this.game.input.lastX, this.game.input.lastY);
      renderer.ctx.stroke();
      renderer.ctx.setLineDash([]);
      renderer.ctx.restore();
    }

    if (this.selectedObject) {
      const x = this.selectedObject.x;
      const y = this.selectedObject.y;
      renderer.ctx.save();
      renderer.ctx.strokeStyle = '#FFD700';
      renderer.ctx.lineWidth = 3;
      renderer.ctx.setLineDash([5, 5]);
      renderer.ctx.beginPath();
      renderer.ctx.arc(x, y, 30, 0, Math.PI * 2);
      renderer.ctx.stroke();
      renderer.ctx.setLineDash([]);
      renderer.ctx.restore();
    }
  }
}

class LevelProgress {
  constructor() {
    this.progress = this.loadProgress();
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('cutRopeProgress');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }

  saveProgress() {
    try {
      localStorage.setItem('cutRopeProgress', JSON.stringify(this.progress));
    } catch (e) {}
  }

  updateLevel(levelId, result) {
    if (!this.progress[levelId]) {
      this.progress[levelId] = {
        completed: false,
        stars: 0,
        bestScore: 0,
        bestTime: Infinity,
        attempts: 0
      };
    }

    const entry = this.progress[levelId];
    entry.attempts++;

    if (result.success) {
      entry.completed = true;
      if (result.stars > entry.stars) {
        entry.stars = result.stars;
      }
      if (result.score > entry.bestScore) {
        entry.bestScore = result.score;
      }
      if (result.time < entry.bestTime) {
        entry.bestTime = result.time;
      }
    }

    this.saveProgress();
    return entry;
  }

  getLevelProgress(levelId) {
    return this.progress[levelId] || { completed: false, stars: 0, bestScore: 0 };
  }

  getTotalStars() {
    let total = 0;
    for (const levelId in this.progress) {
      total += this.progress[levelId].stars || 0;
    }
    return total;
  }

  resetProgress() {
    this.progress = {};
    this.saveProgress();
  }
}

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;

    this.renderer = new Renderer(canvas);
    this.input = new InputHandler(canvas, this);

    this.currentLevel = 0;
    this.score = 0;
    this.gameState = 'playing';
    this.gameMode = 'playing';

    this.ropes = [];
    this.anchors = [];
    this.candy = null;
    this.target = null;
    this.levelConfig = null;

    this.physicsWorld = new PhysicsWorld();
    this.replaySystem = new ReplaySystem();
    this.levelEditor = new LevelEditor(this);
    this.levelProgress = new LevelProgress();

    this.gravity = 1500;
    this.damping = 0.995;
    this.fixedDt = 1 / 60;
    this.accumulator = 0;
    this.lastFrameTime = 0;
    this.maxSubSteps = 5;
    this.previousState = null;
    this.currentState = null;

    this.levelStartTime = 0;
    this.collectedStars = 0;
    this.totalStarsInLevel = 0;
    this.lastStarsEarned = 0;
    this.lastTimeTaken = 0;

    this.animationId = null;
    this.resizeTimeout = null;
    this.resizeDebounceMs = 150;

    this.bindButtonEvents();
    this.bindKeyboardEvents();
    this.loadLevel(0);
  }

  bindKeyboardEvents() {
    document.addEventListener('keydown', (e) => {
      if (this.gameMode === 'editor') {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          this.levelEditor.deleteSelected();
        } else if (e.key === 'Escape') {
          this.exitEditor();
        } else if (e.key === 't' || e.key === 'T') {
          this.levelEditor.testLevel();
        } else if (e.key === 's' || e.key === 'S') {
          this.levelEditor.shareLevel();
        }
      } else {
        if (e.key === 'r' || e.key === 'R') {
          this.toggleReplay();
        } else if (e.key === 'e' || e.key === 'E') {
          this.enterEditor();
        } else if (e.key === 'l' || e.key === 'L') {
          this.toggleLevelSelect();
        }
      }
    });
  }

  resize() {
    const oldWidth = this.width;
    const oldHeight = this.height;
    const newWidth = this.canvas.width;
    const newHeight = this.canvas.height;

    if (oldWidth === newWidth && oldHeight === newHeight) {
      return;
    }

    this.width = newWidth;
    this.height = newHeight;
    this.renderer.resize();

    const scaleX = newWidth / oldWidth;
    const scaleY = newHeight / oldHeight;

    for (const anchor of this.anchors) {
      anchor.x *= scaleX;
      anchor.y *= scaleY;
    }

    for (const rope of this.ropes) {
      for (const point of rope.points) {
        point.x *= scaleX;
        point.y *= scaleY;
        point.oldX *= scaleX;
        point.oldY *= scaleY;
      }
      for (const constraint of rope.constraints) {
        constraint.length *= Math.min(scaleX, scaleY);
      }
    }

    if (this.candy) {
      this.candy.x *= scaleX;
      this.candy.y *= scaleY;
      if (this.candy.oldX !== undefined) {
        this.candy.oldX *= scaleX;
        this.candy.oldY *= scaleY;
      }
    }

    if (this.target) {
      this.target.x *= scaleX;
      this.target.y *= scaleY;
    }

    for (const obj of this.physicsWorld.objects) {
      obj.x *= scaleX;
      obj.y *= scaleY;
    }
  }

  loadLevel(levelIndex) {
    if (levelIndex >= LEVELS.length) {
      this.gameState = 'complete';
      return;
    }

    this.currentLevel = levelIndex;
    this.levelConfig = LEVELS[levelIndex];
    this.gameState = 'playing';
    this.gameMode = 'playing';

    this.setupLevel(this.levelConfig);

    if (!this.animationId) {
      this.gameLoop();
    }
  }

  loadCustomLevel(levelData) {
    this.levelConfig = levelData;
    this.gameState = 'playing';
    this.gameMode = 'playing';
    this.setupLevel(levelData);
  }

  setupLevel(config) {
    this.ropes = [];
    this.anchors = [];
    this.physicsWorld = new PhysicsWorld();
    this.collectedStars = 0;
    this.levelStartTime = performance.now();

    for (const anchor of config.anchors) {
      this.anchors.push({
        x: anchor.x * this.width,
        y: anchor.y * this.height
      });
    }

    const candyX = config.candy.x * this.width;
    const candyY = config.candy.y * this.height;
    const candyRadius = config.candy.radius;

    this.candy = {
      x: candyX,
      y: candyY,
      radius: candyRadius,
      rotation: 0
    };

    this.target = {
      x: config.target.x * this.width,
      y: config.target.y * this.height,
      radius: config.target.radius
    };

    for (let i = 0; i < config.ropes.length; i++) {
      const ropeConfig = config.ropes[i];
      const anchor = this.anchors[ropeConfig.anchorIndex];
      const ropeLength = ropeConfig.length * this.height;
      const options = ropeConfig.options || {};

      const rope = new Rope(
        anchor.x,
        anchor.y,
        candyX,
        candyY,
        ropeConfig.segments,
        options
      );

      this.ropes.push(rope);
    }

    for (const starConfig of config.stars || []) {
      const star = new Star(
        starConfig.x * this.width,
        starConfig.y * this.height,
        { radius: 18 }
      );
      this.physicsWorld.addObject(star);
    }
    this.totalStarsInLevel = (config.stars || []).length;

    for (const objConfig of config.objects || []) {
      let obj = null;
      const x = objConfig.x * this.width;
      const y = objConfig.y * this.height;
      const options = objConfig.options || {};

      switch (objConfig.type) {
        case 'balloon':
          obj = new Balloon(x, y, options);
          break;
        case 'fan':
          obj = new Fan(x, y, options);
          break;
        case 'rocket':
          obj = new Rocket(x, y, options);
          break;
        case 'portal':
          obj = new Portal(
            x, y,
            objConfig.targetX * this.width,
            objConfig.targetY * this.height,
            options
          );
          break;
        case 'pulley':
          obj = new Pulley(x, y, options);
          break;
        case 'obstacle':
          obj = new Obstacle(x, y, options);
          break;
      }

      if (obj) {
        this.physicsWorld.addObject(obj);

        if (obj.type === 'balloon') {
          const endPoint = this.ropes[0] ? this.ropes[0].getEndPoint() : null;
          if (endPoint) {
            obj.attach(endPoint);
          }
        }
        if (obj.type === 'rocket') {
          const endPoint = this.ropes[0] ? this.ropes[0].getEndPoint() : null;
          if (endPoint) {
            obj.attach(endPoint);
          }
        }
      }
    }

    const portals = this.physicsWorld.getObjectsByType('portal');
    for (let i = 0; i < portals.length - 1; i++) {
      if (config.objects && config.objects[i + 1] && config.objects[i + 1].linked) {
        portals[i].linkedPortal = portals[i + 1];
        portals[i + 1].linkedPortal = portals[i];
      }
    }

    this.replaySystem.startRecording();
  }

  resetLevel() {
    if (this.levelConfig) {
      this.setupLevel(this.levelConfig);
    }
  }

  nextLevel() {
    if (this.currentLevel < LEVELS.length - 1) {
      this.loadLevel(this.currentLevel + 1);
    } else {
      this.gameState = 'complete';
    }
  }

  enterEditor() {
    this.gameMode = 'editor';
    this.levelEditor.activate();
    this.replaySystem.stopRecording();
  }

  exitEditor() {
    this.gameMode = 'playing';
    this.levelEditor.deactivate();
    this.resetLevel();
  }

  toggleReplay() {
    if (this.replaySystem.isReplaying) {
      this.replaySystem.stopReplay();
      this.resetLevel();
    } else {
      if (this.replaySystem.startReplay()) {
        this.gameState = 'playing';
        this.gameMode = 'playing';
      }
    }
  }

  toggleLevelSelect() {
    this.gameState = this.gameState === 'levelSelect' ? 'playing' : 'levelSelect';
  }

  checkRopeCut(x1, y1, x2, y2) {
    if (this.gameState !== 'playing' || this.gameMode !== 'playing') return;
    if (this.replaySystem.isReplaying) return;

    for (let ropeIndex = 0; ropeIndex < this.ropes.length; ropeIndex++) {
      const rope = this.ropes[ropeIndex];
      const segmentIndex = rope.findCutSegment(x1, y1, x2, y2, 10);

      if (segmentIndex >= 0) {
        rope.cutSegment(segmentIndex);

        const constraint = rope.constraints[segmentIndex];
        const cutX = (constraint.p1.x + constraint.p2.x) / 2;
        const cutY = (constraint.p1.y + constraint.p2.y) / 2;
        this.renderer.addCutParticles(cutX, cutY);

        break;
      }
    }
  }

  handleObjectClick(x, y) {
    if (this.gameState !== 'playing' || this.gameMode !== 'playing') return;
    if (this.replaySystem.isReplaying) return;

    for (const obj of this.physicsWorld.objects) {
      if (obj.type === 'balloon') {
        const dx = x - obj.x;
        const dy = y - obj.y;
        if (Math.sqrt(dx * dx + dy * dy) < obj.radius + 10) {
          const endPoint = this.ropes[0] ? this.ropes[0].getEndPoint() : null;
          if (endPoint) {
            obj.attach(endPoint);
          }
          return;
        }
      }

      if (obj.type === 'rocket' && !obj.active) {
        const dx = x - obj.x;
        const dy = y - obj.y;
        if (Math.sqrt(dx * dx + dy * dy) < obj.radius + 10) {
          obj.ignite();
          return;
        }
      }
    }
  }

  update(dt) {
    if (this.gameState !== 'playing') return;
    if (this.gameMode === 'editor') return;

    if (this.replaySystem.isReplaying) {
      const frame = this.replaySystem.getNextFrame();
      if (frame) {
        this.restoreState(frame);
      }
      return;
    }

    this.previousState = this.captureState();

    const pixelScale = Math.min(this.width, this.height) / 600;
    const scaledGravity = this.gravity * pixelScale;

    for (const rope of this.ropes) {
      rope.update(scaledGravity, this.damping, dt * 60);
    }

    const ropeEndPoints = this.ropes.map(r => r.getEndPoint());
    const candyPoint = {
      x: this.candy.x,
      y: this.candy.y,
      radius: this.candy.radius,
      pinned: false,
      applyForce: (fx, fy, dt) => {
        this.candy.oldX = this.candy.oldX || this.candy.x;
        this.candy.oldY = this.candy.oldY || this.candy.y;
        this.candy.x += fx * dt * dt;
        this.candy.y += fy * dt * dt;
      }
    };

    const collectedStars = this.physicsWorld.update(dt, ropeEndPoints, candyPoint, this);

    if (collectedStars.length > 0) {
      this.collectedStars += collectedStars.length;
      for (const star of collectedStars) {
        this.renderer.addSuccessParticles(star.x, star.y);
      }
    }

    this.updateCandyPosition(dt, scaledGravity);
    this.enforceCandyRopeConnection();

    for (let i = 0; i < 3; i++) {
      for (const rope of this.ropes) {
        for (const constraint of rope.constraints) {
          constraint.solve();
        }
      }
    }

    const deadlyObstacles = this.physicsWorld.getObjectsByType('obstacle').filter(o => o.isDeadly);
    for (const obstacle of deadlyObstacles) {
      if (obstacle.checkCollision(candyPoint)) {
        this.gameState = 'fail';
        this.replaySystem.stopRecording();
        return;
      }
    }

    this.checkWinCondition();
    this.checkLoseCondition();
    this.renderer.updateParticles();

    this.currentState = this.captureState();
    this.replaySystem.recordFrame(this.currentState);
  }

  updateCandyPosition(dt, scaledGravity) {
    let totalX = 0;
    let totalY = 0;
    let attachedCount = 0;
    let prevX = this.candy.x;
    let prevY = this.candy.y;

    const activeRopes = [];
    for (const rope of this.ropes) {
      if (!rope.isFullyCut()) {
        const endPoint = rope.getEndPoint();
        totalX += endPoint.x;
        totalY += endPoint.y;
        attachedCount++;
        activeRopes.push(rope);
      }
    }

    if (attachedCount > 0) {
      const targetX = totalX / attachedCount;
      const targetY = totalY / attachedCount;

      this.candy.oldX = prevX;
      this.candy.oldY = prevY;
      this.candy.x = targetX;
      this.candy.y = targetY;
    } else {
      if (this.candy.oldX === undefined) {
        this.candy.oldX = prevX;
        this.candy.oldY = prevY;
      }

      const vx = (this.candy.x - this.candy.oldX) * this.damping;
      const vy = (this.candy.y - this.candy.oldY) * this.damping;

      this.candy.oldX = this.candy.x;
      this.candy.oldY = this.candy.y;

      this.candy.x += vx;
      this.candy.y += vy + scaledGravity * dt * dt;
    }

    const dx = this.candy.x - prevX;
    const dy = this.candy.y - prevY;
    this.candy.rotation += dx * 0.02;
  }

  enforceCandyRopeConnection() {
    for (const rope of this.ropes) {
      if (!rope.isFullyCut()) {
        rope.setEndPointPosition(this.candy.x, this.candy.y);
      }
    }
  }

  checkWinCondition() {
    const collision = checkCircleCollision(
      this.candy.x, this.candy.y, this.candy.radius * 0.8,
      this.target.x, this.target.y, this.target.radius * 0.8
    );

    if (collision) {
      this.gameState = 'success';
      this.replaySystem.stopRecording();

      const timeTaken = (performance.now() - this.levelStartTime) / 1000;
      const collectedAll = this.collectedStars >= this.totalStarsInLevel;
      const starsEarned = calculateStarsEarned(this.levelConfig, {
        success: true,
        score: this.levelConfig.score,
        time: timeTaken,
        collectedAllStars: collectedAll
      });

      this.lastStarsEarned = starsEarned;
      this.lastTimeTaken = timeTaken;
      this.score += this.levelConfig.score + this.collectedStars * 50;

      this.levelProgress.updateLevel(this.levelConfig.id, {
        success: true,
        score: this.score,
        time: timeTaken,
        stars: starsEarned,
        collectedAllStars: collectedAll
      });

      this.replaySystem.saveAsBestSolution(starsEarned);

      this.renderer.addSuccessParticles(this.target.x, this.target.y);
    }
  }

  checkLoseCondition() {
    if (this.candy.y > this.height + 100 ||
        this.candy.x < -100 ||
        this.candy.x > this.width + 100) {
      this.gameState = 'fail';
      this.replaySystem.stopRecording();

      this.levelProgress.updateLevel(this.levelConfig.id, {
        success: false,
        score: 0,
        time: 0,
        stars: 0,
        collectedAllStars: false
      });
    }
  }

  captureState() {
    return {
      candy: {
        x: this.candy.x,
        y: this.candy.y,
        rotation: this.candy.rotation
      },
      ropes: this.ropes.map(rope => rope.getState()),
      physics: this.physicsWorld.getState()
    };
  }

  restoreState(state) {
    if (!state) return;

    this.candy.x = state.candy.x;
    this.candy.y = state.candy.y;
    this.candy.rotation = state.candy.rotation;

    for (let i = 0; i < this.ropes.length && i < state.ropes.length; i++) {
      this.ropes[i].setState(state.ropes[i]);
    }

    this.physicsWorld.setState(state.physics);
  }

  lerpState(alpha) {
    if (!this.previousState || !this.currentState || alpha <= 0) {
      return null;
    }
    if (alpha >= 1) {
      return this.currentState;
    }

    const lerp = (a, b, t) => a + (b - a) * t;

    const state = {
      candy: {
        x: lerp(this.previousState.candy.x, this.currentState.candy.x, alpha),
        y: lerp(this.previousState.candy.y, this.currentState.candy.y, alpha),
        rotation: lerp(this.previousState.candy.rotation, this.currentState.candy.rotation, alpha)
      },
      ropes: []
    };

    for (let i = 0; i < this.currentState.ropes.length; i++) {
      state.ropes.push({
        points: this.currentState.ropes[i].points.map((p, j) => ({
          x: lerp(this.previousState.ropes[i].points[j].x, p.x, alpha),
          y: lerp(this.previousState.ropes[i].points[j].y, p.y, alpha)
        }))
      });
    }

    return state;
  }

  render(alpha = 0) {
    this.renderer.clear();

    if (this.gameState === 'levelSelect') {
      this.renderLevelSelect();
      return;
    }

    const interpolatedState = this.lerpState(alpha);

    let candyX = this.candy.x;
    let candyY = this.candy.y;
    let candyRotation = this.candy.rotation;

    if (interpolatedState) {
      candyX = interpolatedState.candy.x;
      candyY = interpolatedState.candy.y;
      candyRotation = interpolatedState.candy.rotation;
    }

    for (const anchor of this.anchors) {
      this.renderer.drawAnchor(anchor.x, anchor.y);
    }

    if (interpolatedState) {
      for (let i = 0; i < this.ropes.length; i++) {
        const rope = this.ropes[i];
        const ropeState = interpolatedState.ropes[i];
        this.renderer.drawRopeWithState(rope, ropeState);
      }
    } else {
      for (const rope of this.ropes) {
        this.renderer.drawRope(rope);
      }
    }

    for (const obj of this.physicsWorld.objects) {
      this.renderer.drawPhysicsObject(obj);
    }

    this.renderer.drawTarget(this.target.x, this.target.y, this.target.radius);

    this.renderer.drawCandy(
      candyX,
      candyY,
      this.candy.radius,
      candyRotation
    );

    this.renderer.drawParticles();

    const trail = this.input.getTrail();
    this.renderer.drawTrail(trail);

    this.renderGameUI();

    if (this.gameMode === 'editor') {
      this.levelEditor.render(this.renderer);
    }

    if (this.replaySystem.isReplaying) {
      this.renderer.drawReplayControls(
        true,
        this.replaySystem.playbackSpeed,
        this.width - 180,
        this.height - 60
      );
    }

    if (this.gameState === 'success') {
      this.renderSuccess();
    } else if (this.gameState === 'fail') {
      this.renderFail();
    } else if (this.gameState === 'complete') {
      this.renderGameComplete();
    }
  }

  renderGameUI() {
    this.renderer.drawUI(
      this.currentLevel + 1,
      this.score,
      this.levelConfig.name
    );

    if (this.gameState === 'playing' && this.gameMode === 'playing') {
      this.renderer.drawButtons();
    }

    if (this.totalStarsInLevel > 0) {
      this.renderer.drawStarRating(
        this.collectedStars,
        this.totalStarsInLevel,
        20,
        100,
        15
      );
    }

    const totalStars = this.levelProgress.getTotalStars();
    this.renderer.drawStarRating(
      totalStars,
      3,
      this.width - 70,
      100,
      15
    );
  }

  renderLevelSelect() {
    this.renderer.drawLevelSelect(
      LEVELS,
      this.currentLevel,
      this.levelProgress.progress,
      this.width / 2 - 150,
      this.height / 2 - 200,
      300,
      400
    );
  }

  renderSuccess() {
    const timeTaken = this.lastTimeTaken.toFixed(1);
    const starsEarned = this.lastStarsEarned;

    this.renderer.ctx.save();

    this.renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.renderer.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.renderer.ctx.fillStyle = '#FFF';
    this.renderer.ctx.shadowColor = '#FFD700';
    this.renderer.ctx.shadowBlur = 30;
    this.renderer.roundRect(centerX - 180, centerY - 150, 360, 300, 25, true, false);

    this.renderer.ctx.shadowBlur = 0;
    this.renderer.ctx.fillStyle = '#FF6B35';
    this.renderer.ctx.font = 'bold 36px "Baloo 2", "Comic Sans MS", cursive';
    this.renderer.ctx.textAlign = 'center';
    this.renderer.ctx.fillText('🎉 关卡完成！', centerX, centerY - 100);

    this.renderer.drawStarRating(starsEarned, 3, centerX - 45, centerY - 50, 30);

    this.renderer.ctx.fillStyle = '#4ECDC4';
    this.renderer.ctx.font = '20px "Baloo 2", "Comic Sans MS", cursive';
    this.renderer.ctx.fillText(`得分: +${this.levelConfig.score + this.collectedStars * 50}`, centerX, centerY + 10);
    this.renderer.ctx.fillText(`用时: ${timeTaken}秒`, centerX, centerY + 40);
    this.renderer.ctx.fillText(`星星: ${this.collectedStars}/${this.totalStarsInLevel}`, centerX, centerY + 70);

    this.renderer.ctx.fillStyle = '#666';
    this.renderer.ctx.font = '16px "Baloo 2", "Comic Sans MS", cursive';
    this.renderer.ctx.fillText('点击继续', centerX, centerY + 110);

    this.renderer.ctx.restore();
  }

  renderFail() {
    this.renderer.ctx.save();

    this.renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.renderer.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.renderer.ctx.fillStyle = '#FFF';
    this.renderer.ctx.shadowColor = '#FF6B6B';
    this.renderer.ctx.shadowBlur = 30;
    this.renderer.roundRect(centerX - 180, centerY - 120, 360, 240, 25, true, false);

    this.renderer.ctx.shadowBlur = 0;
    this.renderer.ctx.fillStyle = '#FF6B6B';
    this.renderer.ctx.font = 'bold 48px "Baloo 2", "Comic Sans MS", cursive';
    this.renderer.ctx.textAlign = 'center';
    this.renderer.ctx.fillText('😢 哎呀！', centerX, centerY - 40);

    this.renderer.ctx.fillStyle = '#666';
    this.renderer.ctx.font = '24px "Baloo 2", "Comic Sans MS", cursive';
    this.renderer.ctx.fillText('糖果掉出去了', centerX, centerY + 5);

    this.renderer.ctx.fillStyle = '#4ECDC4';
    this.renderer.ctx.font = '18px "Baloo 2", "Comic Sans MS", cursive';
    this.renderer.ctx.fillText('点击重新开始', centerX, centerY + 50);

    this.renderer.ctx.restore();
  }

  renderGameComplete() {
    const totalStars = this.levelProgress.getTotalStars();

    this.renderer.ctx.save();

    this.renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.renderer.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.renderer.ctx.fillStyle = '#FFF';
    this.renderer.ctx.shadowColor = '#FFD700';
    this.renderer.ctx.shadowBlur = 50;
    this.renderer.roundRect(centerX - 200, centerY - 180, 400, 360, 30, true, false);

    this.renderer.ctx.shadowBlur = 0;
    this.renderer.ctx.fillStyle = '#FF6B35';
    this.renderer.ctx.font = 'bold 48px "Baloo 2", "Comic Sans MS", cursive';
    this.renderer.ctx.textAlign = 'center';
    this.renderer.ctx.fillText('🏆 恭喜通关！', centerX, centerY - 100);

    this.renderer.drawStarRating(Math.min(totalStars, 3), 3, centerX - 45, centerY - 50, 30);

    this.renderer.ctx.fillStyle = '#4ECDC4';
    this.renderer.ctx.font = '24px "Baloo 2", "Comic Sans MS", cursive';
    this.renderer.ctx.fillText('总得分', centerX, centerY);

    this.renderer.ctx.fillStyle = '#FFD700';
    this.renderer.ctx.font = 'bold 48px "Baloo 2", "Comic Sans MS", cursive';
    this.renderer.ctx.fillText(this.score.toString(), centerX, centerY + 50);

    this.renderer.ctx.fillStyle = '#999';
    this.renderer.ctx.font = '18px "Baloo 2", "Comic Sans MS", cursive';
    this.renderer.ctx.fillText(`收集星星: ${totalStars}`, centerX, centerY + 90);

    this.renderer.ctx.fillStyle = '#666';
    this.renderer.ctx.font = '16px "Baloo 2", "Comic Sans MS", cursive';
    this.renderer.ctx.fillText('点击重新开始游戏', centerX, centerY + 130);

    this.renderer.ctx.restore();
  }

  gameLoop(timestamp = 0) {
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = timestamp;
    }

    let frameTime = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;

    if (frameTime > 0.25) {
      frameTime = 0.25;
    }

    this.accumulator += frameTime;

    let subSteps = 0;
    while (this.accumulator >= this.fixedDt && subSteps < this.maxSubSteps) {
      this.update(this.fixedDt);
      this.accumulator -= this.fixedDt;
      subSteps++;
    }

    if (subSteps >= this.maxSubSteps && this.accumulator >= this.fixedDt) {
      this.accumulator = 0;
    }

    const alpha = this.accumulator / this.fixedDt;
    this.render(alpha);

    this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  bindButtonEvents() {
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (this.replaySystem.isReplaying) {
      const replayBtnX = this.width - 180;
      const replayBtnY = this.height - 60;
      const btnWidth = 80;
      const btnHeight = 35;
      const spacing = 10;

      if (this.renderer.isPointInButton(x, y, replayBtnX, replayBtnY, btnWidth, btnHeight)) {
        this.toggleReplay();
        return;
      } else if (this.renderer.isPointInButton(x, y, replayBtnX + btnWidth + spacing, replayBtnY, btnWidth, btnHeight)) {
        this.replaySystem.playbackSpeed = this.replaySystem.playbackSpeed >= 3 ? 0.5 : this.replaySystem.playbackSpeed + 0.5;
        return;
      }
    }

    if (this.gameState === 'levelSelect') {
      this.handleLevelSelectClick(x, y);
      return;
    }

    if (this.gameMode === 'editor') {
      this.levelEditor.handleMouseDown(x, y);
      return;
    }

    this.handleObjectClick(x, y);

    if (this.gameState === 'success' || this.gameState === 'fail' || this.gameState === 'complete') {
      this.handleOverlayClick();
      return;
    }

    const btnY = this.height - 60;
    const btnWidth = 120;
    const btnHeight = 45;
    const spacing = 20;
    const totalWidth = btnWidth * 2 + spacing;
    const startX = (this.width - totalWidth) / 2;

    const resetBtnX = startX;
    const nextBtnX = startX + btnWidth + spacing;

    if (this.renderer.isPointInButton(x, y, resetBtnX, btnY, btnWidth, btnHeight)) {
      this.resetLevel();
    } else if (this.renderer.isPointInButton(x, y, nextBtnX, btnY, btnWidth, btnHeight)) {
      this.nextLevel();
    }
  }

  handleLevelSelectClick(x, y) {
    const panelX = this.width / 2 - 150;
    const panelY = this.height / 2 - 200;
    const panelWidth = 300;
    const panelHeight = 400;

    if (x < panelX || x > panelX + panelWidth || y < panelY || y > panelY + panelHeight) {
      this.gameState = 'playing';
      return;
    }

    const cols = 3;
    const buttonSize = Math.min((panelWidth - 40) / cols - 10, 60);
    const startX = panelX + 20;
    const startY = panelY + 70;

    for (let i = 0; i < LEVELS.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const btnX = startX + col * (buttonSize + 10);
      const btnY = startY + row * (buttonSize + 15);

      if (x >= btnX && x <= btnX + buttonSize && y >= btnY && y <= btnY + buttonSize) {
        const level = LEVELS[i];
        if (isLevelUnlocked(level, this.levelProgress.progress)) {
          this.loadLevel(i);
        }
        return;
      }
    }
  }

  handleOverlayClick() {
    if (this.gameState === 'success') {
      this.nextLevel();
    } else if (this.gameState === 'fail') {
      this.resetLevel();
    } else if (this.gameState === 'complete') {
      this.currentLevel = 0;
      this.score = 0;
      this.loadLevel(0);
    }
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');

  function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const maxWidth = Math.min(window.innerWidth - 40, 600);
    const maxHeight = Math.min(window.innerHeight - 100, 800);

    canvas.width = maxWidth;
    canvas.height = maxHeight;

    if (window.gameInstance) {
      if (window.gameInstance.resizeTimeout) {
        clearTimeout(window.gameInstance.resizeTimeout);
      }
      window.gameInstance.resizeTimeout = setTimeout(() => {
        window.gameInstance.resize();
        window.gameInstance.resizeTimeout = null;
      }, window.gameInstance.resizeDebounceMs);
    }
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  window.gameInstance = new Game(canvas);
});
