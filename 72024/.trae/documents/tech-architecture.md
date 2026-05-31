## 1. 架构设计

```mermaid
flowchart TB
    "A[HTML 页面层]" --> "B[CSS 样式层]"
    "A" --> "C[JS 逻辑层]"
    "C" --> "D[游戏引擎模块]"
    "D" --> "E[母鸡管理器]"
    "D" --> "F[鸡蛋管理器]"
    "D" --> "G[篮子控制器]"
    "D" --> "H[碰撞检测器]"
    "D" --> "I[计分与生命系统]"
    "D" --> "J[难度调节器]"
    "D" --> "K[计时器]"
```

## 2. 技术说明

- **前端**：纯 HTML5 + CSS3 + Vanilla JavaScript（ES6+）
- **渲染方式**：CSS 定位 + DOM 动画（不使用 Canvas，便于样式控制）
- **项目结构**：
  ```
  接鸡蛋农场游戏/
  ├── html/
  │   └── index.html
  ├── css/
  │   └── style.css
  ├── js/
  │   └── game.js
  └── .trae/
      └── documents/
  ```
- **无需后端服务**，无需数据库，纯前端单页游戏
- **数据持久化**：使用 localStorage 保存历史最高分

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 游戏主页面（单页应用，无路由切换） |

## 4. 游戏核心数据模型

### 4.1 游戏状态

```typescript
interface GameState {
  score: number
  lives: number
  maxLives: number
  timeLeft: number
  gameDuration: number
  isRunning: boolean
  isPaused: boolean
  isGameOver: boolean
  difficulty: number
  highScore: number
}
```

### 4.2 实体模型

```typescript
interface Hen {
  x: number
  y: number
  speed: number
  direction: 1 | -1
  element: HTMLElement
}

interface Egg {
  x: number
  y: number
  speed: number
  type: 'normal' | 'bad' | 'bomb'
  swingAngle: number
  element: HTMLElement
}

interface Basket {
  x: number
  width: number
  height: number
  speed: number
  element: HTMLElement
}
```

### 4.3 游戏参数

| 参数 | 初始值 | 说明 |
|------|--------|------|
| 初始生命 | 5 | 心形图标展示 |
| 游戏时长 | 120秒 | 倒计时 |
| 普通蛋得分 | +10 | 接住得分 |
| 坏蛋扣分 | -15 | 接住扣分 |
| 炸弹扣命 | -1 | 接住扣命 |
| 落地扣命 | -1 | 普通蛋未接住 |
| 难度提升阈值 | 每50分 | 掉落速度增加 |
| 坏蛋概率 | 10% | 随机混入 |
| 炸弹概率 | 5% | 随机混入 |
| 下蛋间隔 | 1.5秒~2.5秒 | 随机间隔 |
| 初始掉落速度 | 2px/帧 | 随难度递增 |
