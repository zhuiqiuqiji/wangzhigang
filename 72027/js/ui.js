var UIManager = (function () {
    var hudEl = null;
    var timerEl = null;
    var progressFill = null;
    var progressText = null;
    var speedFill = null;
    var coinsValueEl = null;
    var gemsValueEl = null;
    var ghostStatusEl = null;
    var mainMenu = null;
    var resultScreen = null;
    var resultTitle = null;
    var resultStars = null;
    var resultTime = null;
    var resultRank = null;
    var resultCoins = null;
    var resultGems = null;
    var btnNextLevel = null;
    var bestRecordEl = null;
    var bestTimeEl = null;
    var bestStarsEl = null;
    var mobileControls = null;
    var pauseMenu = null;
    var totalStarsEl = null;
    var totalScoreEl = null;

    function init() {
        hudEl = document.getElementById('hud');
        timerEl = document.getElementById('timer-value');
        progressFill = document.getElementById('progress-fill');
        progressText = document.getElementById('progress-text');
        speedFill = document.getElementById('speed-fill');
        coinsValueEl = document.getElementById('coins-value');
        gemsValueEl = document.getElementById('gems-value');
        ghostStatusEl = document.getElementById('hud-ghost');
        mainMenu = document.getElementById('main-menu');
        resultScreen = document.getElementById('result-screen');
        resultTitle = document.getElementById('result-title');
        resultStars = document.getElementById('result-stars');
        resultTime = document.getElementById('result-time');
        resultRank = document.getElementById('result-rank');
        resultCoins = document.getElementById('result-coins');
        resultGems = document.getElementById('result-gems');
        btnNextLevel = document.getElementById('btn-next-level');
        bestRecordEl = document.getElementById('best-record');
        bestTimeEl = document.getElementById('best-time');
        bestStarsEl = document.getElementById('best-stars');
        mobileControls = document.getElementById('mobile-controls');
        pauseMenu = document.getElementById('pause-menu');
        totalStarsEl = document.getElementById('total-stars');
        totalScoreEl = document.getElementById('total-score');

        showBestRecord();
        updatePlayerStats();
    }

    function showBestRecord() {
        var record = GameUtils.loadBestRecord();
        if (record) {
            bestRecordEl.classList.remove('hidden');
            bestTimeEl.textContent = GameUtils.formatTime(record.time);
            bestStarsEl.textContent = getStarString(record.stars);
        } else {
            bestRecordEl.classList.add('hidden');
        }
    }

    function getStarString(count) {
        var str = '';
        for (var i = 0; i < 3; i++) {
            str += i < count ? '★' : '☆';
        }
        return str;
    }

    function showHUD() {
        hudEl.classList.remove('hidden');
        if (isTouchDevice()) {
            mobileControls.classList.remove('hidden');
        }
    }

    function hideHUD() {
        hudEl.classList.add('hidden');
        mobileControls.classList.add('hidden');
    }

    function updateHUD(time, progress, speedRatio, coins, gems) {
        if (timerEl) timerEl.textContent = GameUtils.formatTime(time);
        if (progressFill) progressFill.style.width = (progress * 100) + '%';
        if (progressText) progressText.textContent = Math.floor(progress * 100) + '%';
        if (speedFill) speedFill.style.width = (speedRatio * 100) + '%';
        if (coinsValueEl) coinsValueEl.textContent = coins || 0;
        if (gemsValueEl) gemsValueEl.textContent = gems || 0;
    }

    function updateGhostStatus(enabled) {
        if (ghostStatusEl) {
            if (enabled) {
                ghostStatusEl.classList.remove('hidden');
            } else {
                ghostStatusEl.classList.add('hidden');
            }
        }
    }

    function showMainMenu() {
        mainMenu.classList.remove('hidden');
        mainMenu.style.display = 'flex';
        resultScreen.classList.add('hidden');
        hideHUD();
        hidePauseMenu();
        showBestRecord();
        updatePlayerStats();
    }

    function hideMainMenu() {
        mainMenu.classList.add('hidden');
    }

    function showPauseMenu() {
        if (pauseMenu) pauseMenu.classList.remove('hidden');
    }

    function hidePauseMenu() {
        if (pauseMenu) pauseMenu.classList.add('hidden');
    }

    function showResult(win, time, stars, score, coins, gems, rank) {
        resultScreen.classList.remove('hidden');

        if (win) {
            resultTitle.textContent = '通关成功';
            resultTitle.className = 'win';
            resultTitle.id = 'result-title';
        } else {
            resultTitle.textContent = '挑战失败';
            resultTitle.className = 'fail';
            resultTitle.id = 'result-title';
        }

        resultStars.innerHTML = '';
        for (var i = 0; i < 3; i++) {
            var starSpan = document.createElement('span');
            starSpan.className = 'star';
            starSpan.textContent = '★';
            starSpan.dataset.index = i;
            resultStars.appendChild(starSpan);
        }

        animateStars(win ? stars : 0);

        resultTime.textContent = win ? GameUtils.formatTime(time) : '未完成';

        if (resultCoins) resultCoins.textContent = coins || 0;
        if (resultGems) resultGems.textContent = gems || 0;

        if (resultRank && win && rank) {
            resultRank.classList.remove('hidden');
            resultRank.textContent = Leaderboard.formatRank(rank);
        } else if (resultRank) {
            resultRank.classList.add('hidden');
        }

        hideHUD();
    }

    function showNextLevelButton(show) {
        if (btnNextLevel) {
            if (show) {
                btnNextLevel.classList.remove('hidden');
            } else {
                btnNextLevel.classList.add('hidden');
            }
        }
    }

    var starAnimFrameId = null;

    function animateStars(activeCount) {
        if (starAnimFrameId) {
            cancelAnimationFrame(starAnimFrameId);
            starAnimFrameId = null;
        }

        var starEls = resultStars.querySelectorAll('.star');
        if (!starEls.length) return;

        var startTime = performance.now();
        var delays = [];
        for (var i = 0; i < starEls.length; i++) {
            delays.push(200 + i * 300);
        }

        var triggered = [false, false, false];

        function tick(now) {
            var elapsed = now - startTime;
            var allDone = true;

            for (var i = 0; i < starEls.length; i++) {
                if (triggered[i]) continue;

                if (elapsed >= delays[i]) {
                    triggered[i] = true;
                    var el = starEls[i];
                    if (i < activeCount) {
                        el.classList.add('active');
                    } else {
                        el.classList.add('inactive');
                    }
                } else {
                    allDone = false;
                }
            }

            if (!allDone) {
                starAnimFrameId = requestAnimationFrame(tick);
            } else {
                starAnimFrameId = null;
            }
        }

        starAnimFrameId = requestAnimationFrame(tick);
    }

    function hideResult() {
        resultScreen.classList.add('hidden');
        if (starAnimFrameId) {
            cancelAnimationFrame(starAnimFrameId);
            starAnimFrameId = null;
        }
    }

    function isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    function updatePlayerStats() {
        if (totalStarsEl) totalStarsEl.textContent = Levels.getTotalStars();
        if (totalScoreEl) totalScoreEl.textContent = Levels.getTotalScore();
    }

    function updateLevelsGrid() {
        var grid = document.getElementById('levels-grid');
        if (!grid) return;

        grid.innerHTML = '';

        var allLevels = Levels.getAll();
        for (var i = 0; i < allLevels.length; i++) {
            var level = allLevels[i];
            var isUnlocked = Levels.isUnlocked(level.id);
            var progress = Levels.getLevelProgress(level.id);

            var card = document.createElement('div');
            card.className = 'level-card' + (isUnlocked ? '' : ' locked');
            card.dataset.levelId = level.id;

            var difficultyStars = '';
            for (var d = 0; d < level.difficulty; d++) {
                difficultyStars += '★';
            }

            card.innerHTML = '\
                <div class="level-header">\
                    <span class="level-name">' + level.name + '</span>\
                    <span class="level-difficulty">' + difficultyStars + '</span>\
                </div>\
                <div class="level-desc">' + (level.description || '') + '</div>\
                <div class="level-stars">' + getStarString(progress.bestStars) + '</div>\
                <div class="level-time">' + (progress.bestTime ? GameUtils.formatTime(progress.bestTime) : '--') + '</div>\
                ' + (isUnlocked ? '' : '<div class="lock-overlay">🔒</div><div class="unlock-condition">' + (level.unlockCondition || '') + '</div>') + '\
            ';

            if (isUnlocked) {
                card.addEventListener('click', function () {
                    Game.setCurrentLevel(this.dataset.levelId);
                    Game.startGame();
                });
            }

            grid.appendChild(card);
        }

        var customLevels = TrackEditor.getCustomLevels();
        for (var j = 0; j < customLevels.length; j++) {
            var customLevel = customLevels[j];

            var customCard = document.createElement('div');
            customCard.className = 'level-card custom';
            customCard.dataset.levelId = customLevel.id;

            customCard.innerHTML = '\
                <div class="level-header">\
                    <span class="level-name">' + (customLevel.name || '自定义轨道') + '</span>\
                    <span class="level-difficulty">✎</span>\
                </div>\
                <div class="level-desc">' + (customLevel.description || '用户自定义轨道') + '</div>\
                <button class="delete-custom-level" data-id="' + customLevel.id + '">删除</button>\
            ';

            customCard.addEventListener('click', function (e) {
                if (e.target.classList.contains('delete-custom-level')) {
                    e.stopPropagation();
                    TrackEditor.deleteCustomLevel(this.dataset.levelId);
                    updateLevelsGrid();
                } else {
                    Game.loadCustomLevel(customLevel);
                    Game.startGame();
                }
            });

            grid.appendChild(customCard);
        }
    }

    function updateSkinsGrid() {
        var grid = document.getElementById('skins-grid');
        if (!grid) return;

        grid.innerHTML = '';

        var allSkins = Skins.getAll();
        for (var i = 0; i < allSkins.length; i++) {
            var skin = allSkins[i];
            var isUnlocked = Skins.isUnlocked(skin.id);
            var isSelected = Game.getCurrentSkin() === skin.id;

            var card = document.createElement('div');
            card.className = 'skin-card' + (isUnlocked ? '' : ' locked') + (isSelected ? ' selected' : '');
            card.dataset.skinId = skin.id;

            var colorHex = '#' + skin.color.toString(16).padStart(6, '0');

            card.innerHTML = '\
                <div class="skin-preview" style="background: radial-gradient(circle at 30% 30%, ' + colorHex + ', #000);"></div>\
                <div class="skin-name">' + skin.name + '</div>\
                <div class="skin-stats">\
                    <div class="stat"><span>质量</span><div class="stat-bar"><div class="stat-fill" style="width:' + (skin.mass / 1.5 * 100) + '%"></div></div></div>\
                    <div class="stat"><span>摩擦</span><div class="stat-bar"><div class="stat-fill" style="width:' + (skin.friction / 0.9 * 100) + '%"></div></div></div>\
                    <div class="stat"><span>弹跳</span><div class="stat-bar"><div class="stat-fill" style="width:' + (skin.bounce / 0.8 * 100) + '%"></div></div></div>\
                    <div class="stat"><span>速度</span><div class="stat-bar"><div class="stat-fill" style="width:' + ((skin.speedMultiplier - 0.8) / 0.4 * 100) + '%"></div></div></div>\
                </div>\
                ' + (isUnlocked ? '' : '<div class="lock-overlay">🔒</div><div class="unlock-condition">' + (skin.unlockCondition || '') + '</div>') + '\
                ' + (isSelected ? '<div class="selected-badge">✓ 使用中</div>' : '') + '\
            ';

            if (isUnlocked) {
                card.addEventListener('click', function () {
                    Game.setCurrentSkin(this.dataset.skinId);
                    updateSkinsGrid();
                });
            }

            grid.appendChild(card);
        }
    }

    function updateLeaderboardSelect() {
        var select = document.getElementById('leaderboard-level-select');
        if (!select) return;

        select.innerHTML = '';

        var allLevels = Levels.getAll();
        for (var i = 0; i < allLevels.length; i++) {
            var option = document.createElement('option');
            option.value = allLevels[i].id;
            option.textContent = allLevels[i].name;
            select.appendChild(option);
        }
    }

    function updateLeaderboard(levelId) {
        var list = document.getElementById('leaderboard-list');
        if (!list) return;

        var entries = Leaderboard.getByLevel(levelId);

        if (entries.length === 0) {
            list.innerHTML = '<div class="empty-leaderboard">暂无记录，成为第一个挑战者吧！</div>';
            return;
        }

        list.innerHTML = '';

        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            var item = document.createElement('div');
            item.className = 'leaderboard-item';

            var rankIcon = '';
            if (i === 0) rankIcon = '🥇';
            else if (i === 1) rankIcon = '🥈';
            else if (i === 2) rankIcon = '🥉';
            else rankIcon = (i + 1);

            item.innerHTML = '\
                <span class="rank">' + rankIcon + '</span>\
                <span class="name">' + entry.name + '</span>\
                <span class="time">' + GameUtils.formatTime(entry.time) + '</span>\
                <span class="stars">' + getStarString(entry.stars) + '</span>\
            ';

            list.appendChild(item);
        }
    }

    function updateCustomLevelsList() {
        var list = document.getElementById('custom-levels-list');
        if (!list) return;

        var customLevels = TrackEditor.getCustomLevels();

        if (customLevels.length === 0) {
            list.innerHTML = '<div class="empty-custom">还没有自定义轨道，快去创建吧！</div>';
            return;
        }

        list.innerHTML = '';

        for (var i = 0; i < customLevels.length; i++) {
            var level = customLevels[i];
            var item = document.createElement('div');
            item.className = 'custom-level-item';
            item.dataset.levelId = level.id;

            item.innerHTML = '\
                <span class="level-name">' + (level.name || '自定义轨道') + '</span>\
                <div class="custom-level-actions">\
                    <button class="play-custom" data-id="' + level.id + '">▶</button>\
                    <button class="delete-custom" data-id="' + level.id + '">🗑️</button>\
                </div>\
            ';

            list.appendChild(item);
        }

        list.querySelectorAll('.play-custom').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var id = this.dataset.id;
                var customLevels = TrackEditor.getCustomLevels();
                var level = customLevels.find(function (l) { return l.id === id; });
                if (level) {
                    Game.loadCustomLevel(level);
                    Game.startGame();
                }
            });
        });

        list.querySelectorAll('.delete-custom').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                TrackEditor.deleteCustomLevel(this.dataset.id);
                updateCustomLevelsList();
            });
        });
    }

    return {
        init: init,
        showHUD: showHUD,
        hideHUD: hideHUD,
        updateHUD: updateHUD,
        updateGhostStatus: updateGhostStatus,
        showMainMenu: showMainMenu,
        hideMainMenu: hideMainMenu,
        showPauseMenu: showPauseMenu,
        hidePauseMenu: hidePauseMenu,
        showResult: showResult,
        hideResult: hideResult,
        showNextLevelButton: showNextLevelButton,
        updatePlayerStats: updatePlayerStats,
        updateLevelsGrid: updateLevelsGrid,
        updateSkinsGrid: updateSkinsGrid,
        updateLeaderboardSelect: updateLeaderboardSelect,
        updateLeaderboard: updateLeaderboard,
        updateCustomLevelsList: updateCustomLevelsList
    };
})();
