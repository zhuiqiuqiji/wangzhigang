const CAREER_TIER = {
  AMATEUR: 0,
  REGIONAL: 1,
  NATIONAL: 2,
  WORLD: 3,
};

const CAREER_TIER_NAMES = {
  0: '业余赛',
  1: '区域赛',
  2: '全国赛',
  3: '世界锦标赛',
};

const CAREER_TIER_COLORS = {
  0: '#00ff88',
  1: '#00aaff',
  2: '#ff6b35',
  3: '#ff3366',
};

const CAREER_EVENTS = [
  {
    id: 'amateur_desert',
    name: '沙漠热身赛',
    tier: 0,
    trackTheme: 'desert',
    unlockRequirement: 0,
    rewardCoins: 1000,
    description: '业余赛入门关卡，熟悉沙漠地形',
    starRequirements: {
      one: 5000,
      two: 15000,
      three: 30000,
    },
    timeRequirements: {
      one: 180,
      two: 120,
      three: 90,
    }
  },
  {
    id: 'amateur_snow',
    name: '雪山练习赛',
    tier: 0,
    trackTheme: 'snow',
    unlockRequirement: 3,
    rewardCoins: 1500,
    description: '体验雪地低摩擦驾驶',
    starRequirements: {
      one: 8000,
      two: 20000,
      three: 40000,
    },
    timeRequirements: {
      one: 210,
      two: 150,
      three: 110,
    }
  },
  {
    id: 'regional_desert',
    name: '沙漠区域冠军赛',
    tier: 1,
    trackTheme: 'desert',
    unlockRequirement: 6,
    rewardCoins: 3000,
    description: '区域赛首站，专业级沙漠赛道',
    starRequirements: {
      one: 15000,
      two: 35000,
      three: 60000,
    },
    timeRequirements: {
      one: 160,
      two: 100,
      three: 75,
    }
  },
  {
    id: 'regional_city',
    name: '城市街道赛',
    tier: 1,
    trackTheme: 'city',
    unlockRequirement: 9,
    rewardCoins: 3500,
    description: '城市工地障碍赛道',
    starRequirements: {
      one: 18000,
      two: 40000,
      three: 70000,
    },
    timeRequirements: {
      one: 240,
      two: 180,
      three: 130,
    }
  },
  {
    id: 'national_snow',
    name: '全国雪山极限赛',
    tier: 2,
    trackTheme: 'snow',
    unlockRequirement: 14,
    rewardCoins: 6000,
    description: '全国级雪山特技大赛',
    starRequirements: {
      one: 30000,
      two: 60000,
      three: 100000,
    },
    timeRequirements: {
      one: 200,
      two: 140,
      three: 100,
    }
  },
  {
    id: 'national_city',
    name: '全国城市锦标赛',
    tier: 2,
    trackTheme: 'city',
    unlockRequirement: 18,
    rewardCoins: 7000,
    description: '全国顶级城市特技赛事',
    starRequirements: {
      one: 35000,
      two: 70000,
      three: 120000,
    },
    timeRequirements: {
      one: 220,
      two: 160,
      three: 120,
    }
  },
  {
    id: 'world_moon',
    name: '月球基地邀请赛',
    tier: 3,
    trackTheme: 'moon',
    unlockRequirement: 24,
    rewardCoins: 15000,
    description: '世界锦标赛首站，低重力极限挑战',
    starRequirements: {
      one: 60000,
      two: 120000,
      three: 200000,
    },
    timeRequirements: {
      one: 270,
      two: 200,
      three: 150,
    }
  },
  {
    id: 'world_final',
    name: '世界锦标赛总决赛',
    tier: 3,
    trackTheme: 'city',
    unlockRequirement: 28,
    rewardCoins: 25000,
    description: '年度终极赛事，世界冠军之争',
    starRequirements: {
      one: 80000,
      two: 150000,
      three: 250000,
    },
    timeRequirements: {
      one: 200,
      two: 140,
      three: 100,
    }
  }
];

function getEventsByTier(tier) {
  return CAREER_EVENTS.filter(e => e.tier === tier);
}

function getEventById(eventId) {
  return CAREER_EVENTS.find(e => e.id === eventId);
}

function getStarRating(event, score, time) {
  let stars = 0;
  if (score >= event.starRequirements.one) stars = Math.max(stars, 1);
  if (score >= event.starRequirements.two) stars = Math.max(stars, 2);
  if (score >= event.starRequirements.three) stars = Math.max(stars, 3);

  if (time <= event.timeRequirements.one) stars = Math.max(stars, 1);
  if (time <= event.timeRequirements.two) stars = Math.max(stars, 2);
  if (time <= event.timeRequirements.three) stars = Math.max(stars, 3);

  return stars;
}

function canUnlockTier(currentStars, tier) {
  const tierRequirements = {
    0: 0,
    1: 6,
    2: 14,
    3: 24,
  };
  return currentStars >= tierRequirements[tier];
}

window.CAREER_TIER = CAREER_TIER;
window.CAREER_TIER_NAMES = CAREER_TIER_NAMES;
window.CAREER_TIER_COLORS = CAREER_TIER_COLORS;
window.CAREER_EVENTS = CAREER_EVENTS;
window.getEventsByTier = getEventsByTier;
window.getEventById = getEventById;
window.getStarRating = getStarRating;
window.canUnlockTier = canUnlockTier;
