const BLOCK_TYPES = [
  { id: 'red', color: '#FF6B6B', emoji: '🔴', name: '红色' },
  { id: 'blue', color: '#4ECDC4', emoji: '🔵', name: '蓝色' },
  { id: 'green', color: '#95E1A3', emoji: '🟢', name: '绿色' },
  { id: 'yellow', color: '#FFE66D', emoji: '🟡', name: '黄色' },
  { id: 'purple', color: '#C44DFF', emoji: '🟣', name: '紫色' },
  { id: 'orange', color: '#FFA07A', emoji: '🟠', name: '橙色' }
];

const BOARD_ROWS = 8;
const BOARD_COLS = 8;

const LEVELS = EXTENDED_LEVELS;
const SHOP_ITEMS = EXTENDED_SHOP_ITEMS;

const DECORATION_CATEGORY_NAMES = {
  flowers: '🌸 花卉',
  trees: '🌳 树木',
  plants: '🌿 植物',
  animals: '🐱 动物',
  buildings: '🏡 建筑',
  decorations: '⭐ 装饰',
  seasonal: '🎄 季节限定'
};

const GOAL_TYPE_NAMES = {
  collect: '收集方块',
  score: '达到分数',
  clear_obstacle: '清除障碍',
  collect_order: '顺序收集',
  drop_items: '坠落物品',
  time_limit: '限时挑战'
};
