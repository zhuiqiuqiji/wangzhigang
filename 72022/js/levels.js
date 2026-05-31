const LEVELS = [
  {
    id: 1,
    name: "初识糖果",
    description: "用鼠标或手指滑动切断绳子，将糖果送入小怪物嘴里！",
    difficulty: 1,
    anchors: [
      { x: 0.5, y: 0.15 }
    ],
    ropes: [
      { anchorIndex: 0, segments: 12, length: 0.35, type: 'normal' }
    ],
    candy: { x: 0.5, y: 0.5, radius: 22 },
    target: { x: 0.5, y: 0.85, radius: 35 },
    stars: [
      { x: 0.5, y: 0.65 }
    ],
    objects: [],
    score: 100,
    isHidden: false,
    unlockRequirement: 0,
    threeStarRequirement: {
      minScore: 100,
      maxTime: 30,
      collectAllStars: true
    }
  },
  {
    id: 2,
    name: "双绳摇摆",
    description: "两根绳子同时悬挂，选择正确的时机切断！",
    difficulty: 1,
    anchors: [
      { x: 0.3, y: 0.15 },
      { x: 0.7, y: 0.15 }
    ],
    ropes: [
      { anchorIndex: 0, segments: 10, length: 0.3, type: 'normal' },
      { anchorIndex: 1, segments: 10, length: 0.3, type: 'normal' }
    ],
    candy: { x: 0.5, y: 0.45, radius: 22 },
    target: { x: 0.3, y: 0.85, radius: 35 },
    stars: [
      { x: 0.4, y: 0.6 },
      { x: 0.6, y: 0.7 }
    ],
    objects: [],
    score: 150,
    isHidden: false,
    unlockRequirement: 0,
    threeStarRequirement: {
      minScore: 150,
      maxTime: 30,
      collectAllStars: true
    }
  },
  {
    id: 3,
    name: "气球助力",
    description: "点击气球让它带着糖果上升！",
    difficulty: 2,
    anchors: [
      { x: 0.25, y: 0.2 }
    ],
    ropes: [
      { anchorIndex: 0, segments: 8, length: 0.25, type: 'normal' }
    ],
    candy: { x: 0.25, y: 0.45, radius: 22 },
    target: { x: 0.75, y: 0.2, radius: 35 },
    stars: [
      { x: 0.5, y: 0.35 },
      { x: 0.65, y: 0.25 }
    ],
    objects: [
      { type: 'balloon', x: 0.25, y: 0.55, options: { liftForce: -700, maxHeight: 0.15 } }
    ],
    score: 200,
    isHidden: false,
    unlockRequirement: 0,
    threeStarRequirement: {
      minScore: 200,
      maxTime: 45,
      collectAllStars: true
    }
  },
  {
    id: 4,
    name: "风扇挑战",
    description: "利用风扇的气流将糖果吹向目标！",
    difficulty: 2,
    anchors: [
      { x: 0.5, y: 0.1 }
    ],
    ropes: [
      { anchorIndex: 0, segments: 12, length: 0.4, type: 'normal' }
    ],
    candy: { x: 0.5, y: 0.5, radius: 22 },
    target: { x: 0.85, y: 0.75, radius: 35 },
    stars: [
      { x: 0.6, y: 0.55 },
      { x: 0.7, y: 0.65 },
      { x: 0.8, y: 0.7 }
    ],
    objects: [
      { type: 'fan', x: 0.2, y: 0.5, options: { force: 500, direction: 0, range: 300, angle: Math.PI / 3 } }
    ],
    score: 250,
    isHidden: false,
    unlockRequirement: 0,
    threeStarRequirement: {
      minScore: 250,
      maxTime: 45,
      collectAllStars: true
    }
  },
  {
    id: 5,
    name: "弹性跳跃",
    description: "弹性绳可以拉伸到原来的1.5倍！利用反弹力到达目标。",
    difficulty: 3,
    anchors: [
      { x: 0.2, y: 0.15 },
      { x: 0.8, y: 0.15 }
    ],
    ropes: [
      { anchorIndex: 0, segments: 10, length: 0.3, type: 'elastic', options: { elastic: true, maxStretch: 1.5, stiffness: 0.6 } },
      { anchorIndex: 1, segments: 10, length: 0.3, type: 'elastic', options: { elastic: true, maxStretch: 1.5, stiffness: 0.6 } }
    ],
    candy: { x: 0.5, y: 0.45, radius: 22 },
    target: { x: 0.5, y: 0.88, radius: 30 },
    stars: [
      { x: 0.35, y: 0.6 },
      { x: 0.5, y: 0.7 },
      { x: 0.65, y: 0.6 }
    ],
    objects: [
      { type: 'obstacle', x: 0.3, y: 0.7, options: { width: 80, height: 15, isBouncy: true, bounciness: 0.9 } },
      { type: 'obstacle', x: 0.7, y: 0.7, options: { width: 80, height: 15, isBouncy: true, bounciness: 0.9 } }
    ],
    score: 300,
    isHidden: false,
    unlockRequirement: 0,
    threeStarRequirement: {
      minScore: 300,
      maxTime: 60,
      collectAllStars: true
    }
  },
  {
    id: 6,
    name: "传送门之谜",
    description: "紫色传送门可以将糖果传送到另一端！",
    difficulty: 3,
    anchors: [
      { x: 0.15, y: 0.1 }
    ],
    ropes: [
      { anchorIndex: 0, segments: 10, length: 0.35, type: 'normal' }
    ],
    candy: { x: 0.15, y: 0.45, radius: 22 },
    target: { x: 0.85, y: 0.85, radius: 35 },
    stars: [
      { x: 0.3, y: 0.5 },
      { x: 0.5, y: 0.5 },
      { x: 0.7, y: 0.7 }
    ],
    objects: [
      { type: 'portal', x: 0.25, y: 0.65, targetX: 0.6, targetY: 0.3, options: { color: '#9B59B6' } },
      { type: 'portal', x: 0.6, y: 0.3, targetX: 0.25, targetY: 0.65, options: { color: '#3498DB' }, linked: true }
    ],
    score: 350,
    isHidden: false,
    unlockRequirement: 0,
    threeStarRequirement: {
      minScore: 350,
      maxTime: 60,
      collectAllStars: true
    }
  },
  {
    id: 7,
    name: "火箭推进",
    description: "点击火箭点燃它！利用推力将糖果推向目标！",
    difficulty: 4,
    anchors: [
      { x: 0.5, y: 0.15 }
    ],
    ropes: [
      { anchorIndex: 0, segments: 8, length: 0.25, type: 'normal' }
    ],
    candy: { x: 0.5, y: 0.4, radius: 22 },
    target: { x: 0.2, y: 0.8, radius: 35 },
    stars: [
      { x: 0.35, y: 0.55 },
      { x: 0.25, y: 0.7 },
      { x: 0.15, y: 0.6 }
    ],
    objects: [
      { type: 'rocket', x: 0.5, y: 0.5, options: { thrust: 1500, direction: -Math.PI / 3, fuel: 2.5 } },
      { type: 'obstacle', x: 0.65, y: 0.6, options: { width: 100, height: 20, isDeadly: false } }
    ],
    score: 400,
    isHidden: false,
    unlockRequirement: 0,
    threeStarRequirement: {
      minScore: 400,
      maxTime: 60,
      collectAllStars: true
    }
  },
  {
    id: 8,
    name: "终极挑战",
    description: "综合运用所有技巧，完成最终挑战！",
    difficulty: 5,
    anchors: [
      { x: 0.15, y: 0.08 },
      { x: 0.5, y: 0.12 },
      { x: 0.85, y: 0.08 }
    ],
    ropes: [
      { anchorIndex: 0, segments: 10, length: 0.3, type: 'normal' },
      { anchorIndex: 1, segments: 8, length: 0.25, type: 'elastic', options: { elastic: true, maxStretch: 1.3, stiffness: 0.7 } },
      { anchorIndex: 2, segments: 10, length: 0.3, type: 'normal' }
    ],
    candy: { x: 0.5, y: 0.38, radius: 22 },
    target: { x: 0.5, y: 0.9, radius: 28 },
    stars: [
      { x: 0.3, y: 0.55 },
      { x: 0.5, y: 0.65 },
      { x: 0.7, y: 0.55 }
    ],
    objects: [
      { type: 'fan', x: 0.1, y: 0.5, options: { force: 400, direction: 0.2, range: 250, angle: Math.PI / 4 } },
      { type: 'fan', x: 0.9, y: 0.5, options: { force: 400, direction: Math.PI - 0.2, range: 250, angle: Math.PI / 4 } },
      { type: 'pulley', x: 0.5, y: 0.55, options: { radius: 30 } },
      { type: 'obstacle', x: 0.35, y: 0.75, options: { width: 60, height: 15, isBouncy: true, bounciness: 0.85 } },
      { type: 'obstacle', x: 0.65, y: 0.75, options: { width: 60, height: 15, isBouncy: true, bounciness: 0.85 } }
    ],
    score: 500,
    isHidden: false,
    unlockRequirement: 0,
    threeStarRequirement: {
      minScore: 500,
      maxTime: 90,
      collectAllStars: true
    }
  },
  {
    id: 9,
    name: "隐藏关卡：时空穿越",
    description: "传说中的隐藏关卡，只有收集足够星星才能解锁！",
    difficulty: 5,
    anchors: [
      { x: 0.25, y: 0.1 },
      { x: 0.75, y: 0.1 }
    ],
    ropes: [
      { anchorIndex: 0, segments: 12, length: 0.35, type: 'elastic', options: { elastic: true, maxStretch: 1.8, stiffness: 0.5 } },
      { anchorIndex: 1, segments: 12, length: 0.35, type: 'elastic', options: { elastic: true, maxStretch: 1.8, stiffness: 0.5 } }
    ],
    candy: { x: 0.5, y: 0.45, radius: 22 },
    target: { x: 0.5, y: 0.85, radius: 32 },
    stars: [
      { x: 0.2, y: 0.5 },
      { x: 0.5, y: 0.6 },
      { x: 0.8, y: 0.5 }
    ],
    objects: [
      { type: 'portal', x: 0.15, y: 0.7, targetX: 0.85, targetY: 0.3, options: { color: '#E74C3C' } },
      { type: 'portal', x: 0.85, y: 0.3, targetX: 0.15, targetY: 0.7, options: { color: '#F39C12' }, linked: true },
      { type: 'balloon', x: 0.5, y: 0.55, options: { liftForce: -600, maxHeight: 0.2 } },
      { type: 'obstacle', x: 0.5, y: 0.7, options: { width: 120, height: 15, isBouncy: true, bounciness: 0.9 } }
    ],
    score: 800,
    isHidden: true,
    unlockRequirement: 15,
    threeStarRequirement: {
      minScore: 800,
      maxTime: 120,
      collectAllStars: true
    }
  }
];

const LEVEL_TEMPLATES = {
  createEmptyLevel: function(width, height) {
    return {
      id: Date.now(),
      name: "自定义关卡",
      description: "使用编辑器创建的关卡",
      difficulty: 1,
      anchors: [],
      ropes: [],
      candy: { x: 0.5, y: 0.4, radius: 22 },
      target: { x: 0.5, y: 0.85, radius: 35 },
      stars: [],
      objects: [],
      score: 100,
      isHidden: false,
      unlockRequirement: 0,
      threeStarRequirement: {
        minScore: 100,
        maxTime: 60,
        collectAllStars: true
      }
    };
  }
};

function getTotalStarsEarned(levelProgress) {
  let total = 0;
  for (const levelId in levelProgress) {
    total += levelProgress[levelId].stars || 0;
  }
  return total;
}

function isLevelUnlocked(level, levelProgress) {
  if (!level.isHidden) return true;
  const totalStars = getTotalStarsEarned(levelProgress);
  return totalStars >= level.unlockRequirement;
}

function calculateStarsEarned(level, result) {
  let stars = 0;
  const req = level.threeStarRequirement;

  if (result.success) {
    stars = 1;

    if (result.score >= req.minScore) {
      stars = 2;
    }

    if (req.collectAllStars && result.collectedAllStars && result.time <= req.maxTime) {
      stars = 3;
    }
  }

  return stars;
}
