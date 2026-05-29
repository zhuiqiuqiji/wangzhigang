(function () {
    'use strict';

    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;
    const MARBLE_RADIUS = 12;
    const GRAVITY = 21;
    const ROLLING_RESISTANCE = 0.988;
    const FRICTION_DECAY = 0.85;
    const MAX_TILT = 25;
    const TILT_SPEED = 72;
    const TILT_RETURN = 6;
    const WALL_THICKNESS = 8;
    const MAX_SPEED = 480;
    const BOUNCE_DAMPING = 0.5;

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const editorCanvas = document.getElementById('editorCanvas');
    const editorCtx = editorCanvas ? editorCanvas.getContext('2d') : null;

    const currentTimeEl = document.getElementById('currentTime');
    const bestTimeEl = document.getElementById('bestTime');
    const stepCountEl = document.getElementById('stepCount');
    const levelNameEl = document.getElementById('levelName');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const levelBtn = document.getElementById('levelBtn');
    const levelNextBtn = document.getElementById('levelNextBtn');
    const resultModal = document.getElementById('resultModal');
    const resultTitle = document.getElementById('resultTitle');
    const resultTimeEl = document.getElementById('resultTime');
    const resultStepsEl = document.getElementById('resultSteps');
    const resultBestEl = document.getElementById('resultBest');
    const resultRankEl = document.getElementById('resultRank');
    const modalBtn = document.getElementById('modalBtn');
    const modalNextBtn = document.getElementById('modalNextBtn');
    const view2dBtn = document.getElementById('view2d');
    const viewIsoBtn = document.getElementById('viewIso');

    const tiltUpEl = document.getElementById('tiltUp');
    const tiltDownEl = document.getElementById('tiltDown');
    const tiltLeftEl = document.getElementById('tiltLeft');
    const tiltRightEl = document.getElementById('tiltRight');

    const LEVELS = [
        {
            name: '初级迷宫',
            start: { x: 60, y: 60 },
            end: { x: 740, y: 540, radius: 22 },
            walls: [
                { x1: 0, y1: 0, x2: 800, y2: 0 },
                { x1: 800, y1: 0, x2: 800, y2: 600 },
                { x1: 800, y1: 600, x2: 0, y2: 600 },
                { x1: 0, y1: 600, x2: 0, y2: 0 },
                { x1: 120, y1: 0, x2: 120, y2: 420 },
                { x1: 120, y1: 420, x2: 300, y2: 420 },
                { x1: 300, y1: 420, x2: 300, y2: 150 },
                { x1: 300, y1: 150, x2: 480, y2: 150 },
                { x1: 480, y1: 150, x2: 480, y2: 480 },
                { x1: 480, y1: 480, x2: 680, y2: 480 },
                { x1: 680, y1: 480, x2: 680, y2: 300 },
                { x1: 680, y1: 300, x2: 560, y2: 300 },
                { x1: 560, y1: 300, x2: 560, y2: 80 },
                { x1: 560, y1: 80, x2: 200, y2: 80 },
                { x1: 200, y1: 80, x2: 200, y2: 350 },
                { x1: 200, y1: 350, x2: 380, y2: 350 },
                { x1: 380, y1: 350, x2: 380, y2: 250 },
                { x1: 380, y1: 250, x2: 200, y2: 250 },
            ],
            holes: [
                { x: 400, y: 100, r: 18 },
                { x: 620, y: 200, r: 18 },
                { x: 250, y: 500, r: 18 },
                { x: 150, y: 200, r: 15 },
                { x: 550, y: 520, r: 18 },
            ],
            movingBlocks: [],
            doors: []
        },
        {
            name: '中级迷宫',
            start: { x: 60, y: 60 },
            end: { x: 740, y: 540, radius: 20 },
            walls: [
                { x1: 0, y1: 0, x2: 800, y2: 0 },
                { x1: 800, y1: 0, x2: 800, y2: 600 },
                { x1: 800, y1: 600, x2: 0, y2: 600 },
                { x1: 0, y1: 600, x2: 0, y2: 0 },
                { x1: 100, y1: 0, x2: 100, y2: 180 },
                { x1: 100, y1: 180, x2: 250, y2: 180 },
                { x1: 250, y1: 180, x2: 250, y2: 0 },
                { x1: 350, y1: 0, x2: 350, y2: 300 },
                { x1: 350, y1: 300, x2: 200, y2: 300 },
                { x1: 200, y1: 300, x2: 200, y2: 450 },
                { x1: 200, y1: 450, x2: 450, y2: 450 },
                { x1: 450, y1: 450, x2: 450, y2: 150 },
                { x1: 450, y1: 150, x2: 600, y2: 150 },
                { x1: 600, y1: 150, x2: 600, y2: 400 },
                { x1: 600, y1: 400, x2: 700, y2: 400 },
                { x1: 700, y1: 400, x2: 700, y2: 100 },
                { x1: 700, y1: 100, x2: 500, y2: 100 },
                { x1: 500, y1: 100, x2: 500, y2: 50 },
                { x1: 100, y1: 280, x2: 0, y2: 280 },
                { x1: 0, y1: 400, x2: 150, y2: 400 },
                { x1: 150, y1: 400, x2: 150, y2: 600 },
                { x1: 300, y1: 600, x2: 300, y2: 530 },
                { x1: 300, y1: 530, x2: 550, y2: 530 },
                { x1: 550, y1: 530, x2: 550, y2: 600 },
                { x1: 650, y1: 600, x2: 650, y2: 500 },
                { x1: 650, y1: 500, x2: 750, y2: 500 },
                { x1: 750, y1: 500, x2: 750, y2: 250 },
            ],
            holes: [
                { x: 175, y: 90, r: 16 },
                { x: 300, y: 240, r: 16 },
                { x: 400, y: 380, r: 16 },
                { x: 550, y: 250, r: 16 },
                { x: 675, y: 180, r: 16 },
                { x: 80, y: 500, r: 16 },
                { x: 400, y: 565, r: 16 },
                { x: 720, y: 320, r: 14 },
                { x: 720, y: 560, r: 14 },
            ],
            movingBlocks: [],
            doors: []
        },
        {
            name: '高级迷宫',
            start: { x: 50, y: 50 },
            end: { x: 750, y: 550, radius: 18 },
            walls: [
                { x1: 0, y1: 0, x2: 800, y2: 0 },
                { x1: 800, y1: 0, x2: 800, y2: 600 },
                { x1: 800, y1: 600, x2: 0, y2: 600 },
                { x1: 0, y1: 600, x2: 0, y2: 0 },
                { x1: 0, y1: 120, x2: 180, y2: 120 },
                { x1: 180, y1: 120, x2: 180, y2: 0 },
                { x1: 280, y1: 0, x2: 280, y2: 200 },
                { x1: 280, y1: 200, x2: 100, y2: 200 },
                { x1: 100, y1: 200, x2: 100, y2: 350 },
                { x1: 100, y1: 350, x2: 280, y2: 350 },
                { x1: 280, y1: 350, x2: 280, y2: 500 },
                { x1: 280, y1: 500, x2: 150, y2: 500 },
                { x1: 150, y1: 500, x2: 150, y2: 600 },
                { x1: 380, y1: 600, x2: 380, y2: 450 },
                { x1: 380, y1: 450, x2: 550, y2: 450 },
                { x1: 550, y1: 450, x2: 550, y2: 250 },
                { x1: 550, y1: 250, x2: 380, y2: 250 },
                { x1: 380, y1: 250, x2: 380, y2: 80 },
                { x1: 380, y1: 80, x2: 500, y2: 80 },
                { x1: 500, y1: 80, x2: 500, y2: 0 },
                { x1: 620, y1: 0, x2: 620, y2: 180 },
                { x1: 620, y1: 180, x2: 450, y2: 180 },
                { x1: 450, y1: 180, x2: 450, y2: 350 },
                { x1: 450, y1: 350, x2: 700, y2: 350 },
                { x1: 700, y1: 350, x2: 700, y2: 120 },
                { x1: 700, y1: 120, x2: 800, y2: 120 },
                { x1: 0, y1: 420, x2: 50, y2: 420 },
                { x1: 50, y1: 420, x2: 50, y2: 550 },
                { x1: 50, y1: 550, x2: 0, y2: 550 },
                { x1: 620, y1: 600, x2: 620, y2: 530 },
                { x1: 620, y1: 530, x2: 750, y2: 530 },
                { x1: 750, y1: 530, x2: 750, y2: 420 },
                { x1: 750, y1: 420, x2: 800, y2: 420 },
            ],
            holes: [
                { x: 90, y: 60, r: 14 },
                { x: 230, y: 160, r: 14 },
                { x: 190, y: 280, r: 14 },
                { x: 330, y: 420, r: 14 },
                { x: 430, y: 160, r: 14 },
                { x: 480, y: 300, r: 14 },
                { x: 670, y: 200, r: 14 },
                { x: 750, y: 280, r: 14 },
                { x: 650, y: 400, r: 14 },
                { x: 400, y: 560, r: 14 },
                { x: 700, y: 560, r: 14 },
                { x: 60, y: 480, r: 12 },
            ],
            movingBlocks: [],
            doors: []
        },
        {
            name: '机关迷宫',
            start: { x: 50, y: 300 },
            end: { x: 750, y: 300, radius: 20 },
            walls: [
                { x1: 0, y1: 0, x2: 800, y2: 0 },
                { x1: 800, y1: 0, x2: 800, y2: 600 },
                { x1: 800, y1: 600, x2: 0, y2: 600 },
                { x1: 0, y1: 600, x2: 0, y2: 0 },
                { x1: 0, y1: 200, x2: 150, y2: 200 },
                { x1: 0, y1: 400, x2: 150, y2: 400 },
                { x1: 650, y1: 200, x2: 800, y2: 200 },
                { x1: 650, y1: 400, x2: 800, y2: 400 },
                { x1: 150, y1: 0, x2: 150, y2: 150 },
                { x1: 150, y1: 450, x2: 150, y2: 600 },
                { x1: 650, y1: 0, x2: 650, y2: 150 },
                { x1: 650, y1: 450, x2: 650, y2: 600 },
                { x1: 300, y1: 100, x2: 300, y2: 200 },
                { x1: 300, y1: 400, x2: 300, y2: 500 },
                { x1: 500, y1: 100, x2: 500, y2: 200 },
                { x1: 500, y1: 400, x2: 500, y2: 500 },
            ],
            holes: [
                { x: 225, y: 300, r: 12 },
                { x: 575, y: 300, r: 12 },
                { x: 400, y: 150, r: 14 },
                { x: 400, y: 450, r: 14 },
            ],
            movingBlocks: [
                {
                    x1: 150, y1: 200,
                    x2: 150, y2: 400,
                    axis: 'y',
                    min: 200, max: 400,
                    speed: 60,
                    current: 200,
                    direction: 1
                }
            ],
            doors: [
                {
                    x: 400, y: 250,
                    length: 80,
                    angle: 0,
                    speed: 90,
                    minAngle: -45,
                    maxAngle: 45
                }
            ]
        },
        {
            name: '移动障碍',
            start: { x: 50, y: 50 },
            end: { x: 750, y: 550, radius: 18 },
            walls: [
                { x1: 0, y1: 0, x2: 800, y2: 0 },
                { x1: 800, y1: 0, x2: 800, y2: 600 },
                { x1: 800, y1: 600, x2: 0, y2: 600 },
                { x1: 0, y1: 600, x2: 0, y2: 0 },
                { x1: 200, y1: 0, x2: 200, y2: 400 },
                { x1: 400, y1: 200, x2: 400, y2: 600 },
                { x1: 600, y1: 0, x2: 600, y2: 400 },
            ],
            holes: [
                { x: 100, y: 500, r: 16 },
                { x: 300, y: 100, r: 16 },
                { x: 500, y: 500, r: 16 },
                { x: 700, y: 100, r: 16 },
            ],
            movingBlocks: [
                {
                    x1: 0, y1: 300,
                    x2: 200, y2: 300,
                    axis: 'y',
                    min: 150, max: 450,
                    speed: 80,
                    current: 300,
                    direction: 1
                },
                {
                    x1: 200, y1: 500,
                    x2: 400, y2: 500,
                    axis: 'y',
                    min: 350, max: 550,
                    speed: 60,
                    current: 500,
                    direction: -1
                },
                {
                    x1: 400, y1: 150,
                    x2: 600, y2: 150,
                    axis: 'y',
                    min: 100, max: 300,
                    speed: 70,
                    current: 150,
                    direction: 1
                },
                {
                    x1: 600, y1: 450,
                    x2: 800, y2: 450,
                    axis: 'y',
                    min: 300, max: 500,
                    speed: 90,
                    current: 450,
                    direction: -1
                }
            ],
            doors: []
        },
        {
            name: '终极挑战',
            start: { x: 400, y: 550 },
            end: { x: 400, y: 50, radius: 18 },
            walls: [
                { x1: 0, y1: 0, x2: 800, y2: 0 },
                { x1: 800, y1: 0, x2: 800, y2: 600 },
                { x1: 800, y1: 600, x2: 0, y2: 600 },
                { x1: 0, y1: 600, x2: 0, y2: 0 },
                { x1: 300, y1: 600, x2: 300, y2: 480 },
                { x1: 500, y1: 600, x2: 500, y2: 480 },
                { x1: 300, y1: 480, x2: 100, y2: 480 },
                { x1: 500, y1: 480, x2: 700, y2: 480 },
                { x1: 100, y1: 480, x2: 100, y2: 300 },
                { x1: 700, y1: 480, x2: 700, y2: 300 },
                { x1: 100, y1: 300, x2: 250, y2: 300 },
                { x1: 700, y1: 300, x2: 550, y2: 300 },
                { x1: 250, y1: 300, x2: 250, y2: 150 },
                { x1: 550, y1: 300, x2: 550, y2: 150 },
                { x1: 250, y1: 150, x2: 400, y2: 150 },
                { x1: 550, y1: 150, x2: 400, y2: 150 },
            ],
            holes: [
                { x: 200, y: 550, r: 12 },
                { x: 600, y: 550, r: 12 },
                { x: 50, y: 400, r: 14 },
                { x: 750, y: 400, r: 14 },
                { x: 175, y: 225, r: 12 },
                { x: 625, y: 225, r: 12 },
                { x: 400, y: 80, r: 10 },
            ],
            movingBlocks: [
                {
                    x1: 300, y1: 400,
                    x2: 500, y2: 400,
                    axis: 'y',
                    min: 350, max: 450,
                    speed: 50,
                    current: 400,
                    direction: 1
                },
                {
                    x1: 300, y1: 220,
                    x2: 500, y2: 220,
                    axis: 'y',
                    min: 180, max: 280,
                    speed: 60,
                    current: 220,
                    direction: -1
                }
            ],
            doors: [
                {
                    x: 400, y: 420,
                    length: 60,
                    angle: 0,
                    speed: 120,
                    minAngle: -60,
                    maxAngle: 60
                },
                {
                    x: 400, y: 200,
                    length: 50,
                    angle: 0,
                    speed: 150,
                    minAngle: -45,
                    maxAngle: 45
                }
            ]
        }
    ];

    const game = {
        state: 'idle',
        currentLevel: 0,
        viewMode: 'iso',
        marble: {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            radius: MARBLE_RADIUS,
            angularVx: 0,
            angularVy: 0
        },
        tilt: {
            x: 0,
            y: 0
        },
        keys: {},
        keyPressed: {},
        startTime: 0,
        elapsedTime: 0,
        penaltyTime: 0,
        stepCount: 0,
        bestTime: Infinity,
        useDeviceOrientation: false,
        customLevel: null
    };

    const woodGrainLines = [];
    for (let i = 0; i < 40; i++) {
        woodGrainLines.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            len: 20 + Math.random() * 60,
            wobble: (Math.random() - 0.5) * 5
        });
    }

    let flashAlpha = 0;

    function loadBestTime(levelIndex) {
        try {
            const data = JSON.parse(localStorage.getItem('marbleMaze_leaderboard') || '{}');
            const key = 'level_' + levelIndex;
            if (data[key] && data[key].length > 0) {
                data[key].sort(function(a, b) { return a.time - b.time; });
                return data[key][0].time;
            }
            return Infinity;
        } catch (e) {
            return Infinity;
        }
    }

    function saveToLeaderboard(levelIndex, time, steps) {
        try {
            const data = JSON.parse(localStorage.getItem('marbleMaze_leaderboard') || '{}');
            const key = 'level_' + levelIndex;
            if (!data[key]) data[key] = [];
            data[key].push({
                time: time,
                steps: steps,
                date: new Date().toLocaleDateString('zh-CN')
            });
            data[key].sort(function(a, b) { return a.time - b.time; });
            data[key] = data[key].slice(0, 10);
            localStorage.setItem('marbleMaze_leaderboard', JSON.stringify(data));
            for (var i = 0; i < data[key].length; i++) {
                if (data[key][i].time === time && data[key][i].steps === steps) {
                    return i + 1;
                }
            }
            return 1;
        } catch (e) {
            return 1;
        }
    }

    function getLeaderboard(levelIndex) {
        try {
            const data = JSON.parse(localStorage.getItem('marbleMaze_leaderboard') || '{}');
            const key = 'level_' + levelIndex;
            return data[key] || [];
        } catch (e) {
            return [];
        }
    }

    function formatTime(ms) {
        if (ms === Infinity || ms == null) return '--';
        return (ms / 1000).toFixed(2) + 's';
    }

    function updateUI() {
        if (currentTimeEl) currentTimeEl.textContent = formatTime(game.elapsedTime + game.penaltyTime);
        if (bestTimeEl) bestTimeEl.textContent = formatTime(game.bestTime);
        if (stepCountEl) stepCountEl.textContent = game.stepCount;
        if (levelNameEl) levelNameEl.textContent = getCurrentLevel().name;
    }

    function getCurrentLevel() {
        return game.customLevel || LEVELS[game.currentLevel];
    }

    function resetMarble() {
        var level = getCurrentLevel();
        game.marble.x = level.start.x;
        game.marble.y = level.start.y;
        game.marble.vx = 0;
        game.marble.vy = 0;
        game.marble.angularVx = 0;
        game.marble.angularVy = 0;
        game.tilt.x = 0;
        game.tilt.y = 0;
    }

    function startGame() {
        if (game.state === 'playing') return;
        resetMarble();
        game.state = 'playing';
        game.startTime = performance.now();
        game.elapsedTime = 0;
        game.penaltyTime = 0;
        game.stepCount = 0;
        game.keyPressed = {};
        if (startBtn) {
            startBtn.textContent = '游戏中...';
            startBtn.disabled = true;
        }
        hideModal();
        updateUI();
    }

    function resetGame() {
        game.state = 'idle';
        resetMarble();
        game.startTime = 0;
        game.elapsedTime = 0;
        game.penaltyTime = 0;
        game.stepCount = 0;
        game.keyPressed = {};
        if (startBtn) {
            startBtn.textContent = '开始游戏';
            startBtn.disabled = false;
        }
        hideModal();
        updateUI();
    }

    function prevLevel() {
        if (game.customLevel) {
            game.customLevel = null;
        }
        game.currentLevel = (game.currentLevel - 1 + LEVELS.length) % LEVELS.length;
        game.bestTime = loadBestTime(game.currentLevel);
        resetGame();
    }

    function nextLevel() {
        if (game.customLevel) {
            game.customLevel = null;
        }
        game.currentLevel = (game.currentLevel + 1) % LEVELS.length;
        game.bestTime = loadBestTime(game.currentLevel);
        resetGame();
    }

    function showModal(title, time, steps, rank) {
        if (!resultModal) return;
        if (resultTitle) resultTitle.textContent = title;
        if (resultTimeEl) resultTimeEl.textContent = '用时：' + formatTime(time);
        if (resultStepsEl) resultStepsEl.textContent = '步数：' + steps + ' 步';
        if (resultBestEl) resultBestEl.textContent = '最佳：' + formatTime(game.bestTime);
        if (resultRankEl) {
            if (rank && rank <= 3) {
                var medals = ['🥇', '🥈', '🥉'];
                resultRankEl.textContent = medals[rank - 1] + ' 第 ' + rank + ' 名！';
            } else if (rank) {
                resultRankEl.textContent = '🏅 第 ' + rank + ' 名';
            } else {
                resultRankEl.textContent = '';
            }
        }
        resultModal.classList.add('show');
    }

    function hideModal() {
        if (resultModal) resultModal.classList.remove('show');
    }

    function completeGame() {
        game.state = 'won';
        var totalTime = game.elapsedTime + game.penaltyTime;
        var rank = saveToLeaderboard(game.customLevel ? 'custom' : game.currentLevel, totalTime, game.stepCount);
        if (game.bestTime === Infinity || totalTime < game.bestTime) {
            game.bestTime = totalTime;
        }
        if (startBtn) {
            startBtn.textContent = '开始游戏';
            startBtn.disabled = false;
        }
        showModal('🎉 恭喜通关！', totalTime, game.stepCount, rank);
        updateUI();
    }

    function handleHoleFall() {
        resetMarble();
        game.penaltyTime += 3000;
        flashScreen();
    }

    function flashScreen() {
        flashAlpha = 0.5;
    }

    function closestPointOnSegment(px, py, x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        var lenSq = dx * dx + dy * dy;
        if (lenSq === 0) {
            return { x: x1, y: y1 };
        }
        var t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        return { x: x1 + t * dx, y: y1 + t * dy };
    }

    function handleWallCollision(wall) {
        var m = game.marble;
        var halfThick = WALL_THICKNESS / 2;

        var cp = closestPointOnSegment(m.x, m.y, wall.x1, wall.y1, wall.x2, wall.y2);
        var distX = m.x - cp.x;
        var distY = m.y - cp.y;
        var dist = Math.sqrt(distX * distX + distY * distY);
        var minDist = m.radius + halfThick;

        if (dist < minDist && dist > 0) {
            var nx = distX / dist;
            var ny = distY / dist;
            var overlap = minDist - dist;

            m.x += nx * overlap;
            m.y += ny * overlap;

            var dot = m.vx * nx + m.vy * ny;
            if (dot < 0) {
                m.vx -= (1 + BOUNCE_DAMPING) * dot * nx;
                m.vy -= (1 + BOUNCE_DAMPING) * dot * ny;
                var tangentSpeed = Math.abs(m.vx * (-ny) + m.vy * nx);
                var friction = Math.pow(FRICTION_DECAY, tangentSpeed / 100);
                m.vx *= friction;
                m.vy *= friction;
            }
        }
    }

    function handleHoleCollision(hole) {
        var m = game.marble;
        var dx = m.x - hole.x;
        var dy = m.y - hole.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var triggerRadius = hole.r + m.radius - 4;
        if (triggerRadius < m.radius) triggerRadius = m.radius;
        return dist < triggerRadius;
    }

    function handleEndCollision(end) {
        var m = game.marble;
        var dx = m.x - end.x;
        var dy = m.y - end.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        return dist < end.radius;
    }

    function updateMovingBlocks(dt) {
        var level = getCurrentLevel();
        if (!level.movingBlocks) return;
        for (var i = 0; i < level.movingBlocks.length; i++) {
            var block = level.movingBlocks[i];
            block.current += block.speed * block.direction * dt;
            if (block.current >= block.max || block.current <= block.min) {
                block.direction *= -1;
            }
            if (block.axis === 'y') {
                block.y1 = block.current;
                block.y2 = block.current;
            } else {
                block.x1 = block.current;
                block.x2 = block.current;
            }
        }
    }

    function updateDoors(dt) {
        var level = getCurrentLevel();
        if (!level.doors) return;
        for (var i = 0; i < level.doors.length; i++) {
            var door = level.doors[i];
            door.angle += door.speed * dt;
            if (door.angle >= door.maxAngle || door.angle <= door.minAngle) {
                door.speed *= -1;
            }
        }
    }

    function getDoorEndpoints(door) {
        var rad = door.angle * Math.PI / 180;
        var halfLen = door.length / 2;
        return {
            x1: door.x + Math.cos(rad) * halfLen,
            y1: door.y + Math.sin(rad) * halfLen,
            x2: door.x - Math.cos(rad) * halfLen,
            y2: door.y - Math.sin(rad) * halfLen
        };
    }

    function updatePhysics(dt) {
        var level = getCurrentLevel();
        var m = game.marble;

        var tiltRadX = game.tilt.x * Math.PI / 180;
        var tiltRadY = game.tilt.y * Math.PI / 180;

        var ax = GRAVITY * Math.sin(tiltRadX);
        var ay = GRAVITY * Math.sin(tiltRadY);

        m.vx += ax * dt;
        m.vy += ay * dt;

        var rollFactor = Math.pow(ROLLING_RESISTANCE, dt * 60);
        m.vx *= rollFactor;
        m.vy *= rollFactor;

        var speed = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
        if (speed > MAX_SPEED) {
            m.vx = (m.vx / speed) * MAX_SPEED;
            m.vy = (m.vy / speed) * MAX_SPEED;
        }

        m.angularVx = m.vy / m.radius;
        m.angularVy = -m.vx / m.radius;

        m.x += m.vx * dt;
        m.y += m.vy * dt;

        for (var i = 0; i < level.walls.length; i++) {
            handleWallCollision(level.walls[i]);
        }

        if (level.movingBlocks) {
            for (var j = 0; j < level.movingBlocks.length; j++) {
                handleWallCollision(level.movingBlocks[j]);
            }
        }

        if (level.doors) {
            for (var k = 0; k < level.doors.length; k++) {
                var endpoints = getDoorEndpoints(level.doors[k]);
                handleWallCollision(endpoints);
            }
        }

        m.x = Math.max(m.radius, Math.min(CANVAS_WIDTH - m.radius, m.x));
        m.y = Math.max(m.radius, Math.min(CANVAS_HEIGHT - m.radius, m.y));

        for (var l = 0; l < level.holes.length; l++) {
            if (handleHoleCollision(level.holes[l])) {
                handleHoleFall();
                return;
            }
        }

        if (handleEndCollision(level.end)) {
            completeGame();
        }
    }

    function updateTilt(dt) {
        if (game.useDeviceOrientation) return;

        var gamepad = null;
        if (navigator.getGamepads) {
            gamepad = navigator.getGamepads()[0];
        }
        if (gamepad) {
            var deadzone = 0.1;
            var stepThreshold = 0.5;
            var gx = gamepad.axes[0];
            var gy = gamepad.axes[1];
            if (Math.abs(gx) < deadzone) gx = 0;
            if (Math.abs(gy) < deadzone) gy = 0;
            game.tilt.x = gx * MAX_TILT;
            game.tilt.y = gy * MAX_TILT;

            if (game.state === 'playing') {
                if (gx < -stepThreshold && !game.keyPressed['gleft']) {
                    game.keyPressed['gleft'] = true;
                    game.stepCount++;
                } else if (gx >= -stepThreshold) {
                    game.keyPressed['gleft'] = false;
                }
                if (gx > stepThreshold && !game.keyPressed['gright']) {
                    game.keyPressed['gright'] = true;
                    game.stepCount++;
                } else if (gx <= stepThreshold) {
                    game.keyPressed['gright'] = false;
                }
                if (gy < -stepThreshold && !game.keyPressed['gup']) {
                    game.keyPressed['gup'] = true;
                    game.stepCount++;
                } else if (gy >= -stepThreshold) {
                    game.keyPressed['gup'] = false;
                }
                if (gy > stepThreshold && !game.keyPressed['gdown']) {
                    game.keyPressed['gdown'] = true;
                    game.stepCount++;
                } else if (gy <= stepThreshold) {
                    game.keyPressed['gdown'] = false;
                }
            }

            updateTiltIndicator();
            return;
        }

        var tiltDelta = TILT_SPEED * dt;
        var returnFactor = Math.max(0, 1 - TILT_RETURN * dt);

        if (game.keys['ArrowLeft'] || game.keys['a'] || game.keys['A']) {
            if (!game.keyPressed['left']) {
                game.keyPressed['left'] = true;
                if (game.state === 'playing') game.stepCount++;
            }
            game.tilt.x = Math.max(-MAX_TILT, game.tilt.x - tiltDelta);
        } else if (game.keys['ArrowRight'] || game.keys['d'] || game.keys['D']) {
            if (!game.keyPressed['right']) {
                game.keyPressed['right'] = true;
                if (game.state === 'playing') game.stepCount++;
            }
            game.tilt.x = Math.min(MAX_TILT, game.tilt.x + tiltDelta);
        } else {
            game.tilt.x *= returnFactor;
            game.keyPressed['left'] = false;
            game.keyPressed['right'] = false;
        }

        if (game.keys['ArrowUp'] || game.keys['w'] || game.keys['W']) {
            if (!game.keyPressed['up']) {
                game.keyPressed['up'] = true;
                if (game.state === 'playing') game.stepCount++;
            }
            game.tilt.y = Math.max(-MAX_TILT, game.tilt.y - tiltDelta);
        } else if (game.keys['ArrowDown'] || game.keys['s'] || game.keys['S']) {
            if (!game.keyPressed['down']) {
                game.keyPressed['down'] = true;
                if (game.state === 'playing') game.stepCount++;
            }
            game.tilt.y = Math.min(MAX_TILT, game.tilt.y + tiltDelta);
        } else {
            game.tilt.y *= returnFactor;
            game.keyPressed['up'] = false;
            game.keyPressed['down'] = false;
        }

        updateTiltIndicator();
    }

    function updateTiltIndicator() {
        var threshold = 3;
        if (tiltUpEl) tiltUpEl.classList.toggle('active', game.tilt.y < -threshold);
        if (tiltDownEl) tiltDownEl.classList.toggle('active', game.tilt.y > threshold);
        if (tiltLeftEl) tiltLeftEl.classList.toggle('active', game.tilt.x < -threshold);
        if (tiltRightEl) tiltRightEl.classList.toggle('active', game.tilt.x > threshold);
    }

    function isoProject(x, y, z) {
        var scale = 0.8;
        var offsetX = CANVAS_WIDTH / 2;
        var offsetY = 100;
        var isoX = (x - y) * 0.866 * scale + offsetX;
        var isoY = (x + y) * 0.5 * scale - z * scale + offsetY;
        return { x: isoX, y: isoY };
    }

    function drawWoodBackground() {
        ctx.fillStyle = '#d2a679';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        var stripes = 15;
        for (var i = 0; i < stripes; i++) {
            var y = (i / stripes) * CANVAS_HEIGHT;
            var alpha = 0.03 + Math.sin(i * 0.8) * 0.02;
            ctx.fillStyle = 'rgba(139, 90, 43, ' + alpha + ')';
            ctx.fillRect(0, y, CANVAS_WIDTH, CANVAS_HEIGHT / stripes + 2);
        }

        ctx.save();
        ctx.globalAlpha = 0.04;
        for (var j = 0; j < woodGrainLines.length; j++) {
            var line = woodGrainLines[j];
            ctx.strokeStyle = '#5c3a21';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(line.x, line.y);
            ctx.lineTo(line.x + line.len, line.y + line.wobble);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawWallIso(wall) {
        var p1 = isoProject(wall.x1, wall.y1, 15);
        var p2 = isoProject(wall.x2, wall.y2, 15);
        var p1b = isoProject(wall.x1, wall.y1, 0);
        var p2b = isoProject(wall.x2, wall.y2, 0);

        ctx.fillStyle = '#8b5a2b';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p2b.x, p2b.y);
        ctx.lineTo(p1b.x, p1b.y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#6b4423';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    function drawWalls2D() {
        var level = getCurrentLevel();

        for (var i = 0; i < level.walls.length; i++) {
            var wall = level.walls[i];
            ctx.save();
            var gradient = ctx.createLinearGradient(wall.x1, wall.y1, wall.x2, wall.y2);
            gradient.addColorStop(0, '#6b4423');
            gradient.addColorStop(0.5, '#8b5a2b');
            gradient.addColorStop(1, '#6b4423');
            ctx.strokeStyle = gradient;
            ctx.lineWidth = WALL_THICKNESS;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(wall.x1, wall.y1);
            ctx.lineTo(wall.x2, wall.y2);
            ctx.stroke();
            ctx.restore();
        }

        if (level.movingBlocks) {
            for (var j = 0; j < level.movingBlocks.length; j++) {
                var block = level.movingBlocks[j];
                ctx.save();
                ctx.strokeStyle = '#d32f2f';
                ctx.lineWidth = WALL_THICKNESS;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(block.x1, block.y1);
                ctx.lineTo(block.x2, block.y2);
                ctx.stroke();
                ctx.restore();
            }
        }

        if (level.doors) {
            for (var k = 0; k < level.doors.length; k++) {
                var door = level.doors[k];
                var ep = getDoorEndpoints(door);
                ctx.save();
                ctx.strokeStyle = '#7b1fa2';
                ctx.lineWidth = 6;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(ep.x1, ep.y1);
                ctx.lineTo(ep.x2, ep.y2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(door.x, door.y, 8, 0, Math.PI * 2);
                ctx.fillStyle = '#9c27b0';
                ctx.fill();
                ctx.restore();
            }
        }
    }

    function drawWalls() {
        if (game.viewMode === '2d') {
            drawWalls2D();
            return;
        }

        var level = getCurrentLevel();
        for (var i = 0; i < level.walls.length; i++) {
            drawWallIso(level.walls[i]);
        }
        if (level.movingBlocks) {
            for (var j = 0; j < level.movingBlocks.length; j++) {
                drawWallIso(level.movingBlocks[j]);
            }
        }
        if (level.doors) {
            for (var k = 0; k < level.doors.length; k++) {
                var ep = getDoorEndpoints(level.doors[k]);
                drawWallIso(ep);
            }
        }
    }

    function drawHoles() {
        var level = getCurrentLevel();
        for (var i = 0; i < level.holes.length; i++) {
            var hole = level.holes[i];
            ctx.save();
            ctx.beginPath();
            ctx.arc(hole.x, hole.y, hole.r + 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(hole.x, hole.y, hole.r, 0, Math.PI * 2);
            var holeGradient = ctx.createRadialGradient(
                hole.x - hole.r * 0.3, hole.y - hole.r * 0.3, 0,
                hole.x, hole.y, hole.r
            );
            holeGradient.addColorStop(0, '#1a1a1a');
            holeGradient.addColorStop(0.7, '#0d0d0d');
            holeGradient.addColorStop(1, '#000000');
            ctx.fillStyle = holeGradient;
            ctx.fill();
            ctx.restore();
        }
    }

    function drawStartEnd() {
        var level = getCurrentLevel();

        ctx.save();
        ctx.beginPath();
        ctx.arc(level.start.x, level.start.y, MARBLE_RADIUS + 4, 0, Math.PI * 2);
        var startGradient = ctx.createRadialGradient(
            level.start.x, level.start.y, 0,
            level.start.x, level.start.y, MARBLE_RADIUS + 4
        );
        startGradient.addColorStop(0, 'rgba(76, 175, 80, 0.6)');
        startGradient.addColorStop(1, 'rgba(76, 175, 80, 0)');
        ctx.fillStyle = startGradient;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(level.start.x, level.start.y, MARBLE_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.arc(level.end.x, level.end.y, level.end.radius + 8, 0, Math.PI * 2);
        var endGlow = ctx.createRadialGradient(
            level.end.x, level.end.y, 0,
            level.end.x, level.end.y, level.end.radius + 8
        );
        endGlow.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
        endGlow.addColorStop(0.5, 'rgba(255, 193, 7, 0.3)');
        endGlow.addColorStop(1, 'rgba(255, 193, 7, 0)');
        ctx.fillStyle = endGlow;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(level.end.x, level.end.y, level.end.radius, 0, Math.PI * 2);
        var endGradient = ctx.createRadialGradient(
            level.end.x - level.end.radius * 0.3, level.end.y - level.end.radius * 0.3, 0,
            level.end.x, level.end.y, level.end.radius
        );
        endGradient.addColorStop(0, '#FFD700');
        endGradient.addColorStop(0.5, '#FFC107');
        endGradient.addColorStop(1, '#FF9800');
        ctx.fillStyle = endGradient;
        ctx.fill();
        ctx.restore();
    }

    function drawMarble() {
        var m = game.marble;

        ctx.save();

        ctx.beginPath();
        ctx.ellipse(
            m.x + 2, m.y + 4,
            m.radius * 0.8, m.radius * 0.4,
            0, 0, Math.PI * 2
        );
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fill();

        var marbleY = (game.viewMode === 'iso') ? m.y - 8 : m.y;

        ctx.beginPath();
        ctx.arc(m.x, marbleY, m.radius, 0, Math.PI * 2);
        var marbleGradient = ctx.createRadialGradient(
            m.x - m.radius * 0.35, marbleY - m.radius * 0.35, 0,
            m.x, marbleY, m.radius
        );
        marbleGradient.addColorStop(0, '#FFFFFF');
        marbleGradient.addColorStop(0.2, '#E8E8E8');
        marbleGradient.addColorStop(0.5, '#C0C0C0');
        marbleGradient.addColorStop(0.8, '#A0A0A0');
        marbleGradient.addColorStop(1, '#808080');
        ctx.fillStyle = marbleGradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(m.x - m.radius * 0.35, marbleY - m.radius * 0.35, m.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();

        ctx.restore();
    }

    function drawFlash() {
        if (flashAlpha > 0) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 0, 0, ' + flashAlpha + ')';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.restore();
            flashAlpha *= 0.9;
            if (flashAlpha < 0.01) flashAlpha = 0;
        }
    }

    function render() {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        drawWoodBackground();
        drawStartEnd();
        drawHoles();
        drawWalls();
        drawMarble();
        drawFlash();
    }

    var lastTime = 0;
    function gameLoop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        var dt = Math.min((timestamp - lastTime) / 1000, 1 / 30);
        lastTime = timestamp;

        if (game.state === 'playing') {
            game.elapsedTime = timestamp - game.startTime;
            updateTilt(dt);
            updateMovingBlocks(dt);
            updateDoors(dt);
            updatePhysics(dt);
            updateUI();
        } else {
            updateTilt(dt);
            updateMovingBlocks(dt);
            updateDoors(dt);
        }

        render();
        requestAnimationFrame(gameLoop);
    }

    function handleKeyDown(e) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].indexOf(e.key) >= 0) {
            e.preventDefault();
        }
        game.keys[e.key] = true;

        if (e.key === ' ' && game.state === 'idle') {
            startGame();
        }
        if (e.key === 'r' || e.key === 'R') {
            resetGame();
        }
    }

    function handleKeyUp(e) {
        game.keys[e.key] = false;
    }

    function handleDeviceOrientation(e) {
        if (!game.useDeviceOrientation) return;
        var tiltX = Math.max(-MAX_TILT, Math.min(MAX_TILT, e.gamma || 0));
        var tiltY = Math.max(-MAX_TILT, Math.min(MAX_TILT, e.beta || 0));
        game.tilt.x = tiltX;
        game.tilt.y = tiltY;
        updateTiltIndicator();
    }

    function enableDeviceOrientation() {
        if (typeof DeviceOrientationEvent !== 'undefined') {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission().then(function(response) {
                    if (response === 'granted') {
                        game.useDeviceOrientation = true;
                        window.addEventListener('deviceorientation', handleDeviceOrientation);
                    }
                }).catch(function() {});
            } else {
                game.useDeviceOrientation = true;
                window.addEventListener('deviceorientation', handleDeviceOrientation);
            }
        }
    }

    function getCanvasCoords(e, canvasEl) {
        var rect = canvasEl.getBoundingClientRect();
        var scaleX = canvasEl.width / rect.width;
        var scaleY = canvasEl.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    function initTabs() {
        var tabs = document.querySelectorAll('.tab-btn');
        var contents = document.querySelectorAll('.tab-content');

        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                var targetId = this.getAttribute('data-tab');
                tabs.forEach(function(t) { t.classList.remove('active'); });
                contents.forEach(function(c) { c.classList.remove('active'); });
                this.classList.add('active');
                document.getElementById('tab-' + targetId).classList.add('active');
            });
        });
    }

    function initViewButtons() {
        if (view2dBtn) {
            view2dBtn.addEventListener('click', function() {
                game.viewMode = '2d';
                view2dBtn.classList.add('active');
                if (viewIsoBtn) viewIsoBtn.classList.remove('active');
            });
        }
        if (viewIsoBtn) {
            viewIsoBtn.addEventListener('click', function() {
                game.viewMode = 'iso';
                viewIsoBtn.classList.add('active');
                if (view2dBtn) view2dBtn.classList.remove('active');
            });
        }
    }

    function initLeaderboardButtons() {
        var levelBtns = document.querySelectorAll('.btn-level-select');
        levelBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var levelIdx = parseInt(this.getAttribute('data-level'));
                levelBtns.forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
                renderLeaderboard(levelIdx);
            });
        });
    }

    function renderLeaderboard(levelIdx) {
        var listEl = document.getElementById('leaderboardList');
        if (!listEl) return;

        var records = getLeaderboard(levelIdx);
        if (records.length === 0) {
            listEl.innerHTML = '<p style="text-align:center;color:#8b6914;padding:40px;">暂无记录，快来挑战吧！</p>';
            return;
        }

        var html = '';
        var rankClasses = ['gold', 'silver', 'bronze'];
        for (var i = 0; i < records.length; i++) {
            var rankClass = rankClasses[i] || 'normal';
            html += '<div class="leaderboard-item">' +
                '<div class="leaderboard-rank ' + rankClass + '">' + (i + 1) + '</div>' +
                '<div class="leaderboard-info">' +
                '<div class="leaderboard-time">' + formatTime(records[i].time) + '</div>' +
                '<div class="leaderboard-steps">' + records[i].steps + ' 步</div>' +
                '</div>' +
                '<div class="leaderboard-date">' + records[i].date + '</div>' +
                '</div>';
        }
        listEl.innerHTML = html;
    }

    const editor = {
        currentTool: 'wall',
        isDrawing: false,
        startPoint: null,
        previewPoint: null,
        level: {
            name: '自定义关卡',
            start: { x: 60, y: 60 },
            end: { x: 740, y: 540, radius: 22 },
            walls: [
                { x1: 0, y1: 0, x2: 800, y2: 0 },
                { x1: 800, y1: 0, x2: 800, y2: 600 },
                { x1: 800, y1: 600, x2: 0, y2: 600 },
                { x1: 0, y1: 600, x2: 0, y2: 0 }
            ],
            holes: [],
            movingBlocks: [],
            doors: []
        }
    };

    function initEditor() {
        if (!editorCanvas || !editorCtx) return;

        var toolBtns = document.querySelectorAll('.btn-tool');
        toolBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                editor.currentTool = this.getAttribute('data-tool');
                toolBtns.forEach(function(b) { b.classList.remove('active'); });
                this.classList.add('active');
            });
        });

        editorCanvas.addEventListener('mousedown', handleEditorMouseDown);
        editorCanvas.addEventListener('mousemove', handleEditorMouseMove);
        editorCanvas.addEventListener('mouseup', handleEditorMouseUp);
        editorCanvas.addEventListener('mouseleave', handleEditorMouseUp);

        var clearBtn = document.getElementById('clearBtn');
        var testBtn = document.getElementById('testBtn');
        var exportBtn = document.getElementById('exportBtn');
        var importBtn = document.getElementById('importBtn');

        if (clearBtn) clearBtn.addEventListener('click', clearEditor);
        if (testBtn) testBtn.addEventListener('click', testCustomLevel);
        if (exportBtn) exportBtn.addEventListener('click', exportLevel);
        if (importBtn) importBtn.addEventListener('click', importLevel);

        renderEditor();
    }

    function handleEditorMouseDown(e) {
        var coords = getCanvasCoords(e, editorCanvas);
        editor.isDrawing = true;
        editor.startPoint = coords;
        editor.previewPoint = coords;

        if (editor.currentTool === 'start') {
            editor.level.start = { x: coords.x, y: coords.y };
            editor.isDrawing = false;
            renderEditor();
        } else if (editor.currentTool === 'end') {
            editor.level.end = { x: coords.x, y: coords.y, radius: 22 };
            editor.isDrawing = false;
            renderEditor();
        } else if (editor.currentTool === 'hole') {
            editor.level.holes.push({ x: coords.x, y: coords.y, r: 16 });
            editor.isDrawing = false;
            renderEditor();
        } else if (editor.currentTool === 'eraser') {
            eraseAtPoint(coords);
            editor.isDrawing = false;
        }
    }

    function handleEditorMouseMove(e) {
        if (!editor.isDrawing) return;
        editor.previewPoint = getCanvasCoords(e, editorCanvas);
        renderEditor();
    }

    function handleEditorMouseUp(e) {
        if (!editor.isDrawing) return;

        var coords = getCanvasCoords(e, editorCanvas);

        if (editor.currentTool === 'wall' && editor.startPoint) {
            var dist = Math.sqrt(
                Math.pow(coords.x - editor.startPoint.x, 2) +
                Math.pow(coords.y - editor.startPoint.y, 2)
            );
            if (dist > 20) {
                editor.level.walls.push({
                    x1: editor.startPoint.x,
                    y1: editor.startPoint.y,
                    x2: coords.x,
                    y2: coords.y
                });
            }
        } else if (editor.currentTool === 'moving' && editor.startPoint) {
            var dist = Math.sqrt(
                Math.pow(coords.x - editor.startPoint.x, 2) +
                Math.pow(coords.y - editor.startPoint.y, 2)
            );
            if (dist > 20) {
                var isVertical = Math.abs(coords.y - editor.startPoint.y) > Math.abs(coords.x - editor.startPoint.x);
                if (isVertical) {
                    editor.level.movingBlocks.push({
                        x1: Math.min(editor.startPoint.x, coords.x),
                        y1: editor.startPoint.y,
                        x2: Math.max(editor.startPoint.x, coords.x),
                        y2: editor.startPoint.y,
                        axis: 'y',
                        min: Math.min(editor.startPoint.y, coords.y),
                        max: Math.max(editor.startPoint.y, coords.y),
                        speed: 60,
                        current: editor.startPoint.y,
                        direction: 1
                    });
                } else {
                    editor.level.movingBlocks.push({
                        x1: editor.startPoint.x,
                        y1: Math.min(editor.startPoint.y, coords.y),
                        x2: editor.startPoint.x,
                        y2: Math.max(editor.startPoint.y, coords.y),
                        axis: 'x',
                        min: Math.min(editor.startPoint.x, coords.x),
                        max: Math.max(editor.startPoint.x, coords.x),
                        speed: 60,
                        current: editor.startPoint.x,
                        direction: 1
                    });
                }
            }
        } else if (editor.currentTool === 'door' && editor.startPoint) {
            var dist = Math.sqrt(
                Math.pow(coords.x - editor.startPoint.x, 2) +
                Math.pow(coords.y - editor.startPoint.y, 2)
            );
            if (dist > 20) {
                editor.level.doors.push({
                    x: (editor.startPoint.x + coords.x) / 2,
                    y: (editor.startPoint.y + coords.y) / 2,
                    length: dist,
                    angle: 0,
                    speed: 90,
                    minAngle: -45,
                    maxAngle: 45
                });
            }
        }

        editor.isDrawing = false;
        editor.startPoint = null;
        editor.previewPoint = null;
        renderEditor();
    }

    function eraseAtPoint(coords) {
        var eraseRadius = 20;

        editor.level.holes = editor.level.holes.filter(function(h) {
            var dist = Math.sqrt(Math.pow(h.x - coords.x, 2) + Math.pow(h.y - coords.y, 2));
            return dist > eraseRadius;
        });

        editor.level.walls = editor.level.walls.filter(function(w) {
            if (w.x1 === 0 && w.y1 === 0 && w.x2 === CANVAS_WIDTH && w.y2 === 0) return true;
            if (w.x1 === CANVAS_WIDTH && w.y1 === 0 && w.x2 === CANVAS_WIDTH && w.y2 === CANVAS_HEIGHT) return true;
            if (w.x1 === CANVAS_WIDTH && w.y1 === CANVAS_HEIGHT && w.x2 === 0 && w.y2 === CANVAS_HEIGHT) return true;
            if (w.x1 === 0 && w.y1 === CANVAS_HEIGHT && w.x2 === 0 && w.y2 === 0) return true;
            var cp = closestPointOnSegment(coords.x, coords.y, w.x1, w.y1, w.x2, w.y2);
            var dist = Math.sqrt(Math.pow(cp.x - coords.x, 2) + Math.pow(cp.y - coords.y, 2));
            return dist > eraseRadius;
        });

        editor.level.movingBlocks = editor.level.movingBlocks.filter(function(b) {
            var cp = closestPointOnSegment(coords.x, coords.y, b.x1, b.y1, b.x2, b.y2);
            var dist = Math.sqrt(Math.pow(cp.x - coords.x, 2) + Math.pow(cp.y - coords.y, 2));
            return dist > eraseRadius;
        });

        editor.level.doors = editor.level.doors.filter(function(d) {
            var dist = Math.sqrt(Math.pow(d.x - coords.x, 2) + Math.pow(d.y - coords.y, 2));
            return dist > eraseRadius;
        });

        renderEditor();
    }

    function clearEditor() {
        editor.level = {
            name: '自定义关卡',
            start: { x: 60, y: 60 },
            end: { x: 740, y: 540, radius: 22 },
            walls: [
                { x1: 0, y1: 0, x2: 800, y2: 0 },
                { x1: 800, y1: 0, x2: 800, y2: 600 },
                { x1: 800, y1: 600, x2: 0, y2: 600 },
                { x1: 0, y1: 600, x2: 0, y2: 0 }
            ],
            holes: [],
            movingBlocks: [],
            doors: []
        };
        renderEditor();
    }

    function testCustomLevel() {
        game.customLevel = JSON.parse(JSON.stringify(editor.level));
        resetGame();

        var tabs = document.querySelectorAll('.tab-btn');
        var contents = document.querySelectorAll('.tab-content');
        tabs.forEach(function(t) { t.classList.remove('active'); });
        contents.forEach(function(c) { c.classList.remove('active'); });
        tabs[0].classList.add('active');
        contents[0].classList.add('active');
    }

    function exportLevel() {
        var levelData = JSON.stringify(editor.level);
        var importArea = document.getElementById('importArea');
        if (importArea) {
            importArea.value = levelData;
            importArea.select();
            try {
                document.execCommand('copy');
                alert('关卡代码已复制到剪贴板！');
            } catch (e) {
                alert('请手动复制下方的关卡代码');
            }
        }
    }

    function importLevel() {
        var importArea = document.getElementById('importArea');
        if (!importArea || !importArea.value.trim()) {
            alert('请先粘贴关卡代码到输入框');
            return;
        }

        try {
            var levelData = JSON.parse(importArea.value.trim());
            if (levelData.start && levelData.end && levelData.walls) {
                editor.level = levelData;
                renderEditor();
                alert('关卡导入成功！');
            } else {
                alert('无效的关卡数据');
            }
        } catch (e) {
            alert('关卡代码格式错误');
        }
    }

    function renderEditor() {
        if (!editorCtx) return;

        editorCtx.fillStyle = '#d2a679';
        editorCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        editorCtx.save();
        editorCtx.globalAlpha = 0.04;
        for (var j = 0; j < woodGrainLines.length; j++) {
            var line = woodGrainLines[j];
            editorCtx.strokeStyle = '#5c3a21';
            editorCtx.lineWidth = 1;
            editorCtx.beginPath();
            editorCtx.moveTo(line.x, line.y);
            editorCtx.lineTo(line.x + line.len, line.y + line.wobble);
            editorCtx.stroke();
        }
        editorCtx.restore();

        editorCtx.strokeStyle = 'rgba(139, 69, 19, 0.2)';
        editorCtx.lineWidth = 1;
        for (var gx = 0; gx <= CANVAS_WIDTH; gx += 40) {
            editorCtx.beginPath();
            editorCtx.moveTo(gx, 0);
            editorCtx.lineTo(gx, CANVAS_HEIGHT);
            editorCtx.stroke();
        }
        for (var gy = 0; gy <= CANVAS_HEIGHT; gy += 40) {
            editorCtx.beginPath();
            editorCtx.moveTo(0, gy);
            editorCtx.lineTo(CANVAS_WIDTH, gy);
            editorCtx.stroke();
        }

        editorCtx.save();
        editorCtx.beginPath();
        editorCtx.arc(editor.level.start.x, editor.level.start.y, 16, 0, Math.PI * 2);
        editorCtx.fillStyle = 'rgba(76, 175, 80, 0.5)';
        editorCtx.fill();
        editorCtx.strokeStyle = '#4CAF50';
        editorCtx.lineWidth = 3;
        editorCtx.stroke();
        editorCtx.fillStyle = '#4CAF50';
        editorCtx.font = 'bold 16px Arial';
        editorCtx.textAlign = 'center';
        editorCtx.textBaseline = 'middle';
        editorCtx.fillText('S', editor.level.start.x, editor.level.start.y);
        editorCtx.restore();

        editorCtx.save();
        editorCtx.beginPath();
        editorCtx.arc(editor.level.end.x, editor.level.end.y, 22, 0, Math.PI * 2);
        editorCtx.fillStyle = 'rgba(255, 193, 7, 0.5)';
        editorCtx.fill();
        editorCtx.strokeStyle = '#FFC107';
        editorCtx.lineWidth = 3;
        editorCtx.stroke();
        editorCtx.fillStyle = '#FF9800';
        editorCtx.font = 'bold 16px Arial';
        editorCtx.textAlign = 'center';
        editorCtx.textBaseline = 'middle';
        editorCtx.fillText('E', editor.level.end.x, editor.level.end.y);
        editorCtx.restore();

        for (var h = 0; h < editor.level.holes.length; h++) {
            var hole = editor.level.holes[h];
            editorCtx.save();
            editorCtx.beginPath();
            editorCtx.arc(hole.x, hole.y, hole.r, 0, Math.PI * 2);
            editorCtx.fillStyle = '#1a1a1a';
            editorCtx.fill();
            editorCtx.strokeStyle = '#000';
            editorCtx.lineWidth = 2;
            editorCtx.stroke();
            editorCtx.restore();
        }

        for (var i = 0; i < editor.level.walls.length; i++) {
            var wall = editor.level.walls[i];
            editorCtx.save();
            editorCtx.strokeStyle = '#6b4423';
            editorCtx.lineWidth = WALL_THICKNESS;
            editorCtx.lineCap = 'round';
            editorCtx.beginPath();
            editorCtx.moveTo(wall.x1, wall.y1);
            editorCtx.lineTo(wall.x2, wall.y2);
            editorCtx.stroke();
            editorCtx.restore();
        }

        for (var mb = 0; mb < editor.level.movingBlocks.length; mb++) {
            var block = editor.level.movingBlocks[mb];
            editorCtx.save();
            editorCtx.strokeStyle = '#d32f2f';
            editorCtx.lineWidth = WALL_THICKNESS;
            editorCtx.lineCap = 'round';
            editorCtx.beginPath();
            editorCtx.moveTo(block.x1, block.y1);
            editorCtx.lineTo(block.x2, block.y2);
            editorCtx.stroke();

            editorCtx.strokeStyle = 'rgba(211, 47, 47, 0.3)';
            editorCtx.setLineDash([5, 5]);
            if (block.axis === 'y') {
                editorCtx.beginPath();
                editorCtx.moveTo(block.x1, block.min);
                editorCtx.lineTo(block.x2, block.max);
            } else {
                editorCtx.beginPath();
                editorCtx.moveTo(block.min, block.y1);
                editorCtx.lineTo(block.max, block.y2);
            }
            editorCtx.stroke();
            editorCtx.restore();
        }

        for (var d = 0; d < editor.level.doors.length; d++) {
            var door = editor.level.doors[d];
            var ep = {
                x1: door.x + door.length / 2,
                y1: door.y,
                x2: door.x - door.length / 2,
                y2: door.y
            };
            editorCtx.save();
            editorCtx.strokeStyle = '#7b1fa2';
            editorCtx.lineWidth = 6;
            editorCtx.lineCap = 'round';
            editorCtx.beginPath();
            editorCtx.moveTo(ep.x1, ep.y1);
            editorCtx.lineTo(ep.x2, ep.y2);
            editorCtx.stroke();
            editorCtx.beginPath();
            editorCtx.arc(door.x, door.y, 8, 0, Math.PI * 2);
            editorCtx.fillStyle = '#9c27b0';
            editorCtx.fill();
            editorCtx.restore();
        }

        if (editor.isDrawing && editor.startPoint && editor.previewPoint) {
            editorCtx.save();
            if (editor.currentTool === 'wall') {
                editorCtx.strokeStyle = 'rgba(107, 68, 35, 0.6)';
                editorCtx.lineWidth = WALL_THICKNESS;
                editorCtx.setLineDash([8, 4]);
            } else if (editor.currentTool === 'moving') {
                editorCtx.strokeStyle = 'rgba(211, 47, 47, 0.6)';
                editorCtx.lineWidth = WALL_THICKNESS;
                editorCtx.setLineDash([8, 4]);
            } else if (editor.currentTool === 'door') {
                editorCtx.strokeStyle = 'rgba(123, 31, 162, 0.6)';
                editorCtx.lineWidth = 6;
                editorCtx.setLineDash([8, 4]);
            }
            editorCtx.lineCap = 'round';
            editorCtx.beginPath();
            editorCtx.moveTo(editor.startPoint.x, editor.startPoint.y);
            editorCtx.lineTo(editor.previewPoint.x, editor.previewPoint.y);
            editorCtx.stroke();
            editorCtx.restore();
        }
    }

    function init() {
        loadBestTime(game.currentLevel);
        game.bestTime = loadBestTime(game.currentLevel);
        resetMarble();
        updateUI();

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        if (startBtn) startBtn.addEventListener('click', startGame);
        if (resetBtn) resetBtn.addEventListener('click', resetGame);
        if (levelBtn) levelBtn.addEventListener('click', prevLevel);
        if (levelNextBtn) levelNextBtn.addEventListener('click', nextLevel);
        if (modalBtn) modalBtn.addEventListener('click', startGame);
        if (modalNextBtn) modalNextBtn.addEventListener('click', nextLevel);

        if (canvas) {
            canvas.addEventListener('touchstart', enableDeviceOrientation, { once: true });
        }

        initTabs();
        initViewButtons();
        initLeaderboardButtons();
        initEditor();
        renderLeaderboard(0);

        requestAnimationFrame(gameLoop);
    }

    init();
})();
