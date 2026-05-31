var CircuitGame = window.CircuitGame || {};

(function() {
    var levelManager = null;

    function showScreen(id) {
        var screens = document.querySelectorAll(".screen");
        for (var i = 0; i < screens.length; i++) {
            screens[i].classList.remove("active");
        }
        document.getElementById(id).classList.add("active");
    }

    function renderLevelSelect() {
        var grid = document.getElementById("level-grid");
        grid.innerHTML = "";

        for (var i = 0; i < CircuitGame.LEVELS.length; i++) {
            var level = CircuitGame.LEVELS[i];
            var unlocked = levelManager.isLevelUnlocked(level.id);
            var stars = levelManager.levelResults[level.id] || 0;

            var card = document.createElement("div");
            card.className = "level-card" +
                (unlocked ? "" : " locked") +
                (stars > 0 ? " completed" : "");

            if (unlocked) {
                var num = document.createElement("div");
                num.className = "level-number";
                num.textContent = level.id;
                card.appendChild(num);

                var name = document.createElement("div");
                name.className = "level-card-name";
                name.textContent = level.name;
                card.appendChild(name);

                var starsDiv = document.createElement("div");
                starsDiv.className = "level-card-stars";
                for (var s = 0; s < 3; s++) {
                    var star = document.createElement("span");
                    star.className = "star" + (s < stars ? " filled" : "");
                    star.textContent = "★";
                    starsDiv.appendChild(star);
                }
                card.appendChild(starsDiv);
            } else {
                var lock = document.createElement("div");
                lock.className = "lock-icon";
                lock.textContent = "🔒";
                card.appendChild(lock);

                var lname = document.createElement("div");
                lname.className = "level-card-name";
                lname.textContent = level.name;
                card.appendChild(lname);
            }

            (function(lid) {
                card.addEventListener("click", function() {
                    if (!levelManager.isLevelUnlocked(lid)) return;
                    startLevel(lid);
                });
            })(level.id);

            grid.appendChild(card);
        }
    }

    function startLevel(levelId) {
        if (levelManager) {
            levelManager.destroy();
        }
        levelManager = new CircuitGame.LevelManager();
        levelManager.loadLevel(levelId);
        showScreen("game-screen");
        bindGameButtons();
    }

    function isOverlayVisible() {
        return !document.getElementById("level-complete-overlay").classList.contains("hidden");
    }

    function bindGameButtons() {
        document.getElementById("btn-back").onclick = function() {
            if (levelManager) levelManager.destroy();
            levelManager = null;
            showScreen("level-select-screen");
            renderLevelSelect();
        };

        document.getElementById("btn-rotate").onclick = function() {
            if (isOverlayVisible()) return;
            if (levelManager && levelManager.dragManager) {
                levelManager.dragManager.rotateSelectedTool();
                levelManager.runCircuitDetection();
            }
        };

        document.getElementById("btn-delete").onclick = function() {
            if (isOverlayVisible()) return;
            if (levelManager && levelManager.dragManager) {
                levelManager.dragManager.deleteSelected();
                levelManager.updateUI();
                levelManager.runCircuitDetection();
            }
        };

        document.getElementById("btn-reset").onclick = function() {
            if (isOverlayVisible()) return;
            if (levelManager) {
                levelManager.resetLevel();
            }
        };

        document.getElementById("btn-hint").onclick = function() {
            if (isOverlayVisible()) return;
            if (levelManager) {
                levelManager.showHint();
            }
        };

        document.getElementById("btn-next-level").onclick = function() {
            if (levelManager) {
                levelManager.goToNextLevel();
            }
        };

        document.getElementById("btn-replay").onclick = function() {
            if (levelManager) {
                levelManager.hideCompleteOverlay();
                levelManager.resetLevel();
            }
        };

        document.getElementById("btn-levels").onclick = function() {
            if (levelManager) {
                levelManager.destroy();
                levelManager = null;
            }
            showScreen("level-select-screen");
            renderLevelSelect();
        };
    }

    function init() {
        levelManager = new CircuitGame.LevelManager();
        showScreen("level-select-screen");
        renderLevelSelect();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
