## 1. 架构设计（v2.0）

```mermaid
flowchart TB
    "A[HTML 页面层]" --> "B[CSS 样式层]"
    "A" --> "C[JS 逻辑层]"
    
    "C" --> "D[游戏核心引擎]"
    "D" --> "D1[状态管理器]"
    "D" --> "D2[资源清理器]"
    "D" --> "D3[事件总线]"
    
    "C" --> "E[掉落物系统]"
    "E" --> "E1[掉落物工厂]"
    "E" --> "E2[8种掉落物逻辑]"
    "E" --> "E3[碰撞检测]"
    
    "C" --> "F[道具系统]"
    "F" --> "F1[道具管理器]"
    "F" --> "F2[5种道具效果]"
    "F" --> "F3[计时控制器]"
    
    "C" --> "G[升级系统]"
    "G" --> "G1[农场等级配置]"
    "G" --> "G2[金币经济]"
    "G" --> "G3[多母鸡管理]"
    
    "C" --> "H[关卡系统]"
    "H" --> "H1[5场景配置]"
    "H" --> "H2[天气特效引擎]"
    
    "C" --> "I[成就系统]"
    "I" --> "I1[成就定义]"
    "I" --> "I2[进度追踪]"
    "I" --> "I3[图鉴展示]"
    
    "C" --> "J[双人模式]"
    "J" --> "J1[双篮控制]"
    "J" --> "J2[颜色匹配]"
    
    "C" --> "K[数据持久化]"
    "K" --> "K1[localStorage 封装]"
    "K" --> "K2[排行榜]"
    "K" --> "K3[每日任务]"
```

## 2. 技术说明

- **前端栈**：纯 HTML5 + CSS3 + Vanilla JavaScript（ES6+）
- **渲染方式**：CSS 定位 + DOM 动画（便于样式扩展和调试）
- **状态管理**：集中式状态对象 + 事件通知机制
- **数据持久化**：localStorage 封装层（带异常处理）
- **模块划分**：按功能拆分子模块，减少耦合

## 3. 项目结构

```
接鸡蛋农场游戏/
├── html/
│   └── index.html              # 主页面（主菜单+游戏+各面板）
├── css/
│   ├── style.css               # 基础样式
│   ├── items.css               # 掉落物/道具样式
│   ├── effects.css             # 特效动画
│   └── ui.css                  # UI面板样式
├── js/
│   ├── game.js                 # 游戏入口+核心循环
│   ├── config.js               # 常量配置（掉落物、道具、关卡）
│   ├── items.js                # 掉落物系统
│   ├── powerups.js             # 道具系统
│   ├── upgrade.js              # 农场升级
│   ├── levels.js               # 关卡/天气
│   ├── achievements.js         # 成就/图鉴
│   ├── storage.js              # 数据持久化
│   └── ui.js                   # UI管理
└── .trae/
    └── documents/
```

## 4. 核心数据模型

### 4.1 游戏状态

```typescript
interface GameState {
  mode: 'menu' | 'single' | 'coop'
  level: number
  score: number
  coins: number
  lives: number
  timeLeft: number
  isRunning: boolean
  isPaused: boolean
  isGameOver: boolean
  farmLevel: number
  activePowerups: ActivePowerup[]
  hens: Hen[]
  stats: GameStats
}

interface ActivePowerup {
  type: PowerupType
  endTime: number
  element: HTMLElement
}

interface GameStats {
  totalEggsCaught: number
  goldenEggsCaught: number
  totalGames: number
  totalPlayTime: number
  bestScore: number
}
```

### 4.2 掉落物配置

```typescript
type ItemType = 
  | 'normal' | 'golden' | 'surprise' 
  | 'chick' | 'poop' | 'bomb' | 'heart'

interface DropItemConfig {
  emoji: string
  score: number
  lifeChange: number
  probability: number
  minFarmLevel: number
  isPowerup: boolean
  className: string
}
```

### 4.3 道具配置

```typescript
type PowerupType = 'speed' | 'wide' | 'magnet' | 'shield' | 'slowmo'

interface PowerupConfig {
  emoji: string
  name: string
  duration: number
  color: string
  description: string
}
```

### 4.4 农场升级配置

```typescript
interface FarmLevelConfig {
  level: number
  name: string
  cost: number
  henCount: number
  eggIntervalMultiplier: number
  unlockedItems: ItemType[]
}
```

### 4.5 关卡配置

```typescript
interface LevelConfig {
  id: number
  name: string
  backgroundGradient: string[]
  weather: 'sunny' | 'windy' | 'rain' | 'snow' | 'lightning'
  dropSpeedModifier: number
  goldenEggBonus: number
  specialEffect?: string
}
```

## 5. 关键参数表

### 5.1 掉落物配置

| 类型 | 图标 | 分数 | 生命变化 | 基础概率 | 最低农场等级 |
|------|------|------|----------|----------|--------------|
| normal | 🥚 | +10 | 0 | 65% | 1 |
| golden | 🪙 | +50 | 0 | 5% | 2 |
| surprise | 🎁 | 0 | 0 | 3% | 3 |
| chick | 🐥 | +25 | 0 | 2% | 4 |
| poop | 💩 | -20 | 0 | 15% | 1 |
| bomb | 💣 | 0 | -1 | 8% | 1 |
| heart | ❤️ | 0 | +1 | 2% | 5 |

### 5.2 道具配置

| 类型 | 图标 | 名称 | 持续时间 | 效果 |
|------|------|------|----------|------|
| speed | ⚡ | 极速移动 | 8s | 篮子速度+50% |
| wide | 📏 | 超宽篮子 | 10s | 篮子宽度+50% |
| magnet | 🧲 | 磁力吸附 | 6s | 鸡蛋自动吸引 |
| shield | 🛡️ | 无敌护盾 | 5s | 免疫负面效果 |
| slowmo | ⏸️ | 时间减速 | 7s | 掉落速度-50% |

### 5.3 农场升级配置

| 等级 | 名称 | 升级花费 | 母鸡数 | 下蛋频率 | 新增掉落物 |
|------|------|----------|--------|----------|------------|
| 1 | 基础鸡窝 | 0 | 1 | 1.0x | 普通蛋/粪便/炸弹 |
| 2 | 升级鸡窝 | 500 | 1 | 0.85x | 金蛋 |
| 3 | 豪华鸡窝 | 1500 | 2 | 0.75x | 彩蛋 |
| 4 | 黄金鸡窝 | 4000 | 2 | 0.70x | 小鸡 |
| 5 | 传说鸡窝 | 10000 | 3 | 0.60x | 爱心 |

## 6. 存储数据结构

```typescript
interface SaveData {
  version: 2
  coins: number
  farmLevel: number
  highScores: number[]
  achievements: string[]
  collection: Record<string, number>
  dailyTasks: DailyTask[]
  lastPlayDate: string
  stats: GameStats
}

interface DailyTask {
  id: string
  description: string
  target: number
  current: number
  reward: number
  completed: boolean
  claimed: boolean
}
```
