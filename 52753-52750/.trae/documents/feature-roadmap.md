## 节奏大师功能迭代技术方案

### 功能优先级划分

| 优先级 | 功能 | 复杂度 | 预计工时 | 依赖 |
|--------|------|--------|----------|------|
| P0 | 多种音符类型 | 高 | 2天 | 类型扩展 |
| P0 | 皮肤主题系统 | 中 | 1天 | 无 |
| P1 | 变速谱面系统 | 高 | 2天 | 类型扩展 |
| P1 | 节拍编辑器基础版 | 高 | 3天 | 多种音符 |
| P1 | 录像回放功能 | 高 | 2天 | 游戏循环扩展 |
| P2 | MIDI文件导入 | 极高 | 3天 | 节拍编辑器 |
| P2 | 在线曲库社区 | 极高 | 5天+ | 后端服务 |
| P2 | MIDI硬件支持 | 极高 | 3天 | Web MIDI API |

---

## 1. 多种音符类型

### 数据模型扩展

```typescript
type NoteType = 'tap' | 'hold' | 'slide' | 'rapid';

interface BaseNote {
  id: number;
  track: number;
  time: number;
  type: NoteType;
  hit: boolean;
  judge?: JudgeType;
  y?: number;
}

interface TapNote extends BaseNote {
  type: 'tap';
}

interface HoldNote extends BaseNote {
  type: 'hold';
  duration: number;      // 持续时间(ms)
  holdProgress: number;  // 0-1
}

interface SlideNote extends BaseNote {
  type: 'slide';
  endTrack: number;      // 滑条终点轨道
}

interface RapidNote extends BaseNote {
  type: 'rapid';
  count: number;         // 连打次数
  interval: number;      // 连打间隔
}

type Note = TapNote | HoldNote | SlideNote | RapidNote;
```

### 渲染逻辑
- TapNote: 普通方块，击中即消失
- HoldNote: 长条，需要按住直到结束
- SlideNote: 箭头指示，从起始轨道滑到终点轨道
- RapidNote: 快速连打，显示剩余次数

---

## 2. 变速谱面系统

### 数据模型

```typescript
interface BPMChange {
  time: number;      // 触发时间
  bpm: number;       // 新BPM
  transition?: number; // 渐变过渡时间(ms)
}

interface Song {
  id: string;
  name: string;
  baseBpm: number;
  bpmChanges: BPMChange[];
  duration: number;
  noteData: Record<Difficulty, NoteData[]>;
}
```

### 实现方案
- 游戏循环中根据当前时间计算实时BPM
- 音符下落速度 = baseSpeed * (currentBpm / baseBpm)
- 支持瞬时变速和渐变变速两种模式
- 编辑器中可添加BPM变化点

---

## 3. 皮肤主题系统

### 主题配置

```typescript
interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    background: string;
    trackBg: string;
    trackActive: string;
    judgeLine: string;
    notes: string[];  // 4个轨道的音符颜色
    text: string;
    accent: string;
  };
  noteStyle: 'rounded' | 'sharp' | 'pill' | 'diamond';
  effects: {
    glow: boolean;
    particles: boolean;
    trail: boolean;
  };
}
```

### 内置主题
- 霓虹经典（默认）
- 简约黑白
- 赛博朋克
- 清新 pastel
- 复古像素

### 实现方案
- 使用 CSS 变量动态切换主题
- 主题配置存储在 localStorage
- 支持自定义主题导出/导入

---

## 4. 节拍编辑器

### 功能模块
1. **时间轴编辑器** - 可视化放置音符
2. **BPM 编辑器** - 设置和调整 BPM 变化
3. **属性面板** - 编辑选中音符的参数
4. **预览播放** - 实时预览谱面效果
5. **导入导出** - JSON 格式、MIDI 导入（进阶）

### UI 布局
```
┌─────────────────────────────────────────────────────┐
│ 工具栏: 保存 导入 导出 预览 撤销 重做                │
├──────────────┬──────────────────────────────────────┤
│              │  时间轴刻度 (0:00 ─────────── 2:00) │
│ 轨道选择器   │  ┌─────────────────────────────────┐ │
│ D F J K      │  │  音符块可拖拽                    │ │
│              │  │  支持多选、复制、粘贴            │ │
│              │  └─────────────────────────────────┘ │
├──────────────┼──────────────────────────────────────┤
│ 属性面板     │  选中音符的详细参数编辑              │
└──────────────┴──────────────────────────────────────┘
```

---

## 5. 录像回放系统

### 数据模型

```typescript
interface ReplayFrame {
  time: number;
  inputs: boolean[];  // 4个轨道的按键状态
  notes: NoteState[]; // 所有音符状态快照
}

interface ReplayData {
  version: string;
  songId: string;
  difficulty: Difficulty;
  gameStatus: GameStatus;
  frames: ReplayFrame[];
  playerName: string;
  timestamp: number;
}
```

### 实现方案
- 游戏过程中每隔 16ms 录制一帧
- 使用二进制压缩存储帧数据
- 回放时使用相同的游戏逻辑渲染
- 支持倍速播放（0.5x, 1x, 2x, 4x）
- 支持导出为视频（进阶）

---

## 6. 在线曲库系统（后端依赖）

### 架构设计
```
前端 ── GraphQL ── Node.js 服务 ── PostgreSQL
                        │
                        ├─ 文件存储 (谱面 JSON)
                        └─ 用户认证 (JWT)
```

### 核心功能
- 用户注册/登录
- 谱面上传/下载
- 评分评论系统
- 排行榜
- 收藏夹
- 版本管理

---

## 7. MIDI 硬件支持

### Web MIDI API 集成
```typescript
interface MIDIDevice {
  id: string;
  name: string;
  type: 'keyboard' | 'pad' | 'other';
  inputs: MIDIInput[];
  outputs: MIDIOutput[];
}

interface MIDIMapping {
  noteNumber: number;  // MIDI 音符编号
  track: number;       // 映射到游戏轨道
}
```

### 功能
- 自动检测 MIDI 设备
- 自定义按键映射
- 支持力度感应（可选）
- 延迟校准

---

## 实施阶段规划

### 第一阶段（核心功能）
1. 扩展类型定义
2. 实现多种音符类型
3. 实现皮肤主题系统
4. 更新游戏主循环支持新音符

### 第二阶段（进阶功能）
5. 实现变速谱面系统
6. 开发节拍编辑器
7. 实现录像回放功能

### 第三阶段（高级功能，需要后端）
8. MIDI 文件导入
9. 在线曲库系统
10. MIDI 硬件支持
