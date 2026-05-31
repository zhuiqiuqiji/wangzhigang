var Game = (function () {
    var STATE_MENU = 'menu';
    var STATE_PLAYING = 'playing';
    var STATE_FALLING = 'falling';
    var STATE_FINISHED = 'finished';
    var STATE_RESULT = 'result';
    var STATE_PAUSED = 'paused';
    var STATE_EDITOR = 'editor';

    var gameState = STATE_MENU;
    var elapsedTime = 0;
    var fallTimer = 0;
    var finishTimer = 0;
    var isInitialized = false;
    var lastBallResult = null;
    var currentLevelId = 'bridge';
    var currentSkinId = 'default';
    var ghostModeEnabled = false;

    function init() {
        if (isInitialized) return;
        isInitialized = true;

        var canvas = document.getElementById('game-canvas');
        var sceneData = SceneManager.init(canvas);

        GhostCar.init(SceneManager.getScene());
        TrackEditor.init(canvas, SceneManager.getScene(), SceneManager.getCamera(), SceneManager.getRenderer());
        Collectibles.init(SceneManager.getScene());

        loadLevel(currentLevelId);

        BallController.create(SceneManager.getScene(), currentSkinId);

        InputManager.init();
        UIManager.init();

        setupEventListeners();

        SceneManager.startRenderLoop(gameLoop);

        Skins.checkUnlocks(Levels.getTotalScore());
    }

    function setupEventListeners() {
        document.getElementById('btn-start').addEventListener('click', startGame);
        document.getElementById('btn-restart').addEventListener('click', restartGame);
        document.getElementById('btn-menu').addEventListener('click', backToMenu);
        document.getElementById('btn-next-level').addEventListener('click', nextLevel);

        document.getElementById('btn-resume').addEventListener('click', resumeGame);
        document.getElementById('btn-pause-restart').addEventListener('click', restartGame);
        document.getElementById('btn-pause-menu').addEventListener('click', backToMenu);

        document.getElementById('btn-open-editor').addEventListener('click', openEditor);

        document.getElementById('ghost-mode').addEventListener('change', function (e) {
            ghostModeEnabled = e.target.checked;
        });

        var menuTabs = document.querySelectorAll('.menu-tab');
        menuTabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                switchTab(this.dataset.tab);
            });
        });

        document.getElementById('leaderboard-level-select').addEventListener('change', function (e) {
            UIManager.updateLeaderboard(e.target.value);
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && gameState === STATE_PLAYING) {
                pauseGame();
            }
            if (e.key === 'Escape' && gameState === STATE_PAUSED) {
                resumeGame();
            }
        });
    }

    function switchTab(tabId) {
        document.querySelectorAll('.menu-tab').forEach(function (t) {
            t.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(function (c) {
            c.classList.add('hidden');
        });

        document.querySelector('.menu-tab[data-tab="' + tabId + '"]').classList.add('active');
        document.getElementById('tab-' + tabId).classList.remove('hidden');

        if (tabId === 'levels') {
            UIManager.updateLevelsGrid();
        } else if (tabId === 'skins') {
            UIManager.updateSkinsGrid();
        } else if (tabId === 'leaderboard') {
            UIManager.updateLeaderboardSelect();
            UIManager.updateLeaderboard(currentLevelId);
        } else if (tabId === 'editor') {
            UIManager.updateCustomLevelsList();
        } else if (tabId === 'play') {
            UIManager.updatePlayerStats();
        }
    }

    function loadLevel(levelId) {
        var level = Levels.getById(levelId);
        if (!level) return;

        currentLevelId = levelId;

        var isUnlocked = Levels.isUnlocked(levelId);
        if (!isUnlocked) {
            levelId = 'bridge';
            level = Levels.getById('bridge');
            currentLevelId = 'bridge';
        }

        SceneManager.rebuildForLevel(level);

        TrackGenerator.createCurve(level);
        TrackGenerator.buildTrack(SceneManager.getScene(), level);

        Collectibles.loadForLevel(levelId);
    }

    function loadCustomLevel(customLevel) {
        currentLevelId = customLevel.id;

        SceneManager.rebuildForLevel(customLevel);

        TrackGenerator.createCurve(customLevel);
        TrackGenerator.buildTrack(SceneManager.getScene(), customLevel);

        Collectibles.loadForLevel(customLevel.id);
    }

    function startGame() {
        gameState = STATE_PLAYING;
        elapsedTime = 0;
        fallTimer = 0;
        finishTimer = 0;
        lastBallResult = null;

        BallController.applySkin(currentSkinId);
        BallController.reset();
        if (SceneManager.getCamera()) {
            CameraController.reset();
        }
        InputManager.reset();
        Collectibles.loadForLevel(currentLevelId);

        if (ghostModeEnabled) {
            GhostCar.startReplay(currentLevelId);
        } else {
            GhostCar.stopReplay();
        }
        GhostCar.startRecording(currentLevelId);

        UIManager.hideMainMenu();
        UIManager.hideResult();
        UIManager.showHUD();
        UIManager.updateGhostStatus(ghostModeEnabled);
    }

    function restartGame() {
        GhostCar.stopRecording(false);
        startGame();
    }

    function nextLevel() {
        var levelIndex = Levels.getIndexById(currentLevelId);
        var allLevels = Levels.getAll();

        if (levelIndex < allLevels.length - 1) {
            var nextLevelId = allLevels[levelIndex + 1].id;
            if (Levels.isUnlocked(nextLevelId)) {
                currentLevelId = nextLevelId;
                loadLevel(currentLevelId);
                startGame();
            }
        }
    }

    function pauseGame() {
        if (gameState !== STATE_PLAYING) return;
        gameState = STATE_PAUSED;
        UIManager.showPauseMenu();
    }

    function resumeGame() {
        if (gameState !== STATE_PAUSED) return;
        gameState = STATE_PLAYING;
        UIManager.hidePauseMenu();
    }

    function backToMenu() {
        gameState = STATE_MENU;
        GhostCar.stopRecording(false);
        GhostCar.stopReplay();
        BallController.reset();
        if (SceneManager.getCamera()) {
            CameraController.reset();
        }
        UIManager.hidePauseMenu();
        UIManager.hideResult();
        UIManager.showMainMenu();
        UIManager.updatePlayerStats();
    }

    function openEditor() {
        gameState = STATE_EDITOR;
        UIManager.hideMainMenu();
        TrackEditor.open(null, function () {
            gameState = STATE_MENU;
            UIManager.showMainMenu();
            loadLevel(currentLevelId);
        }, function (savedLevel) {
            UIManager.updateCustomLevelsList();
        });
    }

    function gameLoop(dt) {
        if (gameState === STATE_MENU || gameState === STATE_EDITOR) {
            updateMenuCamera(dt);
            return null;
        }

        if (gameState === STATE_PAUSED) {
            return lastBallResult;
        }

        if (gameState === STATE_PLAYING) {
            return updatePlaying(dt);
        }

        if (gameState === STATE_FALLING) {
            return updateFalling(dt);
        }

        if (gameState === STATE_FINISHED) {
            return updateFinished(dt);
        }

        return null;
    }

    function updateMenuCamera(dt) {
        var time = Date.now() * 0.0003;
        var pos = TrackGenerator.getPointAt(0.1 + Math.sin(time) * 0.05);
        var tangent = TrackGenerator.getTangentAt(0.1);

        var camPos = pos.clone();
        camPos.y += 4;
        camPos.z += 8;
        camPos.x += Math.sin(time * 0.5) * 2;

        var cam = SceneManager.getCamera();
        if (cam) {
            cam.position.lerp(camPos, 0.02);
            var lookAt = pos.clone().add(tangent.clone().multiplyScalar(5));
            cam.lookAt(lookAt);
        }
        return null;
    }

    function updatePlaying(dt) {
        var inputState = InputManager.getState();
        var result = BallController.update(dt * 60, inputState);
        lastBallResult = result;

        elapsedTime += dt;

        GhostCar.update(dt);

        if (result.position) {
            Collectibles.update(dt, result.position, BallController.getRadius());
        }

        var collectStats = Collectibles.getStats();
        UIManager.updateHUD(
            elapsedTime,
            result.progress,
            BallController.getSpeedRatio(),
            collectStats.coins,
            collectStats.gems
        );

        if (result.isFalling) {
            gameState = STATE_FALLING;
            fallTimer = 0;
            GhostCar.stopRecording(false);
            InputManager.triggerHapticFeedback(0.8, 200);
        } else if (result.isFinished) {
            gameState = STATE_FINISHED;
            finishTimer = 0;
            GhostCar.stopRecording(true);
            InputManager.triggerHapticFeedback(0.5, 150);
        }

        return result;
    }

    function updateFalling(dt) {
        var result = BallController.update(dt * 60, { left: false, right: false });
        lastBallResult = result;
        fallTimer += dt;

        GhostCar.update(dt);

        if (result.fallDone || fallTimer > 2.0) {
            gameState = STATE_RESULT;

            Levels.saveLevelProgress(currentLevelId, elapsedTime, 0, false);

            var collectStats = Collectibles.getStats();
            var score = collectStats.score;
            UIManager.showResult(false, elapsedTime, 0, score, collectStats.coins, collectStats.gems);
        }

        return result;
    }

    function updateFinished(dt) {
        finishTimer += dt;

        var ballMesh = BallController.getMesh();
        if (ballMesh && lastBallResult) {
            ballMesh.position.y = lastBallResult.position.y + Math.sin(finishTimer * 8) * 0.02;
        }

        GhostCar.update(dt);

        if (finishTimer > 1.5) {
            gameState = STATE_RESULT;

            var stars = Levels.calculateStar(currentLevelId, elapsedTime);
            var progress = Levels.saveLevelProgress(currentLevelId, elapsedTime, stars, true);

            Skins.checkUnlocks(Levels.getTotalScore());

            var collectStats = Collectibles.getStats();
            var score = collectStats.score + stars * 50;

            var rank = Leaderboard.addEntry(currentLevelId, elapsedTime, stars, score);

            UIManager.showResult(true, elapsedTime, stars, score, collectStats.coins, collectStats.gems, rank);

            var levelIndex = Levels.getIndexById(currentLevelId);
            var allLevels = Levels.getAll();
            var hasNext = levelIndex < allLevels.length - 1 && Levels.isUnlocked(allLevels[levelIndex + 1].id);
            UIManager.showNextLevelButton(hasNext);
        }

        return lastBallResult;
    }

    function setCurrentLevel(levelId) {
        if (Levels.isUnlocked(levelId)) {
            currentLevelId = levelId;
            loadLevel(levelId);
        }
    }

    function setCurrentSkin(skinId) {
        if (Skins.isUnlocked(skinId)) {
            currentSkinId = skinId;
            BallController.applySkin(skinId);
        }
    }

    function getCurrentLevel() {
        return currentLevelId;
    }

    function getCurrentSkin() {
        return currentSkinId;
    }

    return {
        init: init,
        startGame: startGame,
        restartGame: restartGame,
        backToMenu: backToMenu,
        pauseGame: pauseGame,
        resumeGame: resumeGame,
        setCurrentLevel: setCurrentLevel,
        setCurrentSkin: setCurrentSkin,
        getCurrentLevel: getCurrentLevel,
        getCurrentSkin: getCurrentSkin,
        loadCustomLevel: loadCustomLevel,
        openEditor: openEditor
    };
})();

window.addEventListener('DOMContentLoaded', function () {
    Game.init();
});

