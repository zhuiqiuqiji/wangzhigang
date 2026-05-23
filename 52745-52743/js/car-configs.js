const CarConfigs = {
    speed: {
        name: '速度型',
        description: '极速快，加速强，但操控稍弱',
        maxSpeed: 10,
        acceleration: 0.28,
        friction: 0.985,
        turnSpeed: 0.04,
        driftFactor: 0.78,
        grip: 0.85,
        mass: 800,
        color: '#ff006e',
        nitroEfficiency: 1.2
    },
    
    handling: {
        name: '操控型',
        description: '转向精准，抓地力强，但极速稍低',
        maxSpeed: 7.5,
        acceleration: 0.22,
        friction: 0.975,
        turnSpeed: 0.065,
        driftFactor: 0.92,
        grip: 1.15,
        mass: 900,
        color: '#00f5ff',
        nitroEfficiency: 0.9
    },
    
    balanced: {
        name: '平衡型',
        description: '各项性能均衡，适合新手',
        maxSpeed: 8.5,
        acceleration: 0.24,
        friction: 0.98,
        turnSpeed: 0.052,
        driftFactor: 0.85,
        grip: 1.0,
        mass: 850,
        color: '#ffd700',
        nitroEfficiency: 1.0
    },
    
    drift: {
        name: '漂移型',
        description: '极易漂移，氮气积累超快',
        maxSpeed: 8,
        acceleration: 0.2,
        friction: 0.98,
        turnSpeed: 0.058,
        driftFactor: 0.65,
        grip: 0.75,
        mass: 820,
        color: '#00ff88',
        nitroEfficiency: 1.5
    }
};

const TrackThemes = {
    neon: {
        name: '霓虹都市',
        groundColor1: '#0a0a0f',
        groundColor2: '#1a1a2e',
        trackColor1: '#2a2a3e',
        trackColor2: '#3a3a4e',
        outerBorderColor: '#00f5ff',
        innerBorderColor: '#ff006e',
        gridColor: 'rgba(0, 245, 255, 0.05)',
        checkpointColor: '#ff006e',
        checkpointPassedColor: '#00ff88',
        startLineColor: '#ffffff'
    },
    
    desert: {
        name: '沙漠赛道',
        groundColor1: '#8B4513',
        groundColor2: '#D2691E',
        trackColor1: '#C4A35A',
        trackColor2: '#B8956E',
        outerBorderColor: '#8B0000',
        innerBorderColor: '#FF6347',
        gridColor: 'rgba(139, 69, 19, 0.1)',
        checkpointColor: '#FF6347',
        checkpointPassedColor: '#32CD32',
        startLineColor: '#ffffff'
    },
    
    forest: {
        name: '森林赛道',
        groundColor1: '#0d260d',
        groundColor2: '#1a4d1a',
        trackColor1: '#3d3d3d',
        trackColor2: '#4d4d4d',
        outerBorderColor: '#00ff00',
        innerBorderColor: '#8B4513',
        gridColor: 'rgba(0, 255, 0, 0.05)',
        checkpointColor: '#ff6600',
        checkpointPassedColor: '#00ff00',
        startLineColor: '#ffffff'
    },
    
    snow: {
        name: '冰雪赛道',
        groundColor1: '#e6f2ff',
        groundColor2: '#b3d9ff',
        trackColor1: '#ffffff',
        trackColor2: '#e6f2ff',
        outerBorderColor: '#0066cc',
        innerBorderColor: '#3399ff',
        gridColor: 'rgba(0, 102, 204, 0.08)',
        checkpointColor: '#0066cc',
        checkpointPassedColor: '#00cc99',
        startLineColor: '#333333'
    }
};

const AIStyles = {
    aggressive: {
        name: '激进型',
        accelerationMultiplier: 1.15,
        turnMultiplier: 1.2,
        brakeThreshold: 0.3,
        idealLineBias: 0.8,
        mistakeChance: 0.15,
        nitroUsage: 'aggressive'
    },
    
    conservative: {
        name: '保守型',
        accelerationMultiplier: 0.9,
        turnMultiplier: 0.9,
        brakeThreshold: 0.6,
        idealLineBias: 0.95,
        mistakeChance: 0.05,
        nitroUsage: 'conservative'
    },
    
    balanced: {
        name: '平衡型',
        accelerationMultiplier: 1.0,
        turnMultiplier: 1.0,
        brakeThreshold: 0.45,
        idealLineBias: 0.88,
        mistakeChance: 0.08,
        nitroUsage: 'balanced'
    },
    
    drifter: {
        name: '漂移型',
        accelerationMultiplier: 1.05,
        turnMultiplier: 1.3,
        brakeThreshold: 0.25,
        idealLineBias: 0.7,
        mistakeChance: 0.12,
        nitroUsage: 'drift'
    }
};

const DifficultyLevels = {
    easy: {
        name: '简单',
        speedMultiplier: 0.7,
        reactionTime: 0.3,
        mistakeMultiplier: 1.5
    },
    normal: {
        name: '普通',
        speedMultiplier: 0.85,
        reactionTime: 0.15,
        mistakeMultiplier: 1.0
    },
    hard: {
        name: '困难',
        speedMultiplier: 1.0,
        reactionTime: 0.05,
        mistakeMultiplier: 0.5
    },
    expert: {
        name: '专家',
        speedMultiplier: 1.1,
        reactionTime: 0.02,
        mistakeMultiplier: 0.1
    }
};
