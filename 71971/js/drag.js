var CircuitGame = window.CircuitGame || {};

CircuitGame.DragManager = function(canvas, grid, renderer, onAction) {
    this.canvas = canvas;
    this.grid = grid;
    this.renderer = renderer;
    this.onAction = onAction || function() {};
    this.selectedTool = null;
    this.selectedRotation = 0;
    this.isDragging = false;
    this.disabled = false;
    this._bound = {};
    this.bindEvents();
};

CircuitGame.DragManager.prototype.setEnabled = function(enabled) {
    this.disabled = !enabled;
    if (this.disabled) {
        this.renderer.hoverCell = null;
        this.renderer.ghostComponent = null;
    }
};

CircuitGame.DragManager.prototype.bindEvents = function() {
    var self = this;

    this._bound.mouseDown = function(e) { if (!self.disabled) self.handleMouseDown(e); };
    this._bound.mouseMove = function(e) { if (!self.disabled) self.handleMouseMove(e); };
    this._bound.mouseUp = function(e) { if (!self.disabled) self.handleMouseUp(e); };
    this._bound.mouseLeave = function() { if (!self.disabled) self.renderer.hoverCell = null; };
    this._bound.touchStart = function(e) {
        if (self.disabled) return;
        e.preventDefault();
        self.handleMouseDown(self.touchToMouse(e.touches[0]));
    };
    this._bound.touchMove = function(e) {
        if (self.disabled) return;
        e.preventDefault();
        self.handleMouseMove(self.touchToMouse(e.touches[0]));
    };
    this._bound.touchEnd = function(e) {
        if (self.disabled) return;
        e.preventDefault();
        self.handleMouseUp({});
    };
    this._bound.keyDown = function(e) { if (!self.disabled) self.handleKeyDown(e); };

    this.canvas.addEventListener("mousedown", this._bound.mouseDown);
    this.canvas.addEventListener("mousemove", this._bound.mouseMove);
    this.canvas.addEventListener("mouseup", this._bound.mouseUp);
    this.canvas.addEventListener("mouseleave", this._bound.mouseLeave);
    this.canvas.addEventListener("touchstart", this._bound.touchStart, { passive: false });
    this.canvas.addEventListener("touchmove", this._bound.touchMove, { passive: false });
    this.canvas.addEventListener("touchend", this._bound.touchEnd, { passive: false });
    document.addEventListener("keydown", this._bound.keyDown);
};

CircuitGame.DragManager.prototype.destroy = function() {
    if (!this._bound.mouseDown) return;
    this.canvas.removeEventListener("mousedown", this._bound.mouseDown);
    this.canvas.removeEventListener("mousemove", this._bound.mouseMove);
    this.canvas.removeEventListener("mouseup", this._bound.mouseUp);
    this.canvas.removeEventListener("mouseleave", this._bound.mouseLeave);
    this.canvas.removeEventListener("touchstart", this._bound.touchStart);
    this.canvas.removeEventListener("touchmove", this._bound.touchMove);
    this.canvas.removeEventListener("touchend", this._bound.touchEnd);
    document.removeEventListener("keydown", this._bound.keyDown);
    this._bound = {};
};

CircuitGame.DragManager.prototype.touchToMouse = function(touch) {
    var rect = this.canvas.getBoundingClientRect();
    return {
        clientX: touch.clientX,
        clientY: touch.clientY,
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top
    };
};

CircuitGame.DragManager.prototype.getCanvasPos = function(e) {
    var rect = this.canvas.getBoundingClientRect();
    var scaleX = (this.canvas.width / (window.devicePixelRatio || 1)) / rect.width;
    var scaleY = (this.canvas.height / (window.devicePixelRatio || 1)) / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
};

CircuitGame.DragManager.prototype.handleMouseDown = function(e) {
    var pos = this.getCanvasPos(e);
    var cell = this.renderer.getCellFromPos(pos.x, pos.y);
    if (!cell) return;

    var comp = this.grid.getComponent(cell.row, cell.col);

    if (this.selectedTool) {
        if (!comp) {
            var placed = this.grid.placeComponent(
                cell.row, cell.col,
                this.selectedTool,
                this.selectedRotation,
                false,
                this.selectedTool === "switch" ? "off" : "off"
            );
            if (placed) {
                this.onAction("place", { row: cell.row, col: cell.col, type: this.selectedTool });
            }
        } else if (comp.type === "switch") {
            this.grid.toggleSwitch(cell.row, cell.col);
            this.onAction("toggle", { row: cell.row, col: cell.col });
        } else if (!comp.fixed) {
            this.grid.selectCell(cell.row, cell.col);
            this.onAction("select", { row: cell.row, col: cell.col });
        }
    } else {
        if (comp) {
            if (comp.type === "switch") {
                this.grid.toggleSwitch(cell.row, cell.col);
                this.onAction("toggle", { row: cell.row, col: cell.col });
            } else {
                this.grid.selectCell(cell.row, cell.col);
                this.onAction("select", { row: cell.row, col: cell.col });
            }
        } else {
            this.grid.selectedCell = null;
        }
    }
};

CircuitGame.DragManager.prototype.handleMouseMove = function(e) {
    var pos = this.getCanvasPos(e);
    var cell = this.renderer.getCellFromPos(pos.x, pos.y);
    this.renderer.hoverCell = cell;

    if (this.selectedTool && cell) {
        this.renderer.ghostComponent = this.selectedTool;
        this.renderer.ghostRotation = this.selectedRotation;
    } else {
        this.renderer.ghostComponent = null;
    }
};

CircuitGame.DragManager.prototype.handleMouseUp = function(e) {
    this.isDragging = false;
};

CircuitGame.DragManager.prototype.handleKeyDown = function(e) {
    var sel = this.grid.selectedCell;
    if (!sel) return;

    switch (e.key) {
        case "r":
        case "R":
            this.grid.rotateComponent(sel.row, sel.col);
            this.onAction("rotate", { row: sel.row, col: sel.col });
            break;
        case "Delete":
        case "Backspace":
            var removed = this.grid.removeComponent(sel.row, sel.col);
            if (removed) {
                this.onAction("remove", { row: sel.row, col: sel.col, type: removed.type });
            }
            break;
        case "Escape":
            this.grid.selectedCell = null;
            this.setSelectedTool(null);
            break;
    }
};

CircuitGame.DragManager.prototype.setSelectedTool = function(type) {
    this.selectedTool = type;
    this.selectedRotation = 0;
    this.renderer.ghostComponent = null;
    this.renderer.hoverCell = null;

    if (type) {
        this.grid.selectedCell = null;
    }
};

CircuitGame.DragManager.prototype.rotateSelectedTool = function() {
    if (this.selectedTool) {
        this.selectedRotation = (this.selectedRotation + 90) % 360;
        this.renderer.ghostRotation = this.selectedRotation;
        return;
    }

    var sel = this.grid.selectedCell;
    if (sel) {
        this.grid.rotateComponent(sel.row, sel.col);
        this.onAction("rotate", { row: sel.row, col: sel.col });
    }
};

CircuitGame.DragManager.prototype.deleteSelected = function() {
    var sel = this.grid.selectedCell;
    if (sel) {
        var removed = this.grid.removeComponent(sel.row, sel.col);
        if (removed) {
            this.onAction("remove", { row: sel.row, col: sel.col, type: removed.type });
        }
    }
};
