var CircuitGame = window.CircuitGame || {};

CircuitGame.LevelManager = function() {
    this.currentLevel = null;
    this.grid = null;
    this.circuitDetector = null;
    this.renderer = null;
    this.dragManager = null;
    this.inventory = {};
    this.moveCount = 0;
    this.levelResults = {};
    this.hintIndex = {};
    this.faultTimeout = null;

    this.loadProgress();
};

CircuitGame.LevelManager.prototype.loadLevel = function(levelId) {
    var levelData = null;
    for (var i = 0; i < CircuitGame.LEVELS.length; i++) {
        if (CircuitGame.LEVELS[i].id === levelId) {
            levelData = CircuitGame.LEVELS[i];
            break;
        }
    }
    if (!levelData) return false;

    if (this._completeTimeout) {
        clearTimeout(this._completeTimeout);
        this._completeTimeout = null;
    }

    if (this.renderer) this.renderer.stop();
    if (this.dragManager) this.dragManager.destroy();

    this.currentLevel = levelData;
    this.moveCount = 0;
    this.hintIndex[levelId] = this.hintIndex[levelId] || 0;
    this.levelComplete = false;

    this.grid = new CircuitGame.GridManager(levelData.gridRows, levelData.gridCols);

    for (var i = 0; i < levelData.fixedComponents.length; i++) {
        var fc = levelData.fixedComponents[i];
        this.grid.placeComponent(fc.row, fc.col, fc.type, fc.rotation, true, fc.state || "off");
    }

    this.inventory = {};
    for (var j = 0; j < levelData.availableComponents.length; j++) {
        var ac = levelData.availableComponents[j];
        this.inventory[ac.type] = ac.count;
    }

    this.circuitDetector = new CircuitGame.CircuitDetector(this.grid);

    var canvas = document.getElementById("game-canvas");
    this.renderer = new CircuitGame.Renderer(canvas, this.grid);

    this.dragManager = new CircuitGame.DragManager(canvas, this.grid, this.renderer, this.handleAction.bind(this));

    this.updateUI();
    this.runCircuitDetection();

    this.renderer.start();

    return true;
};

CircuitGame.LevelManager.prototype.handleAction = function(action, data) {
    switch (action) {
        case "place":
            if (this.inventory[data.type] !== undefined && this.inventory[data.type] > 0) {
                this.inventory[data.type]--;
                this.moveCount++;
            } else {
                this.grid.removeComponent(data.row, data.col);
            }
            this.dragManager.setSelectedTool(null);
            break;
        case "remove":
            if (this.inventory[data.type] !== undefined) {
                this.inventory[data.type]++;
            }
            this.moveCount++;
            break;
        case "rotate":
            this.moveCount++;
            break;
        case "toggle":
            break;
        case "select":
            break;
    }

    this.updateUI();
    this.runCircuitDetection();
};

CircuitGame.LevelManager.prototype.runCircuitDetection = function() {
    if (!this.circuitDetector) return;
    var result = this.circuitDetector.detect();

    this.renderer.shortCircuit = result.shortCircuit;

    if (result.shortCircuit) {
        this.showFault("短路！电流未经过负载直接回路");
    } else {
        this.hideFault();
    }

    if (result.bulbsTotal > 0 && result.bulbsLit === result.bulbsTotal && !this.levelComplete) {
        this.levelComplete = true;
        this._completeTimeout = setTimeout(function() {
            this.onLevelComplete(result);
        }.bind(this), 500);
    }
};

CircuitGame.LevelManager.prototype.onLevelComplete = function(result) {
    var stars = this.calculateStars();
    var levelId = this.currentLevel.id;

    if (!this.levelResults[levelId] || this.levelResults[levelId] < stars) {
        this.levelResults[levelId] = stars;
        this.saveProgress();
    }

    this.showCompleteOverlay(stars);
};

CircuitGame.LevelManager.prototype.calculateStars = function() {
    if (!this.currentLevel.starThresholds) return 3;
    var thresholds = this.currentLevel.starThresholds.moves;
    if (this.moveCount <= thresholds[0]) return 3;
    if (this.moveCount <= thresholds[1]) return 2;
    return 1;
};

CircuitGame.LevelManager.prototype.resetLevel = function() {
    if (this.currentLevel) {
        this.loadLevel(this.currentLevel.id);
    }
};

CircuitGame.LevelManager.prototype.showHint = function() {
    if (!this.currentLevel || !this.currentLevel.hints) return;
    var idx = this.hintIndex[this.currentLevel.id] || 0;
    var hint = this.currentLevel.hints[idx % this.currentLevel.hints.length];
    this.hintIndex[this.currentLevel.id] = idx + 1;

    var el = document.getElementById("canvas-hint");
    el.textContent = hint;
    el.classList.remove("hidden");
    setTimeout(function() {
        el.classList.add("hidden");
    }, 4000);
};

CircuitGame.LevelManager.prototype.updateUI = function() {
    if (!this.currentLevel) return;

    document.getElementById("level-name").textContent = this.currentLevel.name;
    document.getElementById("level-desc").textContent = this.currentLevel.description;

    this.updateComponentSidebar();
    this.updateStarDisplay();
};

CircuitGame.LevelManager.prototype.updateComponentSidebar = function() {
    var list = document.getElementById("component-list");
    list.innerHTML = "";

    var self = this;
    var types = Object.keys(this.inventory);
    for (var i = 0; i < types.length; i++) {
        var type = types[i];
        var count = this.inventory[type];
        var typeDef = CircuitGame.COMPONENT_TYPES[type];

        var item = document.createElement("div");
        item.className = "component-item" + (count <= 0 ? " depleted" : "");
        item.dataset.type = type;

        var iconDiv = document.createElement("div");
        iconDiv.className = "component-icon";
        var previewCanvas = document.createElement("canvas");
        iconDiv.appendChild(previewCanvas);
        item.appendChild(iconDiv);

        var label = document.createElement("div");
        label.className = "component-label";
        label.textContent = typeDef ? typeDef.label : type;
        item.appendChild(label);

        var countBadge = document.createElement("div");
        countBadge.className = "component-count";
        countBadge.textContent = count;
        item.appendChild(countBadge);

        (function(t) {
            item.addEventListener("click", function() {
                if (self.inventory[t] <= 0) return;
                var currentTool = self.dragManager.selectedTool;
                if (currentTool === t) {
                    self.dragManager.setSelectedTool(null);
                } else {
                    self.dragManager.setSelectedTool(t);
                }
                self.updateSidebarSelection();
            });
        })(type);

        list.appendChild(item);
    }

    this.renderSidebarPreviews();
    this.updateSidebarSelection();
};

CircuitGame.LevelManager.prototype.renderSidebarPreviews = function() {
    var items = document.querySelectorAll(".component-item");
    for (var i = 0; i < items.length; i++) {
        var type = items[i].dataset.type;
        var previewCanvas = items[i].querySelector("canvas");
        if (previewCanvas && this.renderer) {
            var typeDef = CircuitGame.COMPONENT_TYPES[type];
            var rot = 0;
            if (type === "wire-corner") rot = 0;
            if (type === "wire-t") rot = 0;
            this.renderer.drawComponentPreview(previewCanvas, type, rot);
        }
    }
};

CircuitGame.LevelManager.prototype.updateSidebarSelection = function() {
    var selectedTool = this.dragManager ? this.dragManager.selectedTool : null;
    var items = document.querySelectorAll(".component-item");
    for (var i = 0; i < items.length; i++) {
        if (items[i].dataset.type === selectedTool) {
            items[i].classList.add("selected");
        } else {
            items[i].classList.remove("selected");
        }
    }
};

CircuitGame.LevelManager.prototype.updateStarDisplay = function() {
    var display = document.getElementById("star-display");
    var existingResult = this.levelResults[this.currentLevel.id] || 0;
    display.innerHTML = "";
    for (var i = 0; i < 3; i++) {
        var star = document.createElement("span");
        star.className = "star" + (i < existingResult ? " filled" : "");
        star.textContent = "★";
        display.appendChild(star);
    }
};

CircuitGame.LevelManager.prototype.showFault = function(message) {
    var el = document.getElementById("fault-alert");
    document.getElementById("fault-message").textContent = message;
    el.classList.remove("hidden");

    var self = this;
    clearTimeout(this.faultTimeout);
    this.faultTimeout = setTimeout(function() {
        self.hideFault();
    }, 3000);
};

CircuitGame.LevelManager.prototype.hideFault = function() {
    document.getElementById("fault-alert").classList.add("hidden");
};

CircuitGame.LevelManager.prototype.showCompleteOverlay = function(stars) {
    var overlay = document.getElementById("level-complete-overlay");
    overlay.classList.remove("hidden");

    if (this.dragManager) {
        this.dragManager.setEnabled(false);
    }

    var starsDiv = document.getElementById("complete-stars");
    starsDiv.innerHTML = "";
    for (var i = 0; i < 3; i++) {
        var star = document.createElement("span");
        star.className = "star" + (i < stars ? " filled" : "");
        star.textContent = "★";
        starsDiv.appendChild(star);
    }

    document.getElementById("complete-message").textContent =
        "用了 " + this.moveCount + " 步完成";

    var hasNext = false;
    for (var j = 0; j < CircuitGame.LEVELS.length; j++) {
        if (CircuitGame.LEVELS[j].id === this.currentLevel.id + 1) {
            hasNext = true;
            break;
        }
    }
    document.getElementById("btn-next-level").style.display = hasNext ? "" : "none";
};

CircuitGame.LevelManager.prototype.hideCompleteOverlay = function() {
    document.getElementById("level-complete-overlay").classList.add("hidden");
    if (this.dragManager) {
        this.dragManager.setEnabled(true);
    }
};

CircuitGame.LevelManager.prototype.goToNextLevel = function() {
    this.hideCompleteOverlay();
    if (this.currentLevel) {
        var nextId = this.currentLevel.id + 1;
        var exists = false;
        for (var i = 0; i < CircuitGame.LEVELS.length; i++) {
            if (CircuitGame.LEVELS[i].id === nextId) { exists = true; break; }
        }
        if (exists) {
            this.loadLevel(nextId);
        }
    }
};

CircuitGame.LevelManager.prototype.isLevelUnlocked = function(levelId) {
    if (levelId <= 1) return true;
    return !!this.levelResults[levelId - 1];
};

CircuitGame.LevelManager.prototype.loadProgress = function() {
    try {
        var saved = localStorage.getItem("circuitGame_results");
        if (saved) {
            this.levelResults = JSON.parse(saved);
        }
    } catch (e) {
        this.levelResults = {};
    }
};

CircuitGame.LevelManager.prototype.saveProgress = function() {
    try {
        localStorage.setItem("circuitGame_results", JSON.stringify(this.levelResults));
    } catch (e) {}
};

CircuitGame.LevelManager.prototype.destroy = function() {
    if (this._completeTimeout) {
        clearTimeout(this._completeTimeout);
        this._completeTimeout = null;
    }
    if (this.renderer) {
        this.renderer.stop();
    }
    if (this.dragManager) {
        this.dragManager.destroy();
    }
};
