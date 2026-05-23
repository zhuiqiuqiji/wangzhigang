## 多人联机对战 - 技术实现方案

### 1. 架构设计

```
┌─────────────┐       WebSocket       ┌─────────────┐
│   玩家A     │ ◄───────────────────► │   玩家B     │
│  浏览器     │                        │  浏览器     │
└──────┬──────┘                        └──────┬──────┘
       │                                       │
       └───────────────┬───────────────────────┘
                       ▼
              ┌────────────────┐
              │  Socket.io     │
              │  服务器        │
              │  (Node.js)     │
              └────────────────┘
```

### 2. 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Socket.io-client | WebSocket客户端 |
| 后端 | Node.js + Express | Web服务器 |
| 通信 | Socket.io | 实时双向通信 |
| 游戏逻辑 | 共享现有Canvas代码 | 前端独立渲染 |

### 3. 核心数据同步

#### 3.1 房间管理
```javascript
// 服务器端
const rooms = new Map();
// 房间结构
{
  roomId: "room_123",
  players: [
    { id: "player1", score: 0, grid: [...], ready: true },
    { id: "player2", score: 0, grid: [...], ready: false }
  ],
  state: "waiting" | "playing" | "finished",
  winner: null
}
```

#### 3.2 通信协议

| 事件名 | 发送方 | 数据 | 说明 |
|--------|--------|------|------|
| `create_room` | 客户端 | { playerName } | 创建房间 |
| `join_room` | 客户端 | { roomId, playerName } | 加入房间 |
| `room_update` | 服务器 | { room } | 房间状态更新 |
| `game_start` | 服务器 | { level, seed } | 游戏开始 |
| `shoot` | 客户端 | { angle, colorData, x, y } | 发射泡泡 |
| `bubble_stuck` | 客户端 | { row, col, colorData } | 泡泡粘附 |
| `bubbles_removed` | 客户端 | { positions, count } | 消除泡泡 |
| `send_attack` | 客户端 | { rows } | 发送干扰泡泡 |
| `game_over` | 客户端 | { win: boolean } | 游戏结束 |

### 4. 后端服务器实现

#### 4.1 项目结构
```
bubble-shooter-server/
├── package.json
├── server.js          # 主服务器
├── gameLogic.js       # 游戏规则校验
└── roomManager.js     # 房间管理
```

#### 4.2 核心代码示例

```javascript
// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const rooms = new Map();

io.on('connection', (socket) => {
  socket.on('create_room', ({ playerName }) => {
    const roomId = generateRoomId();
    rooms.set(roomId, {
      id: roomId,
      players: [{ id: socket.id, name: playerName, score: 0, ready: false }],
      state: 'waiting'
    });
    socket.join(roomId);
    socket.emit('room_created', { roomId });
  });

  socket.on('join_room', ({ roomId, playerName }) => {
    const room = rooms.get(roomId);
    if (room && room.players.length < 2) {
      room.players.push({ id: socket.id, name: playerName, score: 0, ready: false });
      socket.join(roomId);
      io.to(roomId).emit('room_update', room);
    }
  });

  socket.on('shoot', (data) => {
    const room = getPlayerRoom(socket.id);
    if (room) {
      socket.to(room.id).emit('opponent_shoot', data);
    }
  });

  socket.on('send_attack', ({ rows }) => {
    const room = getPlayerRoom(socket.id);
    if (room) {
      const opponent = room.players.find(p => p.id !== socket.id);
      socket.to(opponent.id).emit('receive_attack', { rows });
    }
  });
});

server.listen(3000, () => console.log('Server running on port 3000'));
```

### 5. 前端集成

#### 5.1 新增对战模式选择界面

```html
<div class="mode-select">
  <button id="btnSingle">单人模式</button>
  <button id="btnMulti">多人对战</button>
</div>
```

#### 5.2 对战核心逻辑

```javascript
// 客户端对战模式
class MultiplayerGame {
  constructor() {
    this.socket = io('http://localhost:3000');
    this.setupEventListeners();
  }

  createRoom() {
    this.socket.emit('create_room', { playerName: '玩家1' });
  }

  joinRoom(roomId) {
    this.socket.emit('join_room', { roomId, playerName: '玩家2' });
  }

  shoot(angle, colorData) {
    super.shoot(angle, colorData);
    this.socket.emit('shoot', { angle, colorData });
    
    // 消除≥5个时发送攻击
    if (removedCount >= 5) {
      this.socket.emit('send_attack', { rows: Math.floor(removedCount / 5) });
    }
  }

  setupEventListeners() {
    this.socket.on('opponent_shoot', (data) => {
      // 显示对手发射动画
    });

    this.socket.on('receive_attack', ({ rows }) => {
      // 在顶部添加干扰泡泡
      for (let i = 0; i < rows; i++) {
        pushDownBubblesWithRandom();
      }
    });

    this.socket.on('opponent_game_over', () => {
      showVictory();
    });
  }
}
```

### 6. 对战规则

- 两名玩家各自有独立的游戏区域
- 各自独立消除泡泡
- 单次消除≥5个泡泡时，向对方发送1排干扰泡泡
- 消除越多，发送越多（每5个=1排）
- 先消除完所有泡泡的玩家获胜
- 或对方失败（泡泡越线）时自动获胜

### 7. 部署方案

1. **本地开发**：`node server.js` 启动后端，前端连接 `localhost:3000`
2. **生产部署**：使用 Vercel/Heroku 部署 Node.js 服务，前端部署到静态托管
3. **跨域处理**：配置 Socket.io CORS 或使用同源部署

### 8. 扩展功能建议

- 聊天系统：实时文字聊天
- 排行榜：记录胜利次数、最高得分
- 匹配系统：自动匹配实力相当的玩家
- 观战模式：允许其他玩家观看比赛
- 回放系统：保存精彩对局供回放
