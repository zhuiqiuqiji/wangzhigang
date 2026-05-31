## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        "HTML 结构层" --> "CSS 样式层"
        "CSS 样式层" --> "JS 逻辑层"
    end
    subgraph "JS 逻辑层"
        "SolarSystem 引擎" --> "渲染器 Renderer"
        "SolarSystem 引擎" --> "行星数据 PlanetData"
        "SolarSystem 引擎" --> "时间控制器 TimeController"
        "SolarSystem 引擎" --> "交互控制器 InteractionController"
        "渲染器 Renderer" --> "Canvas 2D"
        "交互控制器 InteractionController" --> "缩放/平移/点击"
    end
    subgraph "数据层"
        "行星数据 PlanetData" --> "八大行星静态数据"
    end
```

## 2. 技术说明

- **前端**：原生 HTML5 + CSS3 + JavaScript（ES2020）
- **不使用框架**：本项目为 Canvas 2D 模拟，无需 React/Vue 等框架
- **构建工具**：无，直接浏览器打开即可运行（可选简易 HTTP 服务器）
- **后端**：无
- **数据**：内置静态 JSON 数据集（八大行星真实天文数据）

### 项目目录结构

```
太阳系模拟/
├── html/
│   └── index.html          # 主页面
├── css/
│   └── style.css           # 全局样式
├── js/
│   ├── main.js             # 入口文件，初始化
│   ├── solar-system.js     # 太阳系引擎核心
│   ├── renderer.js         # Canvas 渲染器
│   ├── planets.js          # 行星数据定义
│   ├── time-controller.js  # 时间控制逻辑
│   └── interaction.js      # 交互控制（缩放/平移/点击）
└── .trae/
    └── documents/          # 项目文档
```

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 主页面，太阳系模拟器 |

## 4. API 定义

无后端 API，所有数据内置。

## 5. 核心数据结构

### 5.1 行星数据模型

```typescript
interface Planet {
  name: string           // 行星名称
  nameEn: string         // 英文名
  color: string          // 渲染颜色
  radius: number         // 行星半径(km，用于信息显示)
  displayRadius: number  // 显示半径(px，对数缩放)
  orbitRadius: number    // 轨道半径(AU)
  displayOrbitRadius: number // 显示轨道半径(px，对数缩放)
  period: number         // 公转周期(地球年)
  temperature: string    // 表面温度
  distanceFromSun: string // 距日距离
  diameter: string       // 直径
  description: string    // 简介
  angle: number          // 当前公转角度(弧度)
  angularSpeed: number   // 角速度(弧度/帧)
}
```

### 5.2 时间控制状态

```typescript
interface TimeState {
  speed: number        // 当前倍速 (0=暂停, 1=正常, 2/5/10=加速, 0.5=减速)
  isPaused: boolean    // 是否暂停
  elapsedDays: number  // 已流逝天数
}
```

### 5.3 视图状态

```typescript
interface ViewState {
  offsetX: number      // 画布偏移X
  offsetY: number      // 画布偏移Y
  zoom: number         // 缩放比例
  rotation: number     // 旋转角度
}
```

## 6. 渲染策略

- **帧率**：requestAnimationFrame 驱动，目标 60fps
- **行星位置计算**：每帧根据角速度 × 时间倍速更新角度
- **轨道绘制**：以太阳为中心画半透明虚线圆
- **行星绘制**：径向渐变圆 + 外发光效果
- **太阳绘制**：多层径向渐变 + 脉动动画
- **背景星点**：初始化时随机生成，缓存到离屏 Canvas
- **碰撞检测**：点击时计算鼠标坐标与行星显示坐标距离
