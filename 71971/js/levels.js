var CircuitGame = window.CircuitGame || {};

CircuitGame.LEVELS = [
    {
        id: 1,
        name: "初识电路",
        description: "用导线连接电源和灯泡，点亮灯泡",
        difficulty: 1,
        gridRows: 4,
        gridCols: 6,
        fixedComponents: [
            { type: "power", row: 1, col: 0, rotation: 0 },
            { type: "bulb", row: 1, col: 5, rotation: 0 }
        ],
        availableComponents: [
            { type: "wire", count: 4 }
        ],
        hints: ["电源在左侧，灯泡在右侧，用导线将它们连起来吧"],
        starThresholds: { moves: [4, 6, 8] }
    },
    {
        id: 2,
        name: "开关控制",
        description: "用开关控制灯泡的亮灭",
        difficulty: 1,
        gridRows: 4,
        gridCols: 6,
        fixedComponents: [
            { type: "power", row: 1, col: 0, rotation: 0 },
            { type: "bulb", row: 1, col: 5, rotation: 0 }
        ],
        availableComponents: [
            { type: "wire", count: 3 },
            { type: "switch", count: 1 }
        ],
        hints: ["在导线中间放一个开关，然后点击开关来控制通断"],
        starThresholds: { moves: [4, 7, 10] }
    },
    {
        id: 3,
        name: "转角连接",
        description: "利用弯角导线绕过障碍连接灯泡",
        difficulty: 2,
        gridRows: 5,
        gridCols: 6,
        fixedComponents: [
            { type: "power", row: 0, col: 1, rotation: 0 },
            { type: "bulb", row: 3, col: 4, rotation: 0 }
        ],
        availableComponents: [
            { type: "wire", count: 3 },
            { type: "wire-corner", count: 2 }
        ],
        hints: ["先向右走，再用弯角向下转弯", "弯角导线需要旋转到正确方向才能连接"],
        starThresholds: { moves: [5, 8, 12] }
    },
    {
        id: 4,
        name: "双灯并联",
        description: "用T型导线同时点亮两个灯泡",
        difficulty: 2,
        gridRows: 5,
        gridCols: 7,
        fixedComponents: [
            { type: "power", row: 2, col: 0, rotation: 0 },
            { type: "bulb", row: 1, col: 5, rotation: 0 },
            { type: "bulb", row: 3, col: 5, rotation: 90 }
        ],
        availableComponents: [
            { type: "wire", count: 4 },
            { type: "wire-corner", count: 2 },
            { type: "wire-t", count: 1 }
        ],
        hints: ["用T型导线在一个点分出两条路", "T型导线可以旋转，使分支朝不同方向"],
        starThresholds: { moves: [7, 11, 16] }
    },
    {
        id: 5,
        name: "混联电路",
        description: "用开关控制支路，电阻保护电路",
        difficulty: 3,
        gridRows: 5,
        gridCols: 8,
        fixedComponents: [
            { type: "power", row: 2, col: 0, rotation: 0 },
            { type: "bulb", row: 1, col: 6, rotation: 0 },
            { type: "bulb", row: 3, col: 6, rotation: 90 }
        ],
        availableComponents: [
            { type: "wire", count: 3 },
            { type: "wire-corner", count: 2 },
            { type: "wire-t", count: 1 },
            { type: "resistor", count: 1 },
            { type: "switch", count: 1 }
        ],
        hints: ["主干路上放电阻保护电路", "用T型导线分出上下两条支路", "开关放在一条支路上控制那盏灯"],
        starThresholds: { moves: [8, 12, 18] }
    }
];

CircuitGame.COMPONENT_TYPES = {
    power: {
        label: "电源",
        baseConnections: ["left", "right"],
        color: "#00ff88",
        isSource: true
    },
    wire: {
        label: "导线",
        baseConnections: ["left", "right"],
        color: "#00ff88",
        isSource: false
    },
    "wire-corner": {
        label: "弯角",
        baseConnections: ["top", "right"],
        color: "#00ff88",
        isSource: false
    },
    "wire-t": {
        label: "T型导线",
        baseConnections: ["left", "right", "bottom"],
        color: "#00ff88",
        isSource: false
    },
    "wire-cross": {
        label: "十字导线",
        baseConnections: ["top", "right", "bottom", "left"],
        color: "#00ff88",
        isSource: false
    },
    switch: {
        label: "开关",
        baseConnections: ["left", "right"],
        color: "#ff8800",
        isSource: false,
        isSwitch: true
    },
    bulb: {
        label: "灯泡",
        baseConnections: ["left", "right"],
        color: "#ffcc00",
        isLoad: true,
        isSource: false
    },
    resistor: {
        label: "电阻",
        baseConnections: ["left", "right"],
        color: "#ff6b6b",
        isLoad: true,
        isSource: false
    }
};

CircuitGame.rotateDirection = function(dir, rotation) {
    var steps = (rotation % 360) / 90;
    var dirs = ["top", "right", "bottom", "left"];
    var idx = dirs.indexOf(dir);
    if (idx === -1) return dir;
    return dirs[(idx + steps) % 4];
};

CircuitGame.getOppositeDirection = function(dir) {
    var map = { top: "bottom", bottom: "top", left: "right", right: "left" };
    return map[dir] || dir;
};

CircuitGame.directionToOffset = function(dir) {
    var map = { top: [-1, 0], bottom: [1, 0], left: [0, -1], right: [0, 1] };
    return map[dir] || [0, 0];
};
