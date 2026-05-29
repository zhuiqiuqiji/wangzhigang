(function () {
  'use strict';

  if (typeof THREE === 'undefined') {
    console.error('Three.js not loaded');
    return;
  }

  var canvas = document.getElementById('game-canvas');
  var container = document.getElementById('game-container');

  var scoreValueEl = document.getElementById('score-value');
  var perfectCountEl = document.getElementById('perfect-count');
  var stackHeightEl = document.getElementById('stack-height');
  var timerItemEl = document.getElementById('timer-item');
  var timerValueEl = document.getElementById('timer-value');
  var startBtn = document.getElementById('start-btn');
  var startHint = document.getElementById('start-hint');
  var gameOverModal = document.getElementById('game-over-modal');
  var finalScoreEl = document.getElementById('final-score');
  var finalPerfectEl = document.getElementById('final-perfect');
  var finalHeightEl = document.getElementById('final-height');
  var newRecordEl = document.getElementById('new-record');
  var restartBtn = document.getElementById('restart-btn');
  var viewLeaderboardBtn = document.getElementById('view-leaderboard-btn');
  var leaderboardModal = document.getElementById('leaderboard-modal');
  var leaderboardListEl = document.getElementById('leaderboard-list');
  var dailyHeightEl = document.getElementById('daily-height');
  var closeLeaderboardBtn = document.getElementById('close-leaderboard-btn');
  var clearLeaderboardBtn = document.getElementById('clear-leaderboard-btn');
  var leaderboardBtn = document.getElementById('leaderboard-btn');
  var arBtn = document.getElementById('ar-btn');
  var arModal = document.getElementById('ar-modal');
  var closeArBtn = document.getElementById('close-ar-btn');
  var perfectToast = document.getElementById('perfect-toast');
  var cameraHint = document.getElementById('camera-hint');

  var BLOCK_H = 0.5;
  var BASE_W = 3.6;
  var BASE_D = 1.2;
  var SWING_AMPLITUDE = 2.2;
  var SWING_SPEED = 1.8;
  var DROP_SPEED = 12;
  var PERFECT_THRESHOLD = 0.06;
  var TIMED_DURATION = 60;
  var TARGET_HEIGHT = 100;

  var game = {
    blocks: [],
    currentBlock: null,
    fragments: [],
    score: 0,
    perfectCount: 0,
    stackHeight: 0,
    isPlaying: false,
    isDropping: false,
    gameOver: false,
    mode: 'endless',
    theme: 'fruit',
    timeLeft: TIMED_DURATION,
    swingTime: 0,
    animationId: null,
    lastTime: 0,
    cameraAngle: 0,
    cameraDistance: 8,
    cameraHeight: 4,
    isDragging: false,
    lastMouseX: 0,
    tilt: { x: 0, z: 0, targetX: 0 },
    com: { x: 0, y: 0 },
    powerUps: { wide: 3, magnet: 2, slowmo: 2 },
    slowmoActive: false,
    slowmoTimer: 0,
    perfectFlash: 0,
    towerGroup: null,
    baseCenterX: 0
  };

  var scene, camera, renderer;
  var groundMesh, baseMesh;
  var ambientLight, dirLight, hemiLight;
  var particleCount = 0;
  var particles = [];

  var fragmentPool = [];
  var MAX_FRAGMENTS = 20;

  function initThree() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0e1a, 15, 40);

    var w = container.clientWidth;
    var h = container.clientHeight;
    camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    updateCameraPosition();

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x0a0e1a, 1);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x1a1a2e, 0.4);
    scene.add(hemiLight);

    dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 15, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -10;
    scene.add(dirLight);

    var groundGeo = new THREE.PlaneGeometry(40, 40);
    var groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a2744,
      roughness: 0.9,
      metalness: 0.1
    });
    groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.01;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    var gridHelper = new THREE.GridHelper(20, 20, 0x2a3a5a, 0x1a2a4a);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    game.towerGroup = new THREE.Group();
    scene.add(game.towerGroup);
  }

  function updateCameraPosition() {
    camera.position.x = Math.sin(game.cameraAngle) * game.cameraDistance;
    camera.position.z = Math.cos(game.cameraAngle) * game.cameraDistance;
    camera.position.y = game.cameraHeight;
    camera.lookAt(0, Math.max(game.cameraHeight * 0.5, 2), 0);
  }

  function createBlockMesh(width, depth, height, color, emissive) {
    var geo = new THREE.BoxGeometry(width, height, depth);
    var mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || 0x000000,
      roughness: 0.6,
      metalness: 0.2
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function createBaseMesh() {
    var themeData = window.GameThemes[game.theme];
    if (baseMesh && game.towerGroup) {
      game.towerGroup.remove(baseMesh);
      baseMesh.geometry.dispose();
      baseMesh.material.dispose();
    }
    baseMesh = createBlockMesh(BASE_W, BASE_D, 0.6, themeData.baseColor, themeData.baseEmissive);
    baseMesh.position.set(0, 0.3, 0);
    game.towerGroup.add(baseMesh);
    game.baseCenterX = 0;
  }

  function getBlockThemeData(index) {
    var themeData = window.GameThemes[game.theme];
    var colors = themeData.blockColors;
    return colors[index % colors.length];
  }

  function createBlock(width, x, y, colorData) {
    var mesh = createBlockMesh(width, BASE_D, BLOCK_H, colorData.color, colorData.emissive);
    mesh.position.set(x, y + BLOCK_H / 2, 0);
    game.towerGroup.add(mesh);

    var block = {
      mesh: mesh,
      x: x,
      y: y,
      width: width,
      geometryWidth: width,
      depth: BASE_D,
      height: BLOCK_H,
      colorData: colorData,
      isSwinging: false
    };
    return block;
  }

  function spawnBlock() {
    var topBlock = game.blocks.length > 0 ? game.blocks[game.blocks.length - 1] : {
      x: 0, y: 0.6, width: BASE_W, depth: BASE_D
    };
    var nextWidth = topBlock.width;
    var colorData = getBlockThemeData(game.blocks.length);
    var y = topBlock.y + BLOCK_H + 1.5;

    game.swingTime = 0;

    var block = createBlock(nextWidth, topBlock.x, y, colorData);
    block.isSwinging = true;
    game.currentBlock = block;
    game.isDropping = false;
  }

  function clearScene() {
    for (var i = game.blocks.length - 1; i >= 0; i--) {
      var b = game.blocks[i];
      if (b.mesh) {
        game.towerGroup.remove(b.mesh);
        b.mesh.geometry.dispose();
        b.mesh.material.dispose();
      }
    }
    game.blocks = [];

    for (var j = game.fragments.length - 1; j >= 0; j--) {
      var f = game.fragments[j];
      if (f.mesh) {
        scene.remove(f.mesh);
        f.mesh.geometry.dispose();
        f.mesh.material.dispose();
      }
    }
    game.fragments = [];

    for (var k = particles.length - 1; k >= 0; k--) {
      var p = particles[k];
      if (p.mesh) scene.remove(p.mesh);
    }
    particles = [];
    particleCount = 0;

    if (game.currentBlock && game.currentBlock.mesh) {
      game.towerGroup.remove(game.currentBlock.mesh);
      game.currentBlock.mesh.geometry.dispose();
      game.currentBlock.mesh.material.dispose();
      game.currentBlock = null;
    }
  }

  function initGame() {
    if (game.animationId !== null) {
      cancelAnimationFrame(game.animationId);
      game.animationId = null;
    }

    game.score = 0;
    game.perfectCount = 0;
    game.stackHeight = 0;
    game.isPlaying = false;
    game.isDropping = false;
    game.gameOver = false;
    game.swingTime = 0;
    game.lastTime = 0;
    game.tilt = { x: 0, z: 0, targetX: 0 };
    game.com = { x: 0, y: 0 };
    game.slowmoActive = false;
    game.slowmoTimer = 0;
    game.perfectFlash = 0;
    game.timeLeft = TIMED_DURATION;

    game.powerUps = { wide: 3, magnet: 2, slowmo: 2 };
    updatePowerupUI();

    if (game.towerGroup) {
      game.towerGroup.rotation.set(0, 0, 0);
    }

    clearScene();
    createBaseMesh();

    var colorData = getBlockThemeData(0);
    var firstBlock = createBlock(BASE_W, 0, 0.6, colorData);
    game.blocks.push(firstBlock);

    game.mode = document.querySelector('.mode-btn.active').dataset.mode;
    game.theme = document.querySelector('.theme-btn.active').dataset.theme;

    if (game.mode === 'timed') {
      timerItemEl.style.display = 'flex';
    } else {
      timerItemEl.style.display = 'none';
    }

    updateScoreDisplay();
    updateTimerDisplay();
    renderer.render(scene, camera);
  }

  function startGame() {
    initGame();
    game.isPlaying = true;
    startBtn.classList.add('hidden');
    startHint.classList.add('hidden');
    gameOverModal.classList.add('hidden');
    leaderboardModal.classList.add('hidden');
    spawnBlock();
    game.lastTime = 0;
    game.animationId = requestAnimationFrame(gameLoop);

    cameraHint.classList.remove('hidden');
    setTimeout(function () {
      cameraHint.classList.add('hidden');
    }, 3000);
  }

  function dropBlock() {
    if (!game.isPlaying || game.gameOver || game.isDropping || !game.currentBlock) return;
    game.isDropping = true;
    game.currentBlock.isSwinging = false;
  }

  function usePowerup(type) {
    if (!game.isPlaying || game.gameOver) return;
    if (game.powerUps[type] <= 0) return;
    if (!game.currentBlock || game.isDropping) return;

    game.powerUps[type]--;
    updatePowerupUI();

    switch (type) {
      case 'wide':
        var newW = game.currentBlock.width * 1.5;
        game.currentBlock.width = newW;
        game.currentBlock.mesh.scale.x = newW / game.currentBlock.geometryWidth;
        break;
      case 'magnet':
        game.currentBlock.isMagnet = true;
        break;
      case 'slowmo':
        game.slowmoActive = true;
        game.slowmoTimer = 5;
        break;
    }

    var btn = document.querySelector('.powerup-btn[data-powerup="' + type + '"]');
    if (btn) {
      btn.classList.add('active');
      setTimeout(function () {
        btn.classList.remove('active');
      }, 500);
    }
  }

  function updatePowerupUI() {
    document.getElementById('wide-count').textContent = game.powerUps.wide;
    document.getElementById('magnet-count').textContent = game.powerUps.magnet;
    document.getElementById('slowmo-count').textContent = game.powerUps.slowmo;

    document.getElementById('powerup-wide').disabled = game.powerUps.wide <= 0;
    document.getElementById('powerup-magnet').disabled = game.powerUps.magnet <= 0;
    document.getElementById('powerup-slowmo').disabled = game.powerUps.slowmo <= 0;
  }

  function updateSwing(dt) {
    if (!game.currentBlock || !game.currentBlock.isSwinging) return;

    var speedMult = game.slowmoActive ? 0.4 : 1;
    game.swingTime += dt * SWING_SPEED * speedMult;

    var topBlock = game.blocks[game.blocks.length - 1];
    var centerX = topBlock.x;
    game.currentBlock.x = centerX + Math.sin(game.swingTime) * SWING_AMPLITUDE;
    game.currentBlock.mesh.position.x = game.currentBlock.x;

    if (game.currentBlock.isMagnet) {
      var diff = Math.abs(game.currentBlock.x - topBlock.x);
      if (diff < PERFECT_THRESHOLD * 2) {
        game.currentBlock.x = topBlock.x;
        game.currentBlock.mesh.position.x = topBlock.x;
      }
    }
  }

  function updateDrop(dt) {
    if (!game.currentBlock || !game.isDropping) return;

    var speedMult = game.slowmoActive ? 0.4 : 1;
    var current = game.currentBlock;
    current.y -= DROP_SPEED * dt * speedMult;
    current.mesh.position.y = current.y + BLOCK_H / 2;

    var topBlock = game.blocks[game.blocks.length - 1];
    var topY = topBlock.y + BLOCK_H;

    if (current.y <= topY) {
      current.y = topY;
      current.mesh.position.y = topY + BLOCK_H / 2;
      checkLanding();
    }
  }

  function getFragment() {
    if (fragmentPool.length > 0) {
      return fragmentPool.pop();
    }
    if (game.fragments.length >= MAX_FRAGMENTS) return null;

    var geo = new THREE.BoxGeometry(1, BLOCK_H, BASE_D);
    var mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x222222,
      transparent: true,
      roughness: 0.6
    });
    return new THREE.Mesh(geo, mat);
  }

  function returnFragment(f) {
    if (fragmentPool.length < 10) {
      fragmentPool.push(f);
    } else {
      f.geometry.dispose();
      f.material.dispose();
    }
  }

  function checkLanding() {
    var current = game.currentBlock;
    var topBlock = game.blocks[game.blocks.length - 1];

    var currLeft = current.x - current.width / 2;
    var currRight = current.x + current.width / 2;
    var topLeft = topBlock.x - topBlock.width / 2;
    var topRight = topBlock.x + topBlock.width / 2;

    var overlapLeft = Math.max(currLeft, topLeft);
    var overlapRight = Math.min(currRight, topRight);
    var overlapWidth = overlapRight - overlapLeft;

    if (overlapWidth <= 0.01) {
      endGame();
      return;
    }

    var isPerfect = false;
    var diff = Math.abs(current.x - topBlock.x);

    if (current.isMagnet || diff <= PERFECT_THRESHOLD) {
      isPerfect = true;
    }

    if (isPerfect) {
      current.x = topBlock.x;
      current.mesh.position.x = topBlock.x;
      current.width = topBlock.width;
      current.mesh.scale.x = topBlock.width / current.geometryWidth;
      game.perfectCount++;
      game.perfectFlash = 1;
      spawnParticles(current.x, current.y + BLOCK_H / 2, 0xffd700, 12);
      showPerfectToast();
    } else {
      var newX = (overlapLeft + overlapRight) / 2;

      if (currLeft < topLeft) {
        var cutW = topLeft - currLeft;
        var fragX = currLeft + cutW / 2;
        createFragmentMesh(fragX, current.y, cutW, current.colorData, -1);
      }
      if (currRight > topRight) {
        var cutW2 = currRight - topRight;
        var fragX2 = topRight + cutW2 / 2;
        createFragmentMesh(fragX2, current.y, cutW2, current.colorData, 1);
      }

      current.x = newX;
      current.width = overlapWidth;
      current.mesh.position.x = newX;
      current.mesh.scale.x = overlapWidth / current.geometryWidth;
    }

    current.isMagnet = false;
    current.isSwinging = false;
    game.blocks.push(current);
    game.currentBlock = null;
    game.isDropping = false;

    game.stackHeight++;

    var physicsResult = window.GamePhysics.computeTilt(game.blocks, game.baseCenterX);
    game.tilt.targetX = physicsResult.tiltX;
    game.com = physicsResult.com;

    if (game.mode === 'target' && game.stackHeight >= TARGET_HEIGHT) {
      game.score += 500;
      updateScoreDisplay();
      endGame();
      return;
    }

    var baseScore = 10;
    var heightBonus = game.stackHeight;
    var perfectBonus = isPerfect ? 20 : 0;
    game.score += baseScore + heightBonus + perfectBonus;

    if (game.mode === 'target') {
      var progress = Math.min(game.stackHeight / TARGET_HEIGHT, 1);
      game.score += Math.floor(progress * 10);
    }

    updateScoreDisplay();

    setTimeout(function () {
      if (!game.gameOver) {
        spawnBlock();
      }
    }, 150);
  }

  function createFragmentMesh(x, y, w, colorData, dir) {
    var mesh = getFragment();
    if (!mesh) return;

    mesh.material.color.setHex(colorData.color);
    mesh.material.emissive.setHex(colorData.emissive);
    mesh.material.opacity = 1;
    mesh.scale.set(w / 1, 1, 1);
    mesh.position.set(x, y + BLOCK_H / 2, 0);
    mesh.rotation.set(0, 0, 0);
    mesh.castShadow = true;
    scene.add(mesh);

    game.fragments.push({
      mesh: mesh,
      x: x,
      y: y,
      vx: dir * (1.5 + Math.random() * 2),
      vy: -1 - Math.random() * 1.5,
      rotation: 0,
      rotationSpeed: dir * (0.1 + Math.random() * 0.15),
      life: 45,
      maxLife: 45
    });
  }

  function spawnParticles(x, y, color, count) {
    for (var i = 0; i < count; i++) {
      var geo = new THREE.SphereGeometry(0.06, 6, 6);
      var mat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, 0);
      scene.add(mesh);

      var angle = (Math.PI * 2 * i) / count;
      var speed = 2 + Math.random() * 2;
      particles.push({
        mesh: mesh,
        vx: Math.cos(angle) * speed,
        vy: Math.abs(Math.sin(angle)) * speed + 1,
        life: 40,
        maxLife: 40
      });
      particleCount++;
    }
  }

  function updateFragments(dt) {
    for (var i = game.fragments.length - 1; i >= 0; i--) {
      var f = game.fragments[i];
      f.x += f.vx * dt * 60;
      f.y += f.vy * dt * 60;
      f.vy += 0.3 * dt * 60;
      f.rotation += f.rotationSpeed * dt * 60;
      f.life -= dt * 60;

      f.mesh.position.set(f.x, f.y + BLOCK_H / 2, 0);
      f.mesh.rotation.z = f.rotation;
      f.mesh.material.opacity = Math.max(0, f.life / f.maxLife);

      if (f.life <= 0) {
        scene.remove(f.mesh);
        returnFragment(f.mesh);
        game.fragments.splice(i, 1);
      }
    }
  }

  function updateParticles(dt) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.mesh.position.x += p.vx * dt * 60;
      p.mesh.position.y += p.vy * dt * 60;
      p.vy -= 0.15 * dt * 60;
      p.life -= dt * 60;
      p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
      p.mesh.scale.setScalar(Math.max(0.01, p.life / p.maxLife));

      if (p.life <= 0) {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        particles.splice(i, 1);
        particleCount--;
      }
    }
  }

  function showPerfectToast() {
    perfectToast.classList.remove('hidden');
    perfectToast.classList.remove('show');
    void perfectToast.offsetWidth;
    perfectToast.classList.add('show');
    setTimeout(function () {
      perfectToast.classList.add('hidden');
    }, 1200);

    scoreValueEl.classList.add('pop');
    setTimeout(function () {
      scoreValueEl.classList.remove('pop');
    }, 300);
  }

  function updateScoreDisplay() {
    scoreValueEl.textContent = game.score;
    perfectCountEl.textContent = game.perfectCount;
    stackHeightEl.textContent = game.stackHeight;
  }

  function updateTimerDisplay() {
    if (game.mode === 'timed') {
      timerValueEl.textContent = Math.ceil(game.timeLeft);
      timerValueEl.style.color = game.timeLeft <= 10 ? '#ff6b6b' : '#ffffff';
    }
  }

  function endGame() {
    game.gameOver = true;
    game.isPlaying = false;

    var isNewRecord = window.GameStorage.addScore(
      game.score,
      game.stackHeight,
      game.perfectCount,
      game.mode,
      game.theme
    );

    window.GameStorage.updateDailyHeight(game.stackHeight);

    setTimeout(function () {
      finalScoreEl.textContent = game.score;
      finalPerfectEl.textContent = game.perfectCount;
      finalHeightEl.textContent = game.stackHeight;
      newRecordEl.style.display = isNewRecord ? 'block' : 'none';
      gameOverModal.classList.remove('hidden');
      startBtn.classList.remove('hidden');
      startHint.classList.remove('hidden');
    }, 500);
  }

  function updateCamera(dt) {
    if (game.cameraHeight < game.stackHeight * BLOCK_H + 3) {
      game.cameraHeight += (game.stackHeight * BLOCK_H + 3 - game.cameraHeight) * 0.05;
    }
    updateCameraPosition();
  }

  function updateTiltVisual(dt) {
    game.tilt = window.GamePhysics.updateTilt(game.tilt, game.tilt.targetX, dt);
    if (game.towerGroup) {
      game.towerGroup.rotation.z = game.tilt.x;
    }
  }

  function updateGameMode(dt) {
    if (game.mode === 'timed' && game.isPlaying) {
      game.timeLeft -= dt;
      if (game.timeLeft <= 0) {
        game.timeLeft = 0;
        updateTimerDisplay();
        endGame();
        return;
      }
      updateTimerDisplay();
    }

    if (game.slowmoActive) {
      game.slowmoTimer -= dt;
      if (game.slowmoTimer <= 0) {
        game.slowmoActive = false;
      }
    }
  }

  function gameLoop(timestamp) {
    if (game.lastTime === 0) game.lastTime = timestamp;
    var dt = Math.min((timestamp - game.lastTime) / 1000, 0.05);
    game.lastTime = timestamp;

    if (!game.isPlaying && !game.gameOver && game.fragments.length === 0 && particles.length === 0) {
      game.animationId = null;
      return;
    }

    if (game.isPlaying) {
      updateSwing(dt);
      updateDrop(dt);
      updateGameMode(dt);
    }

    updateFragments(dt);
    updateParticles(dt);
    updateTiltVisual(dt);
    updateCamera(dt);

    if (game.perfectFlash > 0) {
      game.perfectFlash -= 0.04 * dt * 60;
      if (game.perfectFlash < 0) game.perfectFlash = 0;
    }

    renderer.render(scene, camera);

    if (game.gameOver && game.fragments.length === 0 && particles.length === 0) {
      renderer.render(scene, camera);
      game.animationId = null;
      return;
    }

    game.animationId = requestAnimationFrame(gameLoop);
  }

  function handleCanvasClick(e) {
    e.preventDefault();
    if (!game.isPlaying) {
      if (game.gameOver) return;
      startGame();
      return;
    }
    dropBlock();
  }

  function handleMouseDown(e) {
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;

    if (x > rect.width * 0.2 && x < rect.width * 0.8) {
      handleCanvasClick(e);
      return;
    }

    game.isDragging = true;
    game.lastMouseX = e.clientX;
    canvas.style.cursor = 'grabbing';
  }

  function handleMouseMove(e) {
    if (!game.isDragging) return;
    var dx = e.clientX - game.lastMouseX;
    game.cameraAngle -= dx * 0.008;
    game.lastMouseX = e.clientX;
    updateCameraPosition();
  }

  function handleMouseUp() {
    game.isDragging = false;
    canvas.style.cursor = 'grab';
  }

  function handleWheel(e) {
    e.preventDefault();
    var delta = e.deltaY > 0 ? 0.5 : -0.5;
    game.cameraDistance = Math.max(4, Math.min(15, game.cameraDistance + delta));
    updateCameraPosition();
  }

  function handleTouchStart(e) {
    if (e.touches.length === 1) {
      var touch = e.touches[0];
      var rect = canvas.getBoundingClientRect();
      var x = touch.clientX - rect.left;

      if (x > rect.width * 0.15 && x < rect.width * 0.85) {
        handleCanvasClick(e);
        return;
      }

      game.isDragging = true;
      game.lastMouseX = touch.clientX;
    }
  }

  function handleTouchMove(e) {
    if (!game.isDragging || e.touches.length !== 1) return;
    var dx = e.touches[0].clientX - game.lastMouseX;
    game.cameraAngle -= dx * 0.01;
    game.lastMouseX = e.touches[0].clientX;
    updateCameraPosition();
  }

  function handleTouchEnd() {
    game.isDragging = false;
  }

  function handleResize() {
    var w = container.clientWidth;
    var h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.render(scene, camera);
  }

  function showLeaderboard() {
    var entries = window.GameStorage.getLeaderboard();
    var daily = window.GameStorage.getDailyHeight();
    dailyHeightEl.textContent = daily;

    if (entries.length === 0) {
      leaderboardListEl.innerHTML = '<div class="empty-leaderboard">暂无记录，快来创造你的第一个记录吧！</div>';
    } else {
      var html = '';
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        html += '<div class="leaderboard-entry">' +
          '<div class="leaderboard-rank">' + (i + 1) + '</div>' +
          '<div class="leaderboard-score">' + e.score + '</div>' +
          '<div class="leaderboard-meta">' +
          '高度: ' + e.height + '<br>' +
          window.GameStorage.formatMode(e.mode) + ' · ' + window.GameStorage.formatTheme(e.theme) + '<br>' +
          '<small>' + e.date + '</small>' +
          '</div>' +
          '</div>';
      }
      leaderboardListEl.innerHTML = html;
    }

    leaderboardModal.classList.remove('hidden');
  }

  document.querySelectorAll('.theme-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      document.querySelectorAll('.theme-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      game.theme = btn.dataset.theme;
      if (!game.isPlaying) {
        initGame();
      }
    });
  });

  document.querySelectorAll('.mode-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      document.querySelectorAll('.mode-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      game.mode = btn.dataset.mode;
    });
  });

  document.querySelectorAll('.powerup-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      usePowerup(btn.dataset.powerup);
    });
  });

  canvas.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('wheel', handleWheel, { passive: false });

  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd);

  startBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    startGame();
  });

  restartBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    startGame();
  });

  viewLeaderboardBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    gameOverModal.classList.add('hidden');
    showLeaderboard();
  });

  leaderboardBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    showLeaderboard();
  });

  closeLeaderboardBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    leaderboardModal.classList.add('hidden');
  });

  clearLeaderboardBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (confirm('确定要清空所有排行榜记录吗？')) {
      window.GameStorage.clearLeaderboard();
      showLeaderboard();
    }
  });

  arBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    arModal.classList.remove('hidden');
  });

  closeArBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    arModal.classList.add('hidden');
  });

  window.addEventListener('resize', handleResize);

  initThree();
  initGame();
})();
