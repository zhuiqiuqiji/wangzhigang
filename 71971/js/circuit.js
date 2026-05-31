var CircuitGame = window.CircuitGame || {};

CircuitGame.CircuitDetector = function(grid) {
    this.grid = grid;
};

CircuitGame.CircuitDetector.prototype.detect = function() {
    this.grid.clearPower();
    var sources = this.grid.findPowerSources();
    if (sources.length === 0) {
        return { powered: [], shortCircuit: false, bulbsLit: 0, bulbsTotal: 0 };
    }

    var poweredSet = {};
    var visited = {};
    var queue = [];

    for (var s = 0; s < sources.length; s++) {
        var src = sources[s];
        var key = src.row + "," + src.col;
        visited[key] = true;
        poweredSet[key] = true;
        queue.push(src);
        var comp = this.grid.getComponent(src.row, src.col);
        if (comp) comp.powered = true;
    }

    while (queue.length > 0) {
        var current = queue.shift();
        var neighbors = this.grid.getConnectedNeighbors(current.row, current.col);
        for (var i = 0; i < neighbors.length; i++) {
            var nb = neighbors[i];
            var nbKey = nb.row + "," + nb.col;
            if (!visited[nbKey]) {
                visited[nbKey] = true;
                poweredSet[nbKey] = true;
                var nbComp = this.grid.getComponent(nb.row, nb.col);
                if (nbComp) nbComp.powered = true;
                queue.push({ row: nb.row, col: nb.col });
            }
        }
    }

    var bulbs = this.grid.findBulbs();
    var bulbsLit = 0;
    for (var b = 0; b < bulbs.length; b++) {
        if (bulbs[b].powered) bulbsLit++;
    }

    var shortCircuit = this.detectShortCircuit(sources, poweredSet);

    return {
        powered: Object.keys(poweredSet),
        shortCircuit: shortCircuit,
        bulbsLit: bulbsLit,
        bulbsTotal: bulbs.length
    };
};

CircuitGame.CircuitDetector.prototype.detectShortCircuit = function(sources, poweredSet) {
    for (var s = 0; s < sources.length; s++) {
        var src = sources[s];
        var conns = this.grid.getConnections(src.row, src.col);

        for (var ci = 0; ci < conns.length; ci++) {
            var dir = conns[ci];
            var offset = CircuitGame.directionToOffset(dir);
            var nr = src.row + offset[0];
            var nc = src.col + offset[1];
            if (nr >= 0 && nr < this.grid.rows && nc >= 0 && nc < this.grid.cols) {
                var adjComp = this.grid.getComponent(nr, nc);
                if (adjComp && adjComp.powered) {
                    var adjType = CircuitGame.COMPONENT_TYPES[adjComp.type];
                    if (adjType && !adjType.isLoad && !adjType.isSource) {
                        if (this.hasPathWithoutLoad(src, nr, nc, poweredSet)) {
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
};

CircuitGame.CircuitDetector.prototype.hasPathWithoutLoad = function(source, startRow, startCol, poweredSet) {
    var visited = {};
    var sourceKey = source.row + "," + source.col;
    var startKey = startRow + "," + startCol;
    visited[sourceKey] = true;
    visited[startKey] = true;

    var sourceConns = this.grid.getConnections(source.row, source.col);
    var sourceNeighborKeys = {};
    for (var sc = 0; sc < sourceConns.length; sc++) {
        var soff = CircuitGame.directionToOffset(sourceConns[sc]);
        var snr = source.row + soff[0];
        var snc = source.col + soff[1];
        if (snr >= 0 && snr < this.grid.rows && snc >= 0 && snc < this.grid.cols) {
            sourceNeighborKeys[snr + "," + snc] = true;
        }
    }

    var queue = [{ row: startRow, col: startCol, hasLoad: false, prevKey: sourceKey }];

    while (queue.length > 0) {
        var current = queue.shift();
        var curComp = this.grid.getComponent(current.row, current.col);
        if (!curComp) continue;

        var curType = CircuitGame.COMPONENT_TYPES[curComp.type];
        var nowHasLoad = current.hasLoad || (curType && curType.isLoad);

        var neighbors = this.grid.getConnectedNeighbors(current.row, current.col);
        var curKey = current.row + "," + current.col;

        for (var i = 0; i < neighbors.length; i++) {
            var nb = neighbors[i];
            var nbKey = nb.row + "," + nb.col;

            if (nbKey === current.prevKey) continue;

            if (nbKey === sourceKey) {
                if (!nowHasLoad) {
                    return true;
                }
                continue;
            }

            if (sourceNeighborKeys[nbKey] && !nowHasLoad && nbKey !== startKey) {
                return true;
            }

            if (!visited[nbKey]) {
                visited[nbKey] = true;
                queue.push({ row: nb.row, col: nb.col, hasLoad: nowHasLoad, prevKey: curKey });
            }
        }
    }
    return false;
};
