const LEVEL_GOAL_TYPES = {
  COLLECT: 'collect',
  SCORE: 'score',
  CLEAR_OBSTACLE: 'clear_obstacle',
  COLLECT_ORDER: 'collect_order',
  DROP_ITEMS: 'drop_items',
  TIME_LIMIT: 'time_limit'
};

const OBSTACLE_TYPES = [
  { id: 'rock', emoji: '🪨', name: '岩石', hits: 2 },
  { id: 'ice', emoji: '🧊', name: '冰块', hits: 1 },
  { id: 'vine', emoji: '🌿', name: '藤蔓', hits: 1 },
  { id: 'box', emoji: '📦', name: '宝箱', hits: 3 }
];

const SPECIAL_ITEMS = [
  {
    id: 'rainbow',
    name: '彩虹道具',
    emoji: '🌈',
    description: '消除所有同色方块',
    price: { coins: 500, stars: 0 }
  },
  {
    id: 'hammer',
    name: '锤子',
    emoji: '🔨',
    description: '消除任意一个方块',
    price: { coins: 300, stars: 0 }
  },
  {
    id: 'extra_moves',
    name: '额外步数',
    emoji: '👟',
    description: '增加5步',
    price: { coins: 200, stars: 0 }
  },
  {
    id: 'shuffle',
    name: '洗牌',
    emoji: '🔀',
    description: '重新排列所有方块',
    price: { coins: 150, stars: 0 }
  },
  {
    id: 'bomb',
    name: '炸弹',
    emoji: '💣',
    description: '消除3x3范围的方块',
    price: { coins: 400, stars: 0 }
  },
  {
    id: 'time_freeze',
    name: '时间冻结',
    emoji: '⏱️',
    description: '本回合不消耗步数',
    price: { coins: 350, stars: 1 }
  }
];

const START_BUFFS = [
  {
    id: 'color_blast',
    name: '色彩爆发',
    emoji: '💥',
    description: '开局消除20个随机方块',
    price: { coins: 200, stars: 0 }
  },
  {
    id: 'lucky_start',
    name: '幸运开局',
    emoji: '🍀',
    description: '开局获得100金币',
    price: { coins: 150, stars: 0 }
  },
  {
    id: 'move_plus',
    name: '步数加成',
    emoji: '➕',
    description: '额外增加3步',
    price: { coins: 100, stars: 0 }
  }
];

const EXTENDED_LEVELS = [
  {
    id: 1,
    name: '初识花园',
    goalType: LEVEL_GOAL_TYPES.COLLECT,
    target: { red: 8, blue: 8 },
    moves: 25,
    reward: { coins: 100, stars: 1 },
    story: '欢迎来到你的花园！这里还是一片空地，让我们从最基础的开始吧。'
  },
  {
    id: 2,
    name: '绿意盎然',
    goalType: LEVEL_GOAL_TYPES.COLLECT,
    target: { green: 12, yellow: 10 },
    moves: 22,
    reward: { coins: 150, stars: 1 },
    story: '春天来了，花园里开始长出嫩绿的新芽。'
  },
  {
    id: 3,
    name: '五彩斑斓',
    goalType: LEVEL_GOAL_TYPES.COLLECT,
    target: { purple: 10, orange: 10, red: 8 },
    moves: 20,
    reward: { coins: 200, stars: 2 },
    story: '鲜花盛开的季节，各种颜色争奇斗艳！'
  },
  {
    id: 4,
    name: '花园初成',
    goalType: LEVEL_GOAL_TYPES.COLLECT,
    target: { blue: 15, green: 15 },
    moves: 18,
    reward: { coins: 250, stars: 2 },
    story: '你的花园开始有模有样了，继续加油！'
  },
  {
    id: 5,
    name: '繁花似锦',
    goalType: LEVEL_GOAL_TYPES.COLLECT,
    target: { red: 12, yellow: 12, purple: 12 },
    moves: 25,
    reward: { coins: 300, stars: 3 },
    story: '太美了！蝴蝶和蜜蜂都被吸引来了。'
  },
  {
    id: 6,
    name: '分数挑战',
    goalType: LEVEL_GOAL_TYPES.SCORE,
    targetScore: 5000,
    target: { red: 999, blue: 999, green: 999, yellow: 999, purple: 999, orange: 999 },
    moves: 30,
    reward: { coins: 400, stars: 3 },
    story: '来一场真正的挑战吧！看看你能获得多少分！'
  },
  {
    id: 7,
    name: '清除障碍',
    goalType: LEVEL_GOAL_TYPES.CLEAR_OBSTACLE,
    obstacles: [
      { row: 2, col: 2, type: 'rock' },
      { row: 2, col: 5, type: 'rock' },
      { row: 5, col: 2, type: 'rock' },
      { row: 5, col: 5, type: 'rock' }
    ],
    target: { rock: 4 },
    moves: 28,
    reward: { coins: 350, stars: 3 },
    story: '花园里出现了一些岩石，需要清除它们才能继续种植。'
  },
  {
    id: 8,
    name: '冰雪消融',
    goalType: LEVEL_GOAL_TYPES.CLEAR_OBSTACLE,
    obstacles: [
      { row: 1, col: 1, type: 'ice' },
      { row: 1, col: 3, type: 'ice' },
      { row: 1, col: 5, type: 'ice' },
      { row: 1, col: 7, type: 'ice' },
      { row: 6, col: 1, type: 'ice' },
      { row: 6, col: 3, type: 'ice' },
      { row: 6, col: 5, type: 'ice' },
      { row: 6, col: 7, type: 'ice' }
    ],
    target: { ice: 8, blue: 10 },
    moves: 25,
    reward: { coins: 400, stars: 4 },
    story: '初春的冰雪还未完全消融，让我们一起迎接春天！'
  },
  {
    id: 9,
    name: '藤蔓迷宫',
    goalType: LEVEL_GOAL_TYPES.CLEAR_OBSTACLE,
    obstacles: [
      { row: 3, col: 0, type: 'vine' },
      { row: 3, col: 1, type: 'vine' },
      { row: 3, col: 2, type: 'vine' },
      { row: 3, col: 5, type: 'vine' },
      { row: 3, col: 6, type: 'vine' },
      { row: 3, col: 7, type: 'vine' },
      { row: 4, col: 3, type: 'vine' },
      { row: 4, col: 4, type: 'vine' }
    ],
    target: { vine: 8, green: 15 },
    moves: 22,
    reward: { coins: 450, stars: 4 },
    story: '藤蔓长得太快了，需要清理一下才能通行。'
  },
  {
    id: 10,
    name: '宝藏猎人',
    goalType: LEVEL_GOAL_TYPES.CLEAR_OBSTACLE,
    obstacles: [
      { row: 2, col: 2, type: 'box' },
      { row: 2, col: 5, type: 'box' },
      { row: 5, col: 2, type: 'box' },
      { row: 5, col: 5, type: 'box' }
    ],
    target: { box: 4 },
    moves: 30,
    reward: { coins: 600, stars: 5 },
    story: '花园里发现了古老的宝箱！打开它们看看有什么宝藏？'
  },
  {
    id: 11,
    name: '高分挑战',
    goalType: LEVEL_GOAL_TYPES.SCORE,
    targetScore: 8000,
    target: { red: 999, blue: 999, green: 999, yellow: 999, purple: 999, orange: 999 },
    moves: 35,
    reward: { coins: 500, stars: 4 },
    story: '高级分数挑战！只有真正的大师才能完成！'
  },
  {
    id: 12,
    name: '终极考验',
    goalType: LEVEL_GOAL_TYPES.COLLECT,
    target: { red: 20, blue: 20, green: 20, yellow: 20, purple: 20, orange: 20 },
    moves: 40,
    reward: { coins: 800, stars: 6 },
    story: '恭喜你来到最终关卡！这是对你技巧的终极考验！'
  },
  {
    id: 13,
    name: '顺序消除',
    goalType: LEVEL_GOAL_TYPES.COLLECT_ORDER,
    target: { red: 999, blue: 999, green: 999, yellow: 999, purple: 999, orange: 999 },
    collectOrder: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],
    moves: 25,
    reward: { coins: 500, stars: 4 },
    story: '按顺序消除方块：红→蓝→绿→黄→紫→橙！'
  },
  {
    id: 14,
    name: '物品坠落',
    goalType: LEVEL_GOAL_TYPES.DROP_ITEMS,
    target: { red: 999, blue: 999, green: 999, yellow: 999, purple: 999, orange: 999 },
    dropItems: [
      { type: 'red', dropped: false },
      { type: 'blue', dropped: false },
      { type: 'green', dropped: false }
    ],
    moves: 22,
    reward: { coins: 550, stars: 4 },
    story: '让指定颜色的方块全部消除即可过关！'
  },
  {
    id: 15,
    name: '限时挑战',
    goalType: LEVEL_GOAL_TYPES.TIME_LIMIT,
    target: { red: 999, blue: 999, green: 999, yellow: 999, purple: 999, orange: 999 },
    targetScore: 10000,
    timeLimit: 90,
    moves: 999,
    reward: { coins: 700, stars: 5 },
    story: '90秒内达到10000分！时间就是一切！'
  },
  {
    id: 16,
    name: '障碍迷宫',
    goalType: LEVEL_GOAL_TYPES.CLEAR_OBSTACLE,
    obstacles: [
      { row: 1, col: 1, type: 'rock' },
      { row: 1, col: 6, type: 'rock' },
      { row: 3, col: 3, type: 'box' },
      { row: 3, col: 4, type: 'box' },
      { row: 6, col: 1, type: 'ice' },
      { row: 6, col: 6, type: 'ice' },
      { row: 4, col: 1, type: 'vine' },
      { row: 4, col: 6, type: 'vine' }
    ],
    target: { rock: 2, box: 2, ice: 2, vine: 2 },
    moves: 35,
    reward: { coins: 650, stars: 5 },
    story: '多种障碍挡路，运用你的智慧清除它们！'
  },
  {
    id: 17,
    name: '彩虹大师',
    goalType: LEVEL_GOAL_TYPES.SCORE,
    targetScore: 15000,
    target: { red: 999, blue: 999, green: 999, yellow: 999, purple: 999, orange: 999 },
    moves: 30,
    reward: { coins: 800, stars: 6 },
    story: '追求极致分数！创造最大的连击！'
  },
  {
    id: 18,
    name: '花园守护者',
    goalType: LEVEL_GOAL_TYPES.COLLECT,
    target: { red: 25, blue: 25, green: 25, yellow: 25 },
    moves: 35,
    reward: { coins: 900, stars: 6 },
    story: '守护你的花园，收集足够的方块！'
  },
  {
    id: 19,
    name: '极速挑战',
    goalType: LEVEL_GOAL_TYPES.TIME_LIMIT,
    target: { red: 999, blue: 999, green: 999, yellow: 999, purple: 999, orange: 999 },
    targetScore: 8000,
    timeLimit: 60,
    moves: 999,
    reward: { coins: 600, stars: 5 },
    story: '60秒极速挑战！手速决定一切！'
  },
  {
    id: 20,
    name: '完美收藏',
    goalType: LEVEL_GOAL_TYPES.COLLECT,
    target: { purple: 30, orange: 30 },
    moves: 28,
    reward: { coins: 1000, stars: 8 },
    story: '最终的完美收藏挑战，收集稀有的紫色和橙色方块！'
  }
];

const DECORATION_CATEGORIES = {
  FLOWERS: 'flowers',
  TREES: 'trees',
  PLANTS: 'plants',
  ANIMALS: 'animals',
  BUILDINGS: 'buildings',
  DECORATIONS: 'decorations',
  SEASONAL: 'seasonal'
};

const EXTENDED_SHOP_ITEMS = [
  { id: 'flower_rose', name: '玫瑰花丛', emoji: '🌹', category: DECORATION_CATEGORIES.FLOWERS, price: { coins: 50, stars: 0 }, description: '美丽的红色玫瑰' },
  { id: 'flower_sunflower', name: '向日葵', emoji: '🌻', category: DECORATION_CATEGORIES.FLOWERS, price: { coins: 60, stars: 0 }, description: '阳光般灿烂' },
  { id: 'flower_tulip', name: '郁金香', emoji: '🌷', category: DECORATION_CATEGORIES.FLOWERS, price: { coins: 70, stars: 0 }, description: '优雅的郁金香' },
  { id: 'flower_cherry', name: '樱花', emoji: '🌸', category: DECORATION_CATEGORIES.FLOWERS, price: { coins: 80, stars: 1 }, description: '浪漫的樱花' },
  { id: 'flower_hyacinth', name: '风信子', emoji: '🪻', category: DECORATION_CATEGORIES.FLOWERS, price: { coins: 65, stars: 0 }, description: '芬芳的风信子' },
  { id: 'flower_daisy', name: '雏菊', emoji: '🌼', category: DECORATION_CATEGORIES.FLOWERS, price: { coins: 45, stars: 0 }, description: '清新的雏菊' },
  { id: 'flower_lotus', name: '荷花', emoji: '🪷', category: DECORATION_CATEGORIES.FLOWERS, price: { coins: 90, stars: 1 }, description: '出淤泥而不染' },
  { id: 'flower_blossom', name: '花束', emoji: '💐', category: DECORATION_CATEGORIES.FLOWERS, price: { coins: 120, stars: 1 }, description: '精美的花束' },
  { id: 'flower_hibiscus', name: '木槿', emoji: '🌺', category: DECORATION_CATEGORIES.FLOWERS, price: { coins: 75, stars: 0 }, description: '热带风情' },
  
  { id: 'tree_small', name: '小树苗', emoji: '🌱', category: DECORATION_CATEGORIES.TREES, price: { coins: 80, stars: 1 }, description: '茁壮成长' },
  { id: 'tree_big', name: '大树', emoji: '🌳', category: DECORATION_CATEGORIES.TREES, price: { coins: 150, stars: 2 }, description: '参天大树' },
  { id: 'tree_pine', name: '松树', emoji: '🌲', category: DECORATION_CATEGORIES.TREES, price: { coins: 180, stars: 2 }, description: '常青松树' },
  { id: 'tree_palm', name: '棕榈树', emoji: '🌴', category: DECORATION_CATEGORIES.TREES, price: { coins: 200, stars: 2 }, description: '热带风情' },
  { id: 'tree_decorated', name: '圣诞树', emoji: '🎄', category: DECORATION_CATEGORIES.TREES, price: { coins: 250, stars: 3 }, description: '节日特别款' },
  { id: 'tree_bonsai', name: '盆景', emoji: '🪴', category: DECORATION_CATEGORIES.TREES, price: { coins: 160, stars: 2 }, description: '精致盆景' },
  
  { id: 'grass', name: '草坪', emoji: '🌿', category: DECORATION_CATEGORIES.PLANTS, price: { coins: 30, stars: 0 }, description: '翠绿草坪' },
  { id: 'mushroom', name: '蘑菇', emoji: '🍄', category: DECORATION_CATEGORIES.PLANTS, price: { coins: 40, stars: 0 }, description: '可爱蘑菇' },
  { id: 'cactus', name: '仙人掌', emoji: '🌵', category: DECORATION_CATEGORIES.PLANTS, price: { coins: 55, stars: 0 }, description: '沙漠植物' },
  { id: 'herb', name: '香草', emoji: '🌾', category: DECORATION_CATEGORIES.PLANTS, price: { coins: 35, stars: 0 }, description: '芳香香草' },
  { id: 'clover', name: '四叶草', emoji: '🍀', category: DECORATION_CATEGORIES.PLANTS, price: { coins: 100, stars: 1 }, description: '幸运象征' },
  { id: 'fern', name: '蕨类', emoji: '☘️', category: DECORATION_CATEGORIES.PLANTS, price: { coins: 45, stars: 0 }, description: '古老植物' },
  
  { id: 'butterfly', name: '蝴蝶', emoji: '🦋', category: DECORATION_CATEGORIES.ANIMALS, price: { coins: 100, stars: 1 }, description: '翩翩起舞' },
  { id: 'bee', name: '蜜蜂', emoji: '🐝', category: DECORATION_CATEGORIES.ANIMALS, price: { coins: 90, stars: 1 }, description: '勤劳蜜蜂' },
  { id: 'bird', name: '小鸟', emoji: '🐦', category: DECORATION_CATEGORIES.ANIMALS, price: { coins: 120, stars: 1 }, description: '歌唱的小鸟' },
  { id: 'cat', name: '猫咪', emoji: '🐱', category: DECORATION_CATEGORIES.ANIMALS, price: { coins: 200, stars: 2 }, description: '花园守护者' },
  { id: 'dog', name: '小狗', emoji: '🐶', category: DECORATION_CATEGORIES.ANIMALS, price: { coins: 200, stars: 2 }, description: '忠诚伙伴' },
  { id: 'rabbit', name: '兔子', emoji: '🐰', category: DECORATION_CATEGORIES.ANIMALS, price: { coins: 150, stars: 2 }, description: '可爱小兔' },
  { id: 'squirrel', name: '松鼠', emoji: '🐿️', category: DECORATION_CATEGORIES.ANIMALS, price: { coins: 130, stars: 1 }, description: '活泼松鼠' },
  { id: 'ladybug', name: '瓢虫', emoji: '🐞', category: DECORATION_CATEGORIES.ANIMALS, price: { coins: 70, stars: 0 }, description: '幸运瓢虫' },
  { id: 'snail', name: '蜗牛', emoji: '🐌', category: DECORATION_CATEGORIES.ANIMALS, price: { coins: 60, stars: 0 }, description: '慢悠悠' },
  { id: 'fish', name: '金鱼', emoji: '🐟', category: DECORATION_CATEGORIES.ANIMALS, price: { coins: 80, stars: 1 }, description: '池塘金鱼' },
  { id: 'frog', name: '青蛙', emoji: '🐸', category: DECORATION_CATEGORIES.ANIMALS, price: { coins: 85, stars: 1 }, description: '呱呱叫' },
  { id: 'duck', name: '鸭子', emoji: '🦆', category: DECORATION_CATEGORIES.ANIMALS, price: { coins: 140, stars: 2 }, description: '池塘戏水' },
  
  { id: 'fountain', name: '喷泉', emoji: '⛲', category: DECORATION_CATEGORIES.BUILDINGS, price: { coins: 200, stars: 3 }, description: '优雅喷泉' },
  { id: 'house', name: '小屋', emoji: '🏡', category: DECORATION_CATEGORIES.BUILDINGS, price: { coins: 500, stars: 5 }, description: '温馨小屋' },
  { id: 'statue', name: '雕像', emoji: '🗿', category: DECORATION_CATEGORIES.BUILDINGS, price: { coins: 300, stars: 3 }, description: '精美雕像' },
  { id: 'tent', name: '帐篷', emoji: '⛺', category: DECORATION_CATEGORIES.BUILDINGS, price: { coins: 180, stars: 2 }, description: '露营帐篷' },
  { id: 'castle', name: '城堡', emoji: '🏰', category: DECORATION_CATEGORIES.BUILDINGS, price: { coins: 800, stars: 8 }, description: '梦幻城堡' },
  { id: 'windmill', name: '风车', emoji: '🌬️', category: DECORATION_CATEGORIES.BUILDINGS, price: { coins: 350, stars: 4 }, description: '荷兰风车' },
  { id: 'lighthouse', name: '灯塔', emoji: '🗼', category: DECORATION_CATEGORIES.BUILDINGS, price: { coins: 400, stars: 4 }, description: '指引方向' },
  { id: 'bridge', name: '小桥', emoji: '🌉', category: DECORATION_CATEGORIES.BUILDINGS, price: { coins: 280, stars: 3 }, description: '拱形小桥' },
  { id: 'bench', name: '长椅', emoji: '🪑', category: DECORATION_CATEGORIES.BUILDINGS, price: { coins: 120, stars: 1 }, description: '休息长椅' },
  { id: 'gazebo', name: '凉亭', emoji: '🏛️', category: DECORATION_CATEGORIES.BUILDINGS, price: { coins: 320, stars: 3 }, description: '古典凉亭' },
  
  { id: 'lantern', name: '灯笼', emoji: '🏮', category: DECORATION_CATEGORIES.DECORATIONS, price: { coins: 80, stars: 1 }, description: '节日灯笼' },
  { id: 'wind_chime', name: '风铃', emoji: '🎐', category: DECORATION_CATEGORIES.DECORATIONS, price: { coins: 70, stars: 1 }, description: '清脆悦耳' },
  { id: 'stone', name: '景观石', emoji: '🪨', category: DECORATION_CATEGORIES.DECORATIONS, price: { coins: 40, stars: 0 }, description: '装饰石头' },
  { id: 'gnome', name: '花园地精', emoji: '🧙', category: DECORATION_CATEGORIES.DECORATIONS, price: { coins: 150, stars: 2 }, description: '神秘守护者' },
  { id: 'fairy', name: '小精灵', emoji: '🧚', category: DECORATION_CATEGORIES.DECORATIONS, price: { coins: 200, stars: 2 }, description: '花园精灵' },
  { id: 'rainbow_deco', name: '彩虹', emoji: '🌈', category: DECORATION_CATEGORIES.DECORATIONS, price: { coins: 300, stars: 3 }, description: '雨后彩虹' },
  { id: 'star_deco', name: '星星灯', emoji: '⭐', category: DECORATION_CATEGORIES.DECORATIONS, price: { coins: 90, stars: 1 }, description: '闪烁星光' },
  { id: 'moon_deco', name: '月亮灯', emoji: '🌙', category: DECORATION_CATEGORIES.DECORATIONS, price: { coins: 95, stars: 1 }, description: '温柔月光' },
  { id: 'sun_deco', name: '太阳花', emoji: '☀️', category: DECORATION_CATEGORIES.DECORATIONS, price: { coins: 85, stars: 1 }, description: '阳光普照' },
  { id: 'balloon', name: '气球', emoji: '🎈', category: DECORATION_CATEGORIES.DECORATIONS, price: { coins: 50, stars: 0 }, description: '节日气球' },
  { id: 'gift', name: '礼物盒', emoji: '🎁', category: DECORATION_CATEGORIES.DECORATIONS, price: { coins: 100, stars: 1 }, description: '神秘礼物' },
  { id: 'crown', name: '皇冠', emoji: '👑', category: DECORATION_CATEGORIES.DECORATIONS, price: { coins: 500, stars: 5 }, description: '王者象征' },
  
  { id: 'snowman', name: '雪人', emoji: '⛄', category: DECORATION_CATEGORIES.SEASONAL, price: { coins: 180, stars: 2 }, description: '冬季限定' },
  { id: 'fireworks', name: '烟花', emoji: '🎆', category: DECORATION_CATEGORIES.SEASONAL, price: { coins: 220, stars: 2 }, description: '新年烟花' },
  { id: 'pumpkin', name: '南瓜灯', emoji: '🎃', category: DECORATION_CATEGORIES.SEASONAL, price: { coins: 160, stars: 2 }, description: '万圣节限定' },
  { id: 'heart', name: '爱心', emoji: '❤️', category: DECORATION_CATEGORIES.SEASONAL, price: { coins: 120, stars: 1 }, description: '情人节限定' },
  { id: 'egg', name: '彩蛋', emoji: '🥚', category: DECORATION_CATEGORIES.SEASONAL, price: { coins: 90, stars: 1 }, description: '复活节彩蛋' },
  { id: 'moon_cake', name: '月饼', emoji: '🥮', category: DECORATION_CATEGORIES.SEASONAL, price: { coins: 110, stars: 1 }, description: '中秋限定' },
  { id: 'dumpling', name: '饺子', emoji: '🥟', category: DECORATION_CATEGORIES.SEASONAL, price: { coins: 80, stars: 0 }, description: '春节限定' },
  { id: 'christmas_tree', name: '圣诞树', emoji: '🎄', category: DECORATION_CATEGORIES.SEASONAL, price: { coins: 250, stars: 3 }, description: '圣诞快乐' },
  { id: 'santa', name: '圣诞老人', emoji: '🎅', category: DECORATION_CATEGORIES.SEASONAL, price: { coins: 300, stars: 3 }, description: '节日特别' },
  { id: 'firework_sparkler', name: '仙女棒', emoji: '🎇', category: DECORATION_CATEGORIES.SEASONAL, price: { coins: 150, stars: 2 }, description: '闪耀光芒' }
];

const STORY_CHAPTERS = [
  {
    id: 1,
    title: '第一章：花园的开始',
    description: '你继承了一片荒废的土地，决定将它变成美丽的花园。',
    unlockCondition: { levelsCompleted: 1 },
    reward: { coins: 200, stars: 2 }
  },
  {
    id: 2,
    title: '第二章：春意盎然',
    description: '春天来了，花园里开始出现各种鲜花和小动物。',
    unlockCondition: { levelsCompleted: 3, decorationsPlaced: 5 },
    reward: { coins: 300, stars: 3 }
  },
  {
    id: 3,
    title: '第三章：夏日热情',
    description: '阳光灿烂的夏天，花园变得更加热闹了！',
    unlockCondition: { levelsCompleted: 6, decorationsPlaced: 12 },
    reward: { coins: 400, stars: 4 }
  },
  {
    id: 4,
    title: '第四章：秋收冬藏',
    description: '秋天是收获的季节，花园里结满了果实。',
    unlockCondition: { levelsCompleted: 9, decorationsPlaced: 20 },
    reward: { coins: 500, stars: 5 }
  },
  {
    id: 5,
    title: '第五章：梦幻花园',
    description: '恭喜你！你的花园已经成为了远近闻名的梦幻花园！',
    unlockCondition: { levelsCompleted: 12, decorationsPlaced: 25 },
    reward: { coins: 1000, stars: 10 }
  }
];

const SEASONAL_EVENTS = [
  {
    id: 'spring_festival',
    name: '春日庆典',
    emoji: '🌸',
    duration: 7,
    bonusMultiplier: 1.5,
    description: '春天来了！所有奖励增加50%',
    requirement: { level: 1 }
  },
  {
    id: 'summer_event',
    name: '夏日狂欢',
    emoji: '☀️',
    duration: 7,
    bonusMultiplier: 1.3,
    specialDrop: 'ice_cream',
    description: '夏日炎炎，完成关卡获得特殊奖励',
    requirement: { level: 3 }
  },
  {
    id: 'autumn_harvest',
    name: '秋收节',
    emoji: '🍂',
    duration: 7,
    bonusMultiplier: 1.4,
    description: '收获的季节，金币奖励增加40%',
    requirement: { level: 5 }
  },
  {
    id: 'winter_wonderland',
    name: '冬季仙境',
    emoji: '❄️',
    duration: 7,
    bonusMultiplier: 1.6,
    description: '冬日雪景，星星奖励增加60%',
    requirement: { level: 7 }
  },
  {
    id: 'anniversary',
    name: '周年庆典',
    emoji: '🎉',
    duration: 3,
    bonusMultiplier: 2.0,
    description: '感谢你的支持！所有奖励翻倍！',
    requirement: { level: 1 }
  }
];

const DAILY_CHALLENGES = [
  {
    id: 'daily_1',
    name: '快速消除',
    description: '在20步内完成任意关卡',
    target: { moves: 20 },
    reward: { coins: 200, stars: 2 }
  },
  {
    id: 'daily_2',
    name: '收集达人',
    description: '单局消除30个红色方块',
    target: { red: 30 },
    reward: { coins: 150, stars: 1 }
  },
  {
    id: 'daily_3',
    name: '连击大师',
    description: '达成5次连续消除',
    target: { combo: 5 },
    reward: { coins: 250, stars: 2 }
  },
  {
    id: 'daily_4',
    name: '完美通关',
    description: '不使用任何道具完成一个关卡',
    target: { noItems: true },
    reward: { coins: 300, stars: 3 }
  },
  {
    id: 'daily_5',
    name: '装饰大师',
    description: '在花园中放置3个装饰',
    target: { decorations: 3 },
    reward: { coins: 180, stars: 1 }
  }
];

const MOCK_FRIENDS = [
  { id: 1, name: '小明', avatar: '👨', level: 8, gardenLevel: 15, online: true },
  { id: 2, name: '小红', avatar: '👩', level: 10, gardenLevel: 20, online: true },
  { id: 3, name: '老王', avatar: '👴', level: 5, gardenLevel: 8, online: false },
  { id: 4, name: '小李', avatar: '👧', level: 12, gardenLevel: 22, online: true },
  { id: 5, name: '阿花', avatar: '👵', level: 7, gardenLevel: 12, online: false },
  { id: 6, name: '大壮', avatar: '🧔', level: 9, gardenLevel: 18, online: true }
];
