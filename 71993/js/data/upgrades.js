const UPGRADES = {
  engine: {
    name: '引擎',
    description: '影响加速能力和最高速度',
    icon: '⚡',
    levels: [
      {
        level: 1,
        name: '基础款',
        price: 0,
        description: '原厂标准配置',
        stats: {
          maxSpeed: 900,
          acceleration: 600,
        }
      },
      {
        level: 2,
        name: '运动款',
        price: 5000,
        description: '升级排气系统，提升15%性能',
        stats: {
          maxSpeed: 1035,
          acceleration: 690,
        }
      },
      {
        level: 3,
        name: '专业款',
        price: 15000,
        description: '竞技级引擎调校，提升30%性能',
        stats: {
          maxSpeed: 1170,
          acceleration: 780,
        }
      },
      {
        level: 4,
        name: '竞速款',
        price: 40000,
        description: '涡轮增压器加持，提升50%性能',
        stats: {
          maxSpeed: 1350,
          acceleration: 900,
        }
      },
      {
        level: 5,
        name: '传奇款',
        price: 100000,
        description: 'F1级双涡轮，提升80%性能',
        stats: {
          maxSpeed: 1620,
          acceleration: 1080,
        }
      }
    ]
  },
  tire: {
    name: '轮胎',
    description: '影响抓地力和滚动阻力',
    icon: '⚙',
    levels: [
      {
        level: 1,
        name: '基础款',
        price: 0,
        description: '标准公路轮胎',
        stats: {
          grip: 1.0,
          rollingResistance: 0.97,
        }
      },
      {
        level: 2,
        name: '运动款',
        price: 5000,
        description: '软质胎面，抓地力+15%',
        stats: {
          grip: 1.15,
          rollingResistance: 0.975,
        }
      },
      {
        level: 3,
        name: '专业款',
        price: 15000,
        description: '半热熔轮胎，抓地力+30%',
        stats: {
          grip: 1.3,
          rollingResistance: 0.98,
        }
      },
      {
        level: 4,
        name: '竞速款',
        price: 40000,
        description: '全热熔光头胎，抓地力+50%',
        stats: {
          grip: 1.5,
          rollingResistance: 0.985,
        }
      },
      {
        level: 5,
        name: '传奇款',
        price: 100000,
        description: '定制复合胎，抓地力+80%',
        stats: {
          grip: 1.8,
          rollingResistance: 0.99,
        }
      }
    ]
  },
  suspension: {
    name: '悬挂',
    description: '影响稳定性和着陆容错度',
    icon: '🔧',
    levels: [
      {
        level: 1,
        name: '基础款',
        price: 0,
        description: '标准弹簧悬挂',
        stats: {
          travel: 18,
          landingAngleTolerance: 0.75,
          stability: 1.0,
        }
      },
      {
        level: 2,
        name: '运动款',
        price: 5000,
        description: '可调阻尼，容错+10%',
        stats: {
          travel: 22,
          landingAngleTolerance: 0.825,
          stability: 1.1,
        }
      },
      {
        level: 3,
        name: '专业款',
        price: 15000,
        description: '竞技级双叉臂，容错+20%',
        stats: {
          travel: 26,
          landingAngleTolerance: 0.9,
          stability: 1.2,
        }
      },
      {
        level: 4,
        name: '竞速款',
        price: 40000,
        description: '主动式悬挂，容错+35%',
        stats: {
          travel: 32,
          landingAngleTolerance: 1.01,
          stability: 1.35,
        }
      },
      {
        level: 5,
        name: '传奇款',
        price: 100000,
        description: '磁流变悬挂，容错+50%',
        stats: {
          travel: 40,
          landingAngleTolerance: 1.125,
          stability: 1.5,
        }
      }
    ]
  }
};

const DEFAULT_UPGRADES = {
  engine: 1,
  tire: 1,
  suspension: 1,
};

function getUpgradeInfo(type, level) {
  if (!UPGRADES[type]) return null;
  const levels = UPGRADES[type].levels;
  return levels.find(l => l.level === level) || levels[0];
}

function getUpgradePrice(type, currentLevel) {
  if (currentLevel >= 5) return -1;
  return UPGRADES[type].levels[currentLevel].price;
}

function getAppliedStats(upgradeLevels) {
  const engine = getUpgradeInfo('engine', upgradeLevels.engine);
  const tire = getUpgradeInfo('tire', upgradeLevels.tire);
  const suspension = getUpgradeInfo('suspension', upgradeLevels.suspension);

  return {
    maxSpeed: engine.stats.maxSpeed,
    acceleration: engine.stats.acceleration,
    grip: tire.stats.grip,
    rollingResistance: tire.stats.rollingResistance,
    suspensionTravel: suspension.stats.travel,
    landingAngleTolerance: suspension.stats.landingAngleTolerance,
    stability: suspension.stats.stability,
  };
}

window.UPGRADES = UPGRADES;
window.DEFAULT_UPGRADES = DEFAULT_UPGRADES;
window.getUpgradeInfo = getUpgradeInfo;
window.getUpgradePrice = getUpgradePrice;
window.getAppliedStats = getAppliedStats;
