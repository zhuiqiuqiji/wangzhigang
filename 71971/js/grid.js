var CircuitGame = window.CircuitGame || {};

CircuitGame.GridManager = function(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.cells = [];
    this.selectedCell = null;
    this.init();
};

CircuitGame.GridManager.prototype.init = function() {
    this.cells = [];
    for (var r = 0; r < this.rows; r++) {
        this.cells[r] = [];
        for (var c = 0; c < this.cols; c++) {
            this.cells[r][c] = null;
        }
    }
    this.selectedCell = null;
};

CircuitGame.GridManager.prototype.placeComponent = function(row, col, type, rotation, fixed, state) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return false;
    if (this.cells[row][col] !== null) return false;

    var typeDef = CircuitGame.COMPONENT_TYPES[type];
    if (!typeDef) return false;

    this.cells[row][col] = {
        type: type,
        rotation: rotation || 0,
        fixed: !!fixed,
        state: state || "off",
        powered: false,
        id: "comp_" + row + "_" + col
    };
    return true;
};

CircuitGame.GridManager.prototype.removeComponent = function(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    var comp = this.cells[row][col];
    if (!comp || comp.fixed) return null;
    this.cells[row][col] = null;
    if (this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col) {
        this.selectedCell = null;
    }
    return comp;
};

CircuitGame.GridManager.prototype.rotateComponent = function(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return false;
    var comp = this.cells[row][col];
    if (!comp || comp.fixed) return false;
    comp.rotation = (comp.rotation + 90) % 360;
    return true;
};

CircuitGame.GridManager.prototype.toggleSwitch = function(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return false;
    var comp = this.cells[row][col];
    if (!comp || comp.type !== "switch") return false;
    comp.state = comp.state === "on" ? "off" : "on";
    return true;
};

CircuitGame.GridManager.prototype.getComponent = function(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return this.cells[row][col];
};

CircuitGame.GridManager.prototype.getConnections = function(row, col) {
    var comp = this.getComponent(row, col);
    if (!comp) return [];
    var typeDef = CircuitGame.COMPONENT_TYPES[comp.type];
    if (!typeDef) return [];
    var connections = [];
    for (var i = 0; i < typeDef.baseConnections.length; i++) {
        connections.push(CircuitGame.rotateDirection(typeDef.baseConnections[i], comp.rotation));
    }
    return connections;
};

CircuitGame.GridManager.prototype.hasConnection = function(row, col, direction) {
    var conns = this.getConnections(row, col);
    return conns.indexOf(direction) !== -1;
};

CircuitGame.GridManager.prototype.getConnectedNeighbors = function(row, col) {
    var neighbors = [];
    var conns = this.getConnections(row, col);
    for (var i = 0; i < conns.length; i++) {
        var dir = conns[i];
        var offset = CircuitGame.directionToOffset(dir);
        var nr = row + offset[0];
        var nc = col + offset[1];
        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
            var oppositeDir = CircuitGame.getOppositeDirection(dir);
            if (this.hasConnection(nr, nc, oppositeDir)) {
                var neighborComp = this.getComponent(nr, nc);
                if (neighborComp && neighborComp.type === "switch" && neighborComp.state === "off") {
                    continue;
                }
                neighbors.push({ row: nr, col: nc, direction: dir });
            }
        }
    }
    return neighbors;
};

CircuitGame.GridManager.prototype.selectCell = function(row, col) {
    if (this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col) {
        this.selectedCell = null;
        return;
    }
    this.selectedCell = (row >= 0 && row < this.rows && col >= 0 && col < this.cols && this.cells[row][col])
        ? { row: row, col: col }
        : null;
};

CircuitGame.GridManager.prototype.clearPower = function() {
    for (var r = 0; r < this.rows; r++) {
        for (var c = 0; c < this.cols; c++) {
            if (this.cells[r][c]) {
                this.cells[r][c].powered = false;
            }
        }
    }
};

CircuitGame.GridManager.prototype.findPowerSources = function() {
    var sources = [];
    for (var r = 0; r < this.rows; r++) {
        for (var c = 0; c < this.cols; c++) {
            var comp = this.cells[r][c];
            if (comp && CircuitGame.COMPONENT_TYPES[comp.type] && CircuitGame.COMPONENT_TYPES[comp.type].isSource) {
                sources.push({ row: r, col: c });
            }
        }
    }
    return sources;
};

CircuitGame.GridManager.prototype.findBulbs = function() {
    var bulbs = [];
    for (var r = 0; r < this.rows; r++) {
        for (var c = 0; c < this.cols; c++) {
            var comp = this.cells[r][c];
            if (comp && comp.type === "bulb") {
                bulbs.push({ row: r, col: c, powered: comp.powered });
            }
        }
    }
    return bulbs;
};

CircuitGame.GridManager.prototype.serialize = function() {
    var data = [];
    for (var r = 0; r < this.rows; r++) {
        for (var c = 0; c < this.cols; c++) {
            if (this.cells[r][c]) {
                var comp = this.cells[r][c];
                data.push({
                    row: r, col: c,
                    type: comp.type,
                    rotation: comp.rotation,
                    fixed: comp.fixed,
                    state: comp.state
                });
            }
        }
    }
    return data;
};
