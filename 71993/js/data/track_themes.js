const TRACK_THEMES = {
  desert: {
    id: 'desert',
    name: '沙漠赛道',
    description: '大起伏沙丘，松软沙地考验抓地力',
    difficulty: 2,
    physics: {
      gravity: 1800,
      friction: 0.92,
      rollingResistance: 0.08,
      airDensity: 1.0,
      gripMultiplier: 0.85,
    },
    visual: {
      skyGradient: ['#ff7e3f', '#ffae42', '#3b2a1a'],
      terrainColors: ['#d4a574', '#c4956a', '#8b6914', '#5c4a1f'],
      accentColor: '#ff6b35',
      glowColor: '#ffaa00',
      particleType: 'sand',
      ambientColor: 'rgba(255, 170, 66, 0.1)',
    },
    terrain: {
      baseHeight: 400,
      amplitude: 1.2,
      roughness: 1.1,
      additionalFeatures: true,
      difficulty: 2,
      decorationCount: 35,
      ramps: [
        { startPct: 0.15, widthPct: 0.03, height: -90 },
        { startPct: 0.30, widthPct: 0.025, height: -110 },
        { startPct: 0.48, widthPct: 0.035, height: -130 },
        { startPct: 0.60, widthPct: 0.02, height: -85 },
        { startPct: 0.72, widthPct: 0.04, height: -150 },
        { startPct: 0.85, widthPct: 0.03, height: -120 },
      ],
      obstacles: [],
    }
  },
  snow: {
    id: 'snow',
    name: '雪山赛道',
    description: '冰面低摩擦，陡峭悬崖充满挑战',
    difficulty: 3,
    physics: {
      gravity: 1800,
      friction: 0.98,
      rollingResistance: 0.02,
      airDensity: 1.1,
      gripMultiplier: 0.6,
    },
    visual: {
      skyGradient: ['#1a3a5c', '#4a90b8', '#e8f4f8'],
      terrainColors: ['#e8f4f8', '#b8d4e3', '#7aa8c2', '#4a6b8a'],
      accentColor: '#00d4ff',
      glowColor: '#88ffff',
      particleType: 'snow',
      ambientColor: 'rgba(136, 255, 255, 0.08)',
    },
    terrain: {
      baseHeight: 380,
      amplitude: 1.3,
      roughness: 1.2,
      additionalFeatures: true,
      difficulty: 3,
      decorationCount: 40,
      ramps: [
        { startPct: 0.12, widthPct: 0.025, height: -80 },
        { startPct: 0.25, widthPct: 0.03, height: -100 },
        { startPct: 0.38, widthPct: 0.02, height: -95 },
        { startPct: 0.52, widthPct: 0.035, height: -130 },
        { startPct: 0.65, widthPct: 0.025, height: -110 },
        { startPct: 0.78, widthPct: 0.04, height: -145 },
        { startPct: 0.90, widthPct: 0.03, height: -125 },
      ],
      obstacles: [],
    }
  },
  city: {
    id: 'city',
    name: '城市工地',
    description: '障碍物遍布，跳板钢管考验精准操作',
    difficulty: 4,
    physics: {
      gravity: 1800,
      friction: 0.95,
      rollingResistance: 0.05,
      airDensity: 1.0,
      gripMultiplier: 0.95,
    },
    visual: {
      skyGradient: ['#2a1a3e', '#4a2a5e', '#1a1a2e'],
      terrainColors: ['#555555', '#3a3a3a', '#2a2a2a', '#1a1a1a'],
      accentColor: '#ff3366',
      glowColor: '#ff6699',
      particleType: 'spark',
      ambientColor: 'rgba(255, 51, 102, 0.08)',
    },
    terrain: {
      baseHeight: 420,
      amplitude: 0.9,
      roughness: 1.4,
      additionalFeatures: true,
      difficulty: 4,
      decorationCount: 45,
      ramps: [
        { startPct: 0.10, widthPct: 0.02, height: -75 },
        { startPct: 0.22, widthPct: 0.025, height: -95 },
        { startPct: 0.34, widthPct: 0.015, height: -70 },
        { startPct: 0.46, widthPct: 0.03, height: -115 },
        { startPct: 0.58, widthPct: 0.02, height: -85 },
        { startPct: 0.68, widthPct: 0.035, height: -135 },
        { startPct: 0.79, widthPct: 0.025, height: -105 },
        { startPct: 0.91, widthPct: 0.03, height: -130 },
      ],
      obstacles: [
        { startPct: 0.18, widthPct: 0.012, height: 25, type: 'barrier' },
        { startPct: 0.42, widthPct: 0.01, height: 30, type: 'rock' },
        { startPct: 0.64, widthPct: 0.015, height: 28, type: 'barrier' },
        { startPct: 0.86, widthPct: 0.01, height: 22, type: 'rock' },
      ],
    }
  },
  moon: {
    id: 'moon',
    name: '月球基地',
    description: '1/6低重力，无空气阻力，超长滞空时间',
    difficulty: 5,
    physics: {
      gravity: 300,
      friction: 0.99,
      rollingResistance: 0.01,
      airDensity: 0.0,
      gripMultiplier: 0.7,
    },
    visual: {
      skyGradient: ['#000000', '#0a0a1a', '#1a1a2a'],
      terrainColors: ['#888888', '#666666', '#444444', '#222222'],
      accentColor: '#9d4edd',
      glowColor: '#c77dff',
      particleType: 'star',
      ambientColor: 'rgba(157, 78, 221, 0.1)',
    },
    terrain: {
      baseHeight: 450,
      amplitude: 1.5,
      roughness: 0.8,
      additionalFeatures: true,
      difficulty: 5,
      decorationCount: 25,
      ramps: [
        { startPct: 0.18, widthPct: 0.04, height: -160 },
        { startPct: 0.38, widthPct: 0.035, height: -180 },
        { startPct: 0.58, widthPct: 0.045, height: -200 },
        { startPct: 0.75, widthPct: 0.04, height: -170 },
        { startPct: 0.90, widthPct: 0.05, height: -220 },
      ],
      obstacles: [],
    }
  }
};

const DEFAULT_THEME = 'desert';

function getThemeList() {
  return Object.values(TRACK_THEMES).map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    difficulty: t.difficulty,
  }));
}

function getTheme(themeId) {
  return TRACK_THEMES[themeId] || TRACK_THEMES[DEFAULT_THEME];
}

window.TRACK_THEMES = TRACK_THEMES;
window.getTheme = getTheme;
window.getThemeList = getThemeList;
