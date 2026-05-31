const GAME_STATE = {
  MENU: 'menu',
  TRACK_SELECT: 'track_select',
  UPGRADE: 'upgrade',
  CAREER: 'career',
  LEADERBOARD: 'leaderboard',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameover',
  FINISHED: 'finished',
  EDITOR: 'editor',
  CHALLENGE: 'challenge',
};

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.saveSystem = new SaveSystem();
    this.upgradeSystem = new UpgradeSystem(this.saveSystem);
    this.careerSystem = new CareerSystem(this.saveSystem);
    this.trickSystem = new TrickSystem();
    this.leaderboard = new Leaderboard();
    this.ghostRecorder = new GhostRecorder();
    this.ghostPlayer = new GhostPlayer();

    this.currentTheme = 'desert';
    this.gameMode = 'quick';
    this.currentEventId = null;
    this.ghostRaceEnabled = false;
    this.ghostRank = 1;

    this.terrain = new Terrain(12000, this.currentTheme);
    this.physics = new Physics(this.currentTheme, this.saveSystem.getUpgrades());
    this.renderer = new Renderer(this.canvas);
    this.ui = new UI(this.canvas);
    this.moto = new Motorcycle(100, 0, this.saveSystem.getUpgrades());

    this.state = GAME_STATE.MENU;
    this.gameTime = 0;
    this.lastTime = 0;
    this.input = { up: false, down: false, left: false, right: false, space: false };
    this.lastTrickRotations = 0;
    this.wasGrounded = true;
    this.animFrame = null;

    this.trickActive = false;
    this.lastCompletedTrick = null;

    this.resize();
    this.initMotoPosition();
    this.bindEvents();
    this.start();
  }

  initMotoPosition() {
    const startPos = this.terrain.getStartPosition();
    this.moto.reset(startPos.x, startPos.y);
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.renderer.resize();
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') this.input.up = true;
      if (e.key === 'ArrowDown') this.input.down = true;
      if (e.key === 'ArrowLeft') this.input.left = true;
      if (e.key === 'ArrowRight') this.input.right = true;
      if (e.key === ' ') {
        this.input.space = true;
        this.handleSpacePress();
      }
      if (e.key === 'Escape') {
        this.handleEscape();
      }
      if (e.key === '1') this.handleNumericKey(1);
      if (e.key === '2') this.handleNumericKey(2);
      if (e.key === '3') this.handleNumericKey(3);
      if (e.key === '4') this.handleNumericKey(4);
      if (e.key === '5') this.handleNumericKey(5);

      if (e.key === 'Enter') {
        this.handleEnter();
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowUp') this.input.up = false;
      if (e.key === 'ArrowDown') this.input.down = false;
      if (e.key === 'ArrowLeft') this.input.left = false;
      if (e.key === 'ArrowRight') this.input.right = false;
      if (e.key === ' ') this.input.space = false;
    });
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const centerX = w / 2;
    const centerY = h / 2;

    if (this.state === GAME_STATE.MENU) {
      this.handleMenuClick(x, y, centerX, centerY);
    } else if (this.state === GAME_STATE.TRACK_SELECT) {
      this.handleTrackSelectClick(x, y, centerX, centerY);
    } else if (this.state === GAME_STATE.UPGRADE) {
      this.handleUpgradeClick(x, y, centerX, centerY);
    } else if (this.state === GAME_STATE.CAREER) {
      this.handleCareerClick(x, y, centerX, centerY);
    } else if (this.state === GAME_STATE.LEADERBOARD) {
      this.handleLeaderboardClick(x, y, centerX, centerY);
    }
  }

  handleMenuClick(x, y, centerX, centerY) {
    const menuItems = [
      { key: '1', action: () => { this.gameMode = 'quick'; this.state = GAME_STATE.TRACK_SELECT; } },
      { key: '2', action: () => { this.gameMode = 'career'; this.state = GAME_STATE.CAREER; } },
      { key: '3', action: () => { this.state = GAME_STATE.UPGRADE; } },
      { key: '4', action: () => { this.state = GAME_STATE.LEADERBOARD; } },
      { key: '5', action: () => { this.state = GAME_STATE.EDITOR; } },
    ];

    menuItems.forEach((item, i) => {
      const itemY = centerY + 20 + i * 55;
      if (y >= itemY - 25 && y <= itemY + 10 && x >= centerX - 200 && x <= centerX + 200) {
        item.action();
      }
    });
  }

  handleTrackSelectClick(x, y, centerX, centerY) {
    const themes = ['desert', 'snow', 'city', 'moon'];
    themes.forEach((themeId, i) => {
      const cardX = centerX - 350 + i * 220;
      const cardY = centerY - 80;
      if (x >= cardX - 80 && x <= cardX + 80 && y >= cardY && y <= cardY + 200) {
        this.selectTrack(themeId);
      }
    });
  }

  handleUpgradeClick(x, y, centerX, centerY) {
    const upgrades = ['engine', 'tire', 'suspension'];
    const profile = this.saveSystem.getProfile();

    upgrades.forEach((type, i) => {
      const comparison = this.upgradeSystem.getComparison(type);
      const cardX = centerX - 320 + i * 280;
      const cardY = centerY - 80;

      if (x >= cardX - 110 && x <= cardX + 110 && y >= cardY && y <= cardY + 240) {
        if (comparison.canUpgrade) {
          const price = comparison.price;
          if (profile.total_coins >= price) {
            this.upgradeSystem.purchaseUpgrade(type);
            this.saveSystem.saveAll();
            this.ui.showMessage('UPGRADED!', '#00ff88');
          } else {
            this.ui.showMessage('NOT ENOUGH COINS!', '#ff3366');
          }
        }
      }
    });
  }

  handleCareerClick(x, y, centerX, centerY) {
    const events = this.careerSystem.getAllEvents();
    events.forEach((event, i) => {
      const cardX = centerX - 400 + (i % 4) * 210;
      const cardY = centerY - 40 + Math.floor(i / 4) * 130;

      if (x >= cardX - 90 && x <= cardX + 90 && y >= cardY && y <= cardY + 110) {
        if (event.isUnlocked) {
          this.currentEventId = event.id;
          this.currentTheme = event.trackTheme;
          this.renderer.setTheme(event.trackTheme);
          this.startGame();
        }
      }
    });
  }

  handleLeaderboardClick(x, y, centerX, centerY) {
    const themes = ['desert', 'snow', 'city', 'moon'];
    themes.forEach((themeId, i) => {
      const cardX = centerX - 380 + i * 200;
      const cardY = centerY - 100;

      if (x >= cardX - 85 && x <= cardX + 85 && y >= cardY && y <= cardY + 260) {
        const scores = this.leaderboard.getTopScores(themeId, 5);
        if (scores.length > 0) {
          this.currentTheme = themeId;
          this.ghostRaceEnabled = true;
          this.ghostRank = 1;
          this.state = GAME_STATE.TRACK_SELECT;
        }
      }
    });
  }

  handleMouseDown(e) {
    if (this.state !== GAME_STATE.EDITOR) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (y < this.canvas.height - 120) {
      this.editorState.isDragging = true;
      this.editorState.lastX = x;
      this.editorState.lastY = y;
      this.applyTerrainEdit(x, y);
    }
  }

  handleMouseMove(e) {
    if (this.state !== GAME_STATE.EDITOR || !this.editorState?.isDragging) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.applyTerrainEdit(x, y);
    this.editorState.lastX = x;
    this.editorState.lastY = y;
  }

  handleMouseUp(e) {
    if (this.state === GAME_STATE.EDITOR && this.editorState) {
      this.editorState.isDragging = false;
    }
  }

  applyTerrainEdit(x, y) {
    if (!this.editorState) return;

    const tool = this.editorState.selectedTool;
    const brushSize = this.editorState.brushSize;
    const brushHeight = this.editorState.brushHeight;
    const points = this.editorState.terrainPoints;

    points.forEach((point, i) => {
      const dist = Math.abs(point.x - x);
      if (dist < brushSize) {
        const falloff = 1 - (dist / brushSize);
        const influence = falloff * falloff;

        switch (tool) {
          case 'hill':
            point.y -= brushHeight * influence;
            break;
          case 'valley':
            point.y += brushHeight * influence;
            break;
          case 'ramp':
            if (i > 0) {
              const prevPoint = points[i - 1];
              const targetY = prevPoint.y - brushHeight * 0.3 * influence;
              point.y += (targetY - point.y) * influence;
            }
            break;
          case 'flat':
            const avgY = 400;
            point.y += (avgY - point.y) * influence * 0.5;
            break;
          case 'smooth':
            if (i > 0 && i < points.length - 1) {
              const avg = (points[i - 1].y + points[i + 1].y) / 2;
              point.y += (avg - point.y) * influence * 0.3;
            }
            break;
        }

        point.y = Math.max(200, Math.min(550, point.y));
      }
    });
  }

  handleSpacePress() {
    if (this.state === GAME_STATE.PLAYING) {
      if (!this.moto.isGrounded && !this.moto.supermanState.active) {
        this.moto.activateSuperman();
      } else if (this.moto.supermanState.active) {
        this.moto.deactivateSuperman();
      }
    }
  }

  handleEscape() {
    if (this.state === GAME_STATE.PLAYING) {
      this.state = GAME_STATE.PAUSED;
    } else if (this.state === GAME_STATE.PAUSED) {
      this.state = GAME_STATE.PLAYING;
    } else if (this.state !== GAME_STATE.MENU) {
      this.returnToMenu();
    }
  }

  handleNumericKey(num) {
    if (this.state === GAME_STATE.MENU) {
      if (num === 1) {
        this.gameMode = 'quick';
        this.state = GAME_STATE.TRACK_SELECT;
      } else if (num === 2) {
        this.gameMode = 'career';
        this.state = GAME_STATE.CAREER;
      } else if (num === 3) {
        this.state = GAME_STATE.UPGRADE;
      } else if (num === 4) {
        this.state = GAME_STATE.LEADERBOARD;
      } else if (num === 5) {
        this.state = GAME_STATE.EDITOR;
      }
    } else if (this.state === GAME_STATE.TRACK_SELECT) {
      const themes = ['desert', 'snow', 'city', 'moon'];
      if (num <= themes.length) {
        this.selectTrack(themes[num - 1]);
      }
    } else if (this.state === GAME_STATE.EDITOR) {
      const tools = ['hill', 'valley', 'ramp', 'flat', 'smooth'];
      if (num >= 1 && num <= 5) {
        this.editorState.selectedTool = tools[num - 1];
      }
    }
  }

  handleEnter() {
    if (this.state === GAME_STATE.MENU) {
      this.state = GAME_STATE.TRACK_SELECT;
    } else if (this.state === GAME_STATE.TRACK_SELECT) {
      this.startGame();
    } else if (this.state === GAME_STATE.UPGRADE) {
      this.state = GAME_STATE.TRACK_SELECT;
    } else if (this.state === GAME_STATE.CAREER) {
      this.state = GAME_STATE.TRACK_SELECT;
    } else if (this.state === GAME_STATE.LEADERBOARD) {
      this.state = GAME_STATE.MENU;
    } else if (this.state === GAME_STATE.GAME_OVER || this.state === GAME_STATE.FINISHED) {
      this.restartGame();
    } else if (this.state === GAME_STATE.PAUSED) {
      this.state = GAME_STATE.PLAYING;
    } else if (this.state === GAME_STATE.EDITOR) {
      this.currentTheme = 'desert';
      this.renderer.setTheme('desert');
      const upgrades = this.saveSystem.getUpgrades();
      this.terrain = new Terrain(5000, 'desert');
      if (this.editorState && this.editorState.terrainPoints.length > 1) {
        this.terrain.loadCustomPoints(this.editorState.terrainPoints);
      }
      this.physics = new Physics('desert', upgrades);
      this.moto = new Motorcycle(100, 0, upgrades);
      this.trickSystem.reset();
      const startPos = this.terrain.getStartPosition();
      this.moto.reset(startPos.x, startPos.y);
      this.ghostRecorder.start();
      this.state = GAME_STATE.PLAYING;
      this.gameTime = 0;
      this.ui.score = 0;
      this.ui.displayScore = 0;
      this.ui.combo = 0;
      this.ui.maxCombo = 0;
      this.ui.trickHistory = [];
      this.lastTrickRotations = 0;
    }
  }

  selectTrack(theme) {
    this.currentTheme = theme;
    this.renderer.setTheme(theme);
    this.startGame();
  }

  startGame() {
    const upgrades = this.saveSystem.getUpgrades();
    const trackLength = TRACK_THEMES[this.currentTheme].terrain.length || 12000;

    this.terrain = new Terrain(trackLength, this.currentTheme);
    this.physics = new Physics(this.currentTheme, upgrades);
    this.moto = new Motorcycle(100, 0, upgrades);
    this.trickSystem.reset();

    const startPos = this.terrain.getStartPosition();
    this.moto.reset(startPos.x, startPos.y);

    if (this.gameMode === 'career' && this.currentEventId) {
      this.careerSystem.startEvent(this.currentEventId);
    }

    if (this.ghostRaceEnabled) {
      this.ghostPlayer.load(this.currentTheme, this.ghostRank);
      this.ghostPlayer.reset();
    }

    this.ghostRecorder.start();

    this.state = GAME_STATE.PLAYING;
    this.gameTime = 0;
    this.ui.score = 0;
    this.ui.displayScore = 0;
    this.ui.combo = 0;
    this.ui.maxCombo = 0;
    this.ui.trickHistory = [];
    this.lastTrickRotations = 0;
  }

  restartGame() {
    this.startGame();
  }

  returnToMenu() {
    this.state = GAME_STATE.MENU;
    this.ghostRaceEnabled = false;
    this.gameMode = 'quick';
    this.currentEventId = null;
  }

  start() {
    this.lastTime = performance.now();
    this.loop();
  }

  loop() {
    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    dt = Math.min(dt, 0.05);

    this.update(dt);
    this.render();

    this.animFrame = requestAnimationFrame(() => this.loop());
  }

  update(dt) {
    this.renderer.updateParticles(dt);
    this.ui.update(dt, this.moto, this.state);
    this.saveSystem.autoSave(performance.now());

    if (this.state === GAME_STATE.EDITOR) {
      this.updateEditor(dt);
      return;
    }

    if (this.state === GAME_STATE.CHALLENGE) {
      this.updateChallenge(dt);
      return;
    }

    if (this.state !== GAME_STATE.PLAYING) return;

    this.gameTime += dt;

    this.physics.update(this.moto, this.terrain, dt, this.input);

    if (this.moto.supermanState && this.moto.supermanState.active) {
      this.moto.supermanState.duration += dt;
      this.moto.supermanState.maxDuration = Math.max(
        this.moto.supermanState.maxDuration,
        this.moto.supermanState.duration
      );
    }

    this.updateDriftState(dt);

    const trickResult = this.trickSystem.update(this.moto, dt, this.terrain);
    this.handleTrickCompletion(trickResult);

    this.handleTrickScoring();

    if (this.moto.justLanded && !this.moto.isCrashed) {
      this.renderer.addLandingParticles(this.moto.x, this.moto.y + 18, 15);
      this.renderer.addScreenShake(Math.min(5, this.moto.landingImpact * 0.01));

      if (this.moto.landingImpact > 200) {
        this.ui.showMessage('HARD LANDING!', '#ff6b35');
      }
    }

    if (this.ghostRaceEnabled && this.ghostPlayer.hasData()) {
      this.ghostPlayer.update(dt);
    }

    if (this.ghostRecorder.isActive()) {
      this.ghostRecorder.record(this.moto, this.input, performance.now());
    }

    this.wasGrounded = this.moto.isGrounded;
    this.moto.update(dt, this.physics);
    this.renderer.updateCamera(this.moto, dt);

    if (this.moto.isCrashed) {
      if (Date.now() - this.moto.crashTime > 1500) {
        this.handleGameOver();
      }
    }

    if (this.terrain.isFinish(this.moto.x)) {
      this.handleFinish();
    }
  }

  updateDriftState(dt) {
    if (!this.moto.driftState) return;

    if (this.moto.isGrounded && this.input.left && Math.abs(this.moto.velocityX) > 150) {
      const terrainAngle = this.terrain.getAngle(this.moto.x);
      const angleDiff = this.moto.angle - terrainAngle;

      if (Math.abs(angleDiff) > 0.15) {
        this.moto.driftState.isDrifting = true;
        this.moto.driftState.driftAngle = angleDiff;
        this.moto.driftState.driftDuration += dt;
        this.moto.driftState.maxDriftAngle = Math.max(
          Math.abs(this.moto.driftState.maxDriftAngle),
          Math.abs(angleDiff)
        );
        return;
      }
    }

    if (this.moto.driftState.isDrifting) {
      this.moto.driftState.isDrifting = false;
      this.moto.driftState.driftDuration = 0;
      this.moto.driftState.maxDriftAngle = 0;
    }
  }

  handleTrickCompletion(trickResult) {
    if (trickResult && trickResult.isActive) {
      if (!this.trickActive) {
        this.trickActive = true;
      }
    } else if (this.trickActive) {
      this.trickActive = false;
    }

    const completedTrick = this.trickSystem.lastCompletedTrick;
    if (completedTrick && completedTrick !== this.lastCompletedTrick) {
      this.lastCompletedTrick = completedTrick;
      const trickName = completedTrick.name;
      const score = completedTrick.score;
      const quality = completedTrick.quality;

      const color = quality === 'perfect' ? '#ff3366' :
                    quality === 'good' ? '#ff6b35' : '#00ff88';

      const qualityText = quality !== 'ok' ? quality.toUpperCase() + ' ' : '';
      this.renderer.addTrickPopup(
        qualityText + trickName + ' +' + score,
        this.moto.x,
        this.moto.y - 60,
        color
      );
      this.renderer.addTrickParticles(this.moto.x, this.moto.y, 25, color);
      this.renderer.addScreenShake(4);

      this.ui.score += score;
      this.ui.trickHistory.push({
        name: trickName,
        score: score,
        quality: quality,
        time: this.gameTime,
      });
    }
  }

  handleTrickScoring() {
    if (!this.moto.isGrounded && !this.moto.isCrashed) {
      const currentRotations = this.moto.getCurrentTrickRotations();
      const fullRotations = Math.floor(currentRotations);

      if (fullRotations > this.lastTrickRotations) {
        const newRotations = fullRotations - this.lastTrickRotations;
        const trickName = this.moto.getTrickName();
        const basePoints = newRotations * 500;

        const earnedPoints = this.ui.addScore(basePoints);

        this.renderer.addTrickPopup(
          trickName + ' +' + earnedPoints,
          this.moto.x,
          this.moto.y - 60,
          this.ui.combo >= 3 ? '#ff3366' : '#00ff88'
        );
        this.renderer.addTrickParticles(this.moto.x, this.moto.y, 20, '#00ff88');
        this.renderer.addScreenShake(3);

        this.lastTrickRotations = fullRotations;
      }
    }

    if (this.moto.isGrounded) {
      this.lastTrickRotations = 0;

      if (this.moto.velocityX > 500 && this.moto.isGrounded) {
        if (Math.random() < 0.01) {
          const speedBonus = Math.floor(this.moto.velocityX * 0.1);
          this.ui.addScore(speedBonus);
          this.renderer.addTrickPopup(
            'HIGH SPEED +' + speedBonus,
            this.moto.x,
            this.moto.y - 40,
            '#ff6b35'
          );
        }
      }
    }

    if (this.terrain.isRamp(this.moto.x) && this.moto.isGrounded && this.moto.velocityX > 200) {
      if (Math.random() < 0.02) {
        const rampBonus = 100;
        const earned = this.ui.addScore(rampBonus);
        this.renderer.addTrickPopup(
          'RAMP BOOST +' + earned,
          this.moto.x,
          this.moto.y - 40,
          '#ff6b35'
        );
      }
    }
  }

  handleGameOver() {
    this.state = GAME_STATE.GAME_OVER;
    this.ghostRecorder.stop(this.ui.score);

    if (this.gameMode === 'career' && this.currentEventId) {
      this.careerSystem.completeEvent(this.ui.score, this.gameTime);
    }

    this.saveSystem.saveAll();
  }

  handleFinish() {
    this.state = GAME_STATE.FINISHED;
    this.renderer.addTrickParticles(this.moto.x, this.moto.y, 50, '#00ff88');
    this.renderer.addTrickParticles(this.moto.x, this.moto.y, 50, '#ff6b35');
    this.renderer.addScreenShake(10);

    const ghostData = this.ghostRecorder.stop(this.ui.score);

    const lbResult = this.leaderboard.addScore(this.currentTheme, this.ui.score, this.gameTime);
    if (lbResult.isNewRecord) {
      this.ghostRecorder.save(this.currentTheme, lbResult.rank);
      this.leaderboard.setGhostAvailable(this.currentTheme, lbResult.rank, true);
    }

    if (this.gameMode === 'career' && this.currentEventId) {
      const result = this.careerSystem.completeEvent(this.ui.score, this.gameTime);
      if (result) {
        if (result.tierUp) {
          this.ui.showMessage('TIER UP! ' + CAREER_TIER_NAMES[result.newTier], '#ff3366');
          this.renderer.addScreenShake(8);
          this.renderer.addTrickParticles(this.moto.x, this.moto.y, 40, '#ff3366');
        } else if (result.earnedStars > 0) {
          this.ui.showMessage('+ ' + result.earnedStars + ' STARS!', '#ffd700');
        }
      }
    }

    this.saveSystem.saveAll();
  }

  render() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.clearRect(0, 0, w, h);

    const ghostPlayer = this.ghostRaceEnabled ? this.ghostPlayer : null;
    this.renderer.render(this.state, this.moto, this.terrain, this.gameTime, ghostPlayer);

    if (this.state === GAME_STATE.MENU) {
      this.renderMenu(w, h);
    } else if (this.state === GAME_STATE.TRACK_SELECT) {
      this.renderTrackSelect(w, h);
    } else if (this.state === GAME_STATE.UPGRADE) {
      this.renderUpgrade(w, h);
    } else if (this.state === GAME_STATE.CAREER) {
      this.renderCareer(w, h);
    } else if (this.state === GAME_STATE.LEADERBOARD) {
      this.renderLeaderboard(w, h);
    } else if (this.state === GAME_STATE.PAUSED) {
      this.renderPaused(w, h);
    } else if (this.state === GAME_STATE.EDITOR) {
      this.renderEditor(w, h);
    } else if (this.state === GAME_STATE.CHALLENGE) {
      this.renderChallenge(w, h);
    } else if (this.state === GAME_STATE.PLAYING || this.state === GAME_STATE.GAME_OVER || this.state === GAME_STATE.FINISHED) {
      this.ui.renderHUD(this.ctx, this.moto, this.gameTime, this.state, this.terrain);

      if (this.trickActive) {
        this.renderActiveTrickIndicator(w, h);
      }

      if (this.state === GAME_STATE.GAME_OVER) {
        this.ui.renderGameOver(this.ctx, w, h, this.ui.score, this.gameTime);
      } else if (this.state === GAME_STATE.FINISHED) {
        this.ui.renderFinished(this.ctx, w, h, this.ui.score, this.gameTime, this.ui.maxCombo);
      }
    }
  }

  renderMenu(w, h) {
    const ctx = this.ctx;
    const centerX = w / 2;
    const centerY = h / 2;

    ctx.fillStyle = 'rgba(5, 13, 26, 0.9)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = 'bold 64px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6b35';
    ctx.shadowColor = '#ff6b35';
    ctx.shadowBlur = 30;
    ctx.fillText('MOTO STUNT', centerX, centerY - 120);
    ctx.shadowBlur = 0;

    ctx.font = 'bold 32px Orbitron, monospace';
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 15;
    ctx.fillText('RACING V2.0', centerX, centerY - 70);
    ctx.shadowBlur = 0;

    const menuItems = [
      { key: '1', text: 'QUICK PLAY', color: '#00ff88' },
      { key: '2', text: 'CAREER MODE', color: '#ff6b35' },
      { key: '3', text: 'UPGRADES', color: '#9d4edd' },
      { key: '4', text: 'LEADERBOARD', color: '#00d4ff' },
      { key: '5', text: 'TRACK EDITOR', color: '#ffd700' },
    ];

    menuItems.forEach((item, i) => {
      const y = centerY + 20 + i * 55;
      ctx.font = '22px Orbitron, monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = item.color;
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 8;
      ctx.fillText('[' + item.key + ']', centerX - 180, y);
      ctx.fillText(item.text, centerX - 120, y);
      ctx.shadowBlur = 0;
    });

    const profile = this.saveSystem.getProfile();
    ctx.font = '16px Orbitron, monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff88';
    ctx.fillText('COINS: ' + profile.total_coins, w - 40, 40);
    ctx.fillText('STARS: ' + profile.total_stars, w - 40, 65);
    ctx.fillText('TIER: ' + CAREER_TIER_NAMES[profile.career_tier], w - 40, 90);

    ctx.font = '14px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff55';
    ctx.fillText('↑↓←→ CONTROLS  |  SPACE SUPERMAN  |  ESC PAUSE', centerX, h - 40);
  }

  renderTrackSelect(w, h) {
    const ctx = this.ctx;
    const centerX = w / 2;
    const centerY = h / 2;

    ctx.fillStyle = 'rgba(5, 13, 26, 0.92)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = 'bold 36px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 15;
    ctx.fillText('SELECT TRACK', centerX, centerY - 180);
    ctx.shadowBlur = 0;

    const themes = ['desert', 'snow', 'city', 'moon'];
    themes.forEach((themeId, i) => {
      const theme = TRACK_THEMES[themeId];
      const x = centerX - 350 + i * 220;
      const y = centerY - 80;
      const isSelected = this.currentTheme === themeId;

      ctx.fillStyle = isSelected ? theme.visual.accentColor + '30' : 'rgba(30, 40, 60, 0.8)';
      this.ui.roundRect(ctx, x - 80, y, 160, 200, 10);
      ctx.fill();

      ctx.strokeStyle = isSelected ? theme.visual.accentColor : '#ffffff20';
      ctx.lineWidth = isSelected ? 3 : 1;
      this.ui.roundRect(ctx, x - 80, y, 160, 200, 10);
      ctx.stroke();

      ctx.fillStyle = theme.visual.accentColor;
      ctx.shadowColor = theme.visual.glowColor;
      ctx.shadowBlur = 10;
      ctx.font = 'bold 20px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[' + (i + 1) + ']', x, y + 30);
      ctx.fillText(theme.name, x, y + 60);
      ctx.shadowBlur = 0;

      ctx.font = '14px Orbitron, monospace';
      ctx.fillStyle = '#ffffff88';
      ctx.fillText('Difficulty: ' + '★'.repeat(theme.difficulty), x, y + 90);
      ctx.fillText(theme.description, x, y + 115, 140);

      const physics = theme.physics;
      ctx.fillStyle = '#ffffff55';
      ctx.font = '11px Orbitron, monospace';
      ctx.fillText('Gravity: ' + (physics.gravity / 1800 * 100).toFixed(0) + '%', x, y + 150);
      ctx.fillText('Grip: ' + (physics.gripMultiplier * 100).toFixed(0) + '%', x, y + 170);
      ctx.fillText('Length: ' + (theme.terrain.length / 1000).toFixed(0) + 'km', x, y + 190);
    });

    ctx.font = '18px Orbitron, monospace';
    ctx.fillStyle = '#00ff88';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS ENTER TO RACE  |  ESC TO BACK', centerX, centerY + 160);

    if (this.ghostRaceEnabled) {
      ctx.fillStyle = '#00ff88';
      ctx.fillText('GHOST RACE: #' + this.ghostRank, centerX, centerY + 190);
    }
  }

  renderUpgrade(w, h) {
    const ctx = this.ctx;
    const centerX = w / 2;
    const centerY = h / 2;

    ctx.fillStyle = 'rgba(5, 13, 26, 0.92)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = 'bold 36px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9d4edd';
    ctx.shadowColor = '#9d4edd';
    ctx.shadowBlur = 15;
    ctx.fillText('MOTO UPGRADES', centerX, centerY - 180);
    ctx.shadowBlur = 0;

    const profile = this.saveSystem.getProfile();
    ctx.font = '20px Orbitron, monospace';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'right';
    ctx.fillText('COINS: ' + profile.total_coins, w - 40, 40);

    const upgrades = ['engine', 'tire', 'suspension'];
    upgrades.forEach((type, i) => {
      const comparison = this.upgradeSystem.getComparison(type);
      const x = centerX - 320 + i * 280;
      const y = centerY - 80;

      const info = getUpgradeInfo(type, comparison.currentLevel);

      ctx.fillStyle = 'rgba(30, 40, 60, 0.8)';
      this.ui.roundRect(ctx, x - 110, y, 220, 240, 10);
      ctx.fill();

      ctx.strokeStyle = info.color + '60';
      ctx.lineWidth = 2;
      this.ui.roundRect(ctx, x - 110, y, 220, 240, 10);
      ctx.stroke();

      ctx.fillStyle = info.color;
      ctx.shadowColor = info.color;
      ctx.shadowBlur = 10;
      ctx.font = 'bold 22px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(info.name.toUpperCase(), x, y + 35);
      ctx.shadowBlur = 0;

      ctx.font = '16px Orbitron, monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('LEVEL ' + comparison.currentLevel + ' / 5', x, y + 65);

      const barW = 180;
      const barH = 8;
      const barX = x - barW / 2;
      const barY = y + 80;
      for (let s = 0; s < 5; s++) {
        ctx.fillStyle = s < comparison.currentLevel ? info.color : '#1a1a2e';
        ctx.fillRect(barX + s * (barW / 5 + 4), barY, barW / 5, barH);
      }

      const stats = info.stats;
      ctx.font = '13px Orbitron, monospace';
      ctx.fillStyle = '#ffffff88';
      let statY = y + 115;
      for (const statKey in stats) {
        if (stats.hasOwnProperty(statKey)) {
          const statName = statKey.replace(/([A-Z])/g, ' $1').trim();
          ctx.textAlign = 'left';
          ctx.fillText(statName, x - 90, statY);
          ctx.textAlign = 'right';
          ctx.fillStyle = info.color;
          ctx.fillText(stats[statKey], x + 90, statY);
          ctx.fillStyle = '#ffffff88';
          statY += 22;
        }
      }

      if (comparison.canUpgrade) {
        const price = comparison.price;
        const canAfford = profile.total_coins >= price;

        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = canAfford ? '#00ff88' : '#ff3366';
        ctx.fillText('UPGRADE: ' + price + ' COINS', x, y + 205);
        ctx.fillStyle = '#ffffff55';
        ctx.font = '12px Orbitron, monospace';
        ctx.fillText('CLICK TO UPGRADE', x, y + 225);
      } else {
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('MAX LEVEL', x, y + 215);
      }
    });

    ctx.font = '18px Orbitron, monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS ENTER TO CONTINUE  |  ESC TO BACK', centerX, centerY + 190);
  }

  renderCareer(w, h) {
    const ctx = this.ctx;
    const centerX = w / 2;
    const centerY = h / 2;

    ctx.fillStyle = 'rgba(5, 13, 26, 0.92)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = 'bold 36px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6b35';
    ctx.shadowColor = '#ff6b35';
    ctx.shadowBlur = 15;
    ctx.fillText('CAREER MODE', centerX, centerY - 180);
    ctx.shadowBlur = 0;

    const tierProgress = this.careerSystem.getTierProgress();
    ctx.font = '20px Orbitron, monospace';
    ctx.fillStyle = tierProgress.currentTierColor;
    ctx.fillText(tierProgress.currentTierName + '  -  ' + tierProgress.currentStars + ' STARS', centerX, centerY - 130);

    const totalProgress = this.careerSystem.getTotalProgress();
    ctx.font = '14px Orbitron, monospace';
    ctx.fillStyle = '#ffffff88';
    ctx.fillText(
      'Progress: ' + Math.floor(totalProgress.completionPercent) + '%  |  ' +
      totalProgress.totalStars + '/' + totalProgress.maxStars + ' STARS',
      centerX, centerY - 100
    );

    const events = this.careerSystem.getAllEvents();
    events.forEach((event, i) => {
      const x = centerX - 400 + (i % 4) * 210;
      const y = centerY - 40 + Math.floor(i / 4) * 130;
      const isUnlocked = event.isUnlocked;

      ctx.fillStyle = isUnlocked ? event.tierColor + '20' : 'rgba(20, 20, 30, 0.8)';
      this.ui.roundRect(ctx, x - 90, y, 180, 110, 8);
      ctx.fill();

      ctx.strokeStyle = isUnlocked ? event.tierColor : '#ffffff10';
      ctx.lineWidth = isUnlocked ? 2 : 1;
      this.ui.roundRect(ctx, x - 90, y, 180, 110, 8);
      ctx.stroke();

      if (isUnlocked) {
        ctx.fillStyle = event.tierColor;
        ctx.font = 'bold 14px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(event.name, x, y + 25);

        ctx.fillStyle = '#ffffff88';
        ctx.font = '11px Orbitron, monospace';
        ctx.fillText(event.trackTheme.toUpperCase(), x, y + 45);

        const stars = event.progress.stars;
        ctx.font = '18px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('★'.repeat(stars) + '☆'.repeat(3 - stars), x, y + 70);

        if (event.progress.completed) {
          ctx.font = '11px Orbitron, monospace';
          ctx.fillStyle = '#00ff88';
          ctx.fillText('BEST: ' + event.progress.best_score, x, y + 95);
        } else {
          ctx.font = '11px Orbitron, monospace';
          ctx.fillStyle = '#ffffff55';
          ctx.fillText('NOT COMPLETED', x, y + 95);
        }
      } else {
        ctx.font = '24px Arial';
        ctx.fillStyle = '#ffffff30';
        ctx.textAlign = 'center';
        ctx.fillText('🔒', x, y + 60);
        ctx.font = '12px Orbitron, monospace';
        ctx.fillStyle = '#ffffff30';
        ctx.fillText('NEEDS ' + event.unlockRequirement + ' STARS', x, y + 90);
      }
    });

    ctx.font = '18px Orbitron, monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS ENTER TO RACE  |  ESC TO BACK', centerX, centerY + 200);
  }

  renderLeaderboard(w, h) {
    const ctx = this.ctx;
    const centerX = w / 2;
    const centerY = h / 2;

    ctx.fillStyle = 'rgba(5, 13, 26, 0.92)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = 'bold 36px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 15;
    ctx.fillText('LEADERBOARD', centerX, centerY - 180);
    ctx.shadowBlur = 0;

    const themes = ['desert', 'snow', 'city', 'moon'];
    themes.forEach((themeId, i) => {
      const theme = TRACK_THEMES[themeId];
      const x = centerX - 380 + i * 200;
      const y = centerY - 100;

      ctx.fillStyle = theme.visual.accentColor + '15';
      this.ui.roundRect(ctx, x - 85, y, 170, 260, 8);
      ctx.fill();

      ctx.strokeStyle = theme.visual.accentColor + '40';
      ctx.lineWidth = 2;
      this.ui.roundRect(ctx, x - 85, y, 170, 260, 8);
      ctx.stroke();

      ctx.font = 'bold 16px Orbitron, monospace';
      ctx.fillStyle = theme.visual.accentColor;
      ctx.textAlign = 'center';
      ctx.fillText(theme.name.toUpperCase(), x, y + 25);

      const scores = this.leaderboard.getTopScores(themeId, 5);
      if (scores.length === 0) {
        ctx.font = '13px Orbitron, monospace';
        ctx.fillStyle = '#ffffff40';
        ctx.fillText('No records yet', x, y + 70);
      } else {
        scores.forEach((score, si) => {
          const sy = y + 60 + si * 38;
          ctx.font = 'bold 14px Orbitron, monospace';
          ctx.textAlign = 'left';

          const rankColor = si === 0 ? '#ffd700' : si === 1 ? '#c0c0c0' : si === 2 ? '#cd7f32' : '#ffffff88';
          ctx.fillStyle = rankColor;
          ctx.fillText('#' + score.rank, x - 70, sy);

          ctx.textAlign = 'right';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(score.score.toString(), x + 65, sy);

          ctx.font = '10px Orbitron, monospace';
          ctx.fillStyle = '#ffffff55';
          const timeMin = Math.floor(score.time / 60);
          const timeSec = Math.floor(score.time % 60);
          ctx.fillText(timeMin + ':' + timeSec.toString().padStart(2, '0'), x + 65, sy + 14);
        });
      }
    });

    ctx.font = '18px Orbitron, monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS ENTER OR ESC TO BACK', centerX, centerY + 190);
  }

  renderPaused(w, h) {
    const ctx = this.ctx;
    const centerX = w / 2;
    const centerY = h / 2;

    ctx.fillStyle = 'rgba(5, 13, 26, 0.8)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = 'bold 48px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 20;
    ctx.fillText('PAUSED', centerX, centerY - 20);
    ctx.shadowBlur = 0;

    ctx.font = '20px Orbitron, monospace';
    ctx.fillStyle = '#ffffff88';
    ctx.fillText('PRESS ENTER OR ESC TO RESUME', centerX, centerY + 30);
    ctx.fillText('HOLD ESC FOR 2 SECONDS TO QUIT', centerX, centerY + 60);
  }

  renderActiveTrickIndicator(w, h) {
    const activeTrick = this.trickSystem.getActiveTrick();
    if (!activeTrick) return;

    const ctx = this.ctx;
    const centerX = w / 2;
    const centerY = h / 2 - 100;

    ctx.font = 'bold 28px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6b35';
    ctx.shadowColor = '#ff6b35';
    ctx.shadowBlur = 15;
    ctx.fillText(activeTrick.icon + ' ' + activeTrick.name, centerX, centerY);
    ctx.shadowBlur = 0;

    const progress = activeTrick.progress;
    const barW = 200;
    const barH = 6;
    const barX = centerX - barW / 2;
    const barY = centerY + 20;

    ctx.fillStyle = 'rgba(10, 22, 40, 0.8)';
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = '#ff6b35';
    ctx.fillRect(barX, barY, barW * progress, barH);

    ctx.font = '16px Orbitron, monospace';
    ctx.fillStyle = '#00ff88';
    ctx.fillText('+ ' + activeTrick.estimatedScore, centerX, centerY + 50);
  }

  getActiveTrick() {
    return this.trickSystem.getActiveTrick();
  }

  getTrickStats() {
    return this.trickSystem.getStats();
  }

  initEditor() {
    this.editorState = {
      terrainPoints: [],
      selectedTool: 'hill',
      brushSize: 100,
      brushHeight: 50,
      isDragging: false,
      lastX: 0,
      lastY: 0,
      cameraX: 0,
      scale: 1,
    };

    const baseY = 400;
    for (let x = 0; x < 5000; x += 20) {
      this.editorState.terrainPoints.push({ x, y: baseY + Math.sin(x * 0.01) * 30 });
    }
  }

  renderEditor(w, h) {
    if (!this.editorState) this.initEditor();

    const ctx = this.ctx;
    const centerX = w / 2;
    const centerY = h / 2;

    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#1a2a44';
    ctx.fillRect(0, h - 120, w, 120);

    ctx.font = 'bold 28px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15;
    ctx.fillText('TRACK EDITOR', centerX, 40);
    ctx.shadowBlur = 0;

    const tools = ['hill', 'valley', 'ramp', 'flat', 'smooth'];
    const toolNames = ['HILL', 'VALLEY', 'RAMP', 'FLAT', 'SMOOTH'];
    const toolColors = ['#00ff88', '#ff6b35', '#9d4edd', '#00d4ff', '#ffd700'];

    tools.forEach((tool, i) => {
      const x = 40 + i * 110;
      const y = h - 70;
      const isSelected = this.editorState.selectedTool === tool;

      ctx.fillStyle = isSelected ? toolColors[i] + '30' : 'rgba(30, 40, 60, 0.8)';
      this.ui.roundRect(ctx, x, y, 100, 45, 6);
      ctx.fill();

      ctx.strokeStyle = isSelected ? toolColors[i] : '#ffffff20';
      ctx.lineWidth = isSelected ? 2 : 1;
      this.ui.roundRect(ctx, x, y, 100, 45, 6);
      ctx.stroke();

      ctx.font = 'bold 12px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = isSelected ? toolColors[i] : '#ffffff88';
      ctx.fillText(toolNames[i], x + 50, y + 28);
    });

    ctx.font = '14px Orbitron, monospace';
    ctx.fillStyle = '#ffffff55';
    ctx.textAlign = 'left';
    ctx.fillText('BRUSH SIZE: ' + this.editorState.brushSize, 40, h - 90);
    ctx.fillText('HEIGHT: ' + this.editorState.brushHeight, 200, h - 90);

    const points = this.editorState.terrainPoints;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 255, 136, 0.1)';
    ctx.beginPath();
    ctx.moveTo(points[0].x, h);
    ctx.lineTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.lineTo(points[points.length - 1].x, h);
    ctx.closePath();
    ctx.fill();

    ctx.font = '14px Orbitron, monospace';
    ctx.fillStyle = '#ffffff55';
    ctx.textAlign = 'center';
    ctx.fillText('CLICK + DRAG TO EDIT TERRAIN  |  1-5 SELECT TOOL  |  ENTER TEST  |  ESC BACK', centerX, h - 20);
  }

  updateEditor(dt) {
    if (!this.editorState) return;

    if (this.input.left) {
      this.editorState.brushSize = Math.max(20, this.editorState.brushSize - 50 * dt);
    }
    if (this.input.right) {
      this.editorState.brushSize = Math.min(300, this.editorState.brushSize + 50 * dt);
    }
    if (this.input.up) {
      this.editorState.brushHeight = Math.min(200, this.editorState.brushHeight + 50 * dt);
    }
    if (this.input.down) {
      this.editorState.brushHeight = Math.max(10, this.editorState.brushHeight - 50 * dt);
    }
  }

  initChallenge() {
    this.challengeState = {
      currentChallenge: 0,
      challenges: [
        { name: 'BACKFLIP MASTER', desc: 'Perform 3 backflips in one run', target: 3, trick: 'backflip', score: 1000 },
        { name: 'SPEED DEMON', desc: 'Reach 300 km/h', target: 300, type: 'speed', score: 1500 },
        { name: 'PERFECT LANDER', desc: '5 perfect landings', target: 5, trick: 'perfect_landing', score: 2000 },
        { name: 'COMBO KING', desc: 'Reach x10 combo', target: 10, type: 'combo', score: 2500 },
        { name: 'SUPERMAN', desc: 'Superman for 3 seconds', target: 3, type: 'superman', score: 3000 },
      ],
      completed: [],
      progress: 0,
      challengeStartTime: 0,
    };

    this.currentTheme = 'desert';
    this.renderer.setTheme('desert');
    this.terrain = new Terrain(8000, 'desert');
    this.physics = new Physics('desert', this.saveSystem.getUpgrades());
    this.moto = new Motorcycle(100, 0, this.saveSystem.getUpgrades());
    this.trickSystem.reset();

    const startPos = this.terrain.getStartPosition();
    this.moto.reset(startPos.x, startPos.y);
  }

  renderChallenge(w, h) {
    if (!this.challengeState) this.initChallenge();

    const ctx = this.ctx;
    const centerX = w / 2;
    const centerY = h / 2;

    const ghostPlayer = this.ghostRaceEnabled ? this.ghostPlayer : null;
    this.renderer.render(this.state, this.moto, this.terrain, this.gameTime, ghostPlayer);

    this.ui.renderHUD(ctx, this.moto, this.gameTime, GAME_STATE.PLAYING, this.terrain);

    if (this.trickActive) {
      this.renderActiveTrickIndicator(w, h);
    }

    const challenge = this.challengeState.challenges[this.challengeState.currentChallenge];

    ctx.fillStyle = 'rgba(5, 13, 26, 0.85)';
    this.ui.roundRect(ctx, w / 2 - 200, 10, 400, 100, 10);
    ctx.fill();

    ctx.strokeStyle = '#ff6b3540';
    ctx.lineWidth = 2;
    this.ui.roundRect(ctx, w / 2 - 200, 10, 400, 100, 10);
    ctx.stroke();

    ctx.font = 'bold 18px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6b35';
    ctx.shadowColor = '#ff6b35';
    ctx.shadowBlur = 10;
    ctx.fillText('CHALLENGE: ' + challenge.name, centerX, 40);
    ctx.shadowBlur = 0;

    ctx.font = '14px Orbitron, monospace';
    ctx.fillStyle = '#ffffff88';
    ctx.fillText(challenge.desc, centerX, 62);

    const progress = Math.min(1, this.challengeState.progress / challenge.target);
    const barW = 350;
    const barX = centerX - barW / 2;
    const barY = 75;

    ctx.fillStyle = '#1a1a2e';
    this.ui.roundRect(ctx, barX, barY, barW, 12, 6);
    ctx.fill();

    const grad = ctx.createLinearGradient(barX, 0, barX + barW * progress, 0);
    grad.addColorStop(0, '#ff6b35');
    grad.addColorStop(1, '#ff3366');
    ctx.fillStyle = grad;
    this.ui.roundRect(ctx, barX, barY, barW * progress, 12, 6);
    ctx.fill();

    ctx.font = 'bold 12px Orbitron, monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.challengeState.progress + ' / ' + challenge.target, centerX, barY + 10);

    ctx.font = '12px Orbitron, monospace';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'right';
    ctx.fillText('REWARD: ' + challenge.score + ' PTS', w - 30, 60);

    ctx.font = '12px Orbitron, monospace';
    ctx.fillStyle = '#ffffff55';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS ESC TO EXIT CHALLENGE', centerX, h - 15);

    if (this.moto.isCrashed) {
      if (Date.now() - this.moto.crashTime > 1500) {
        this.initChallenge();
      }
    }
  }

  updateChallenge(dt) {
    if (!this.challengeState) return;

    this.gameTime += dt;
    this.physics.update(this.moto, this.terrain, dt, this.input);

    if (this.moto.supermanState && this.moto.supermanState.active) {
      this.moto.supermanState.duration += dt;
    }

    this.updateDriftState(dt);

    const trickResult = this.trickSystem.update(this.moto, dt, this.terrain);
    this.handleTrickCompletion(trickResult);
    this.handleTrickScoring();

    const challenge = this.challengeState.challenges[this.challengeState.currentChallenge];

    if (challenge.trick) {
      const stats = this.trickSystem.getStats();
      const trickSummary = this.trickSystem.getTrickSummary();
      const trickName = TRICKS[challenge.trick]?.name || '';
      this.challengeState.progress = trickSummary[trickName]?.count || 0;
    } else if (challenge.type === 'speed') {
      const speed = Math.floor(this.moto.getSpeed() * 0.36);
      if (speed > this.challengeState.progress) {
        this.challengeState.progress = speed;
      }
    } else if (challenge.type === 'combo') {
      this.challengeState.progress = Math.max(this.challengeState.progress, this.ui.combo);
    } else if (challenge.type === 'superman') {
      if (this.moto.supermanState && this.moto.supermanState.active) {
        this.challengeState.progress = Math.max(
          this.challengeState.progress,
          Math.floor(this.moto.supermanState.duration)
        );
      }
    }

    if (this.challengeState.progress >= challenge.target) {
      this.ui.addScore(challenge.score);
      this.ui.showMessage('CHALLENGE COMPLETE! +' + challenge.score, '#ffd700');
      this.challengeState.completed.push(this.challengeState.currentChallenge);
      this.challengeState.currentChallenge = (this.challengeState.currentChallenge + 1) % this.challengeState.challenges.length;
      this.challengeState.progress = 0;
      this.initChallenge();
    }

    if (this.moto.justLanded && !this.moto.isCrashed) {
      this.renderer.addLandingParticles(this.moto.x, this.moto.y + 18, 15);
    }

    this.wasGrounded = this.moto.isGrounded;
    this.moto.update(dt, this.physics);
    this.renderer.updateCamera(this.moto, dt);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
