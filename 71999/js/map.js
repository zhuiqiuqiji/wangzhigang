const TileType = {
    WALL: 0,
    FLOOR: 1,
    DOOR_LOCKED: 2,
    DOOR_OPEN: 3,
    EXIT: 4,
    CHEST: 5,
    STAIRS_DOWN: 6
};

class GameMap {
    constructor(width, height, rng, floor) {
        this.width = width;
        this.height = height;
        this.tileSize = 32;
        this.tiles = [];
        this.rooms = [];
        this.exploredRooms = 0;
        this.rng = rng;
        this.floor = floor;
    }

    generate() {
        this.tiles = [];
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = TileType.WALL;
            }
        }

        this.rooms = [];
        const baseRooms = 5 + Math.floor(this.rng.random() * 4);
        const roomCount = baseRooms + Math.min(this.floor, 3);
        
        for (let i = 0; i < roomCount * 4; i++) {
            const room = this.createRoom();
            let overlaps = false;
            
            for (const existingRoom of this.rooms) {
                if (this.roomsOverlap(room, existingRoom)) {
                    overlaps = true;
                    break;
                }
            }
            
            if (!overlaps && this.rooms.length < roomCount) {
                this.rooms.push(room);
                this.carveRoom(room);
            }
        }

        for (let i = 1; i < this.rooms.length; i++) {
            this.connectRooms(this.rooms[i - 1], this.rooms[i]);
        }

        this.placeDoors();
        this.placeChests();
        this.placeStairs();
    }

    createRoom() {
        const minSize = 4;
        const maxSize = 8 + Math.min(this.floor, 2);
        const width = minSize + this.rng.nextInt(maxSize - minSize);
        const height = minSize + this.rng.nextInt(maxSize - minSize);
        const x = 1 + this.rng.nextInt(this.width - width - 2);
        const y = 1 + this.rng.nextInt(this.height - height - 2);
        
        return { x, y, width, height, centerX: Math.floor(x + width / 2), centerY: Math.floor(y + height / 2) };
    }

    roomsOverlap(room1, room2, padding = 1) {
        return !(room1.x + room1.width + padding < room2.x ||
                 room2.x + room2.width + padding < room1.x ||
                 room1.y + room1.height + padding < room2.y ||
                 room2.y + room2.height + padding < room1.y);
    }

    carveRoom(room) {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                if (y > 0 && y < this.height - 1 && x > 0 && x < this.width - 1) {
                    this.tiles[y][x] = TileType.FLOOR;
                }
            }
        }
    }

    connectRooms(room1, room2) {
        let x = room1.centerX;
        let y = room1.centerY;
        
        const xDir = room2.centerX > x ? 1 : -1;
        while (x !== room2.centerX) {
            if (y > 0 && y < this.height - 1 && x > 0 && x < this.width - 1) {
                this.tiles[y][x] = TileType.FLOOR;
            }
            x += xDir;
        }
        
        const yDir = room2.centerY > y ? 1 : -1;
        while (y !== room2.centerY) {
            if (y > 0 && y < this.height - 1 && x > 0 && x < this.width - 1) {
                this.tiles[y][x] = TileType.FLOOR;
            }
            y += yDir;
        }
    }

    placeDoors() {
        let lockedDoorsPlaced = 0;
        const maxLockedDoors = 1 + Math.min(this.floor, 2);
        
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.tiles[y][x] === TileType.FLOOR) {
                    const isHorizontalCorridor = 
                        this.tiles[y-1][x] === TileType.WALL &&
                        this.tiles[y+1][x] === TileType.WALL &&
                        this.tiles[y][x-1] === TileType.FLOOR &&
                        this.tiles[y][x+1] === TileType.FLOOR;
                    
                    const isVerticalCorridor = 
                        this.tiles[y][x-1] === TileType.WALL &&
                        this.tiles[y][x+1] === TileType.WALL &&
                        this.tiles[y-1][x] === TileType.FLOOR &&
                        this.tiles[y+1][x] === TileType.FLOOR;
                    
                    if ((isHorizontalCorridor || isVerticalCorridor) && 
                        this.rng.nextBool(0.15) && 
                        lockedDoorsPlaced < maxLockedDoors) {
                        this.tiles[y][x] = TileType.DOOR_LOCKED;
                        lockedDoorsPlaced++;
                    }
                }
            }
        }
    }

    placeChests() {
        const chestCount = 1 + this.rng.nextInt(Math.min(this.floor + 1, 4));
        for (let i = 0; i < chestCount && i < this.rooms.length - 1; i++) {
            const room = this.rooms[this.rng.nextIntRange(1, this.rooms.length)];
            let placed = false;
            for (let attempt = 0; attempt < 10 && !placed; attempt++) {
                const cx = room.x + this.rng.nextInt(room.width);
                const cy = room.y + this.rng.nextInt(room.height);
                if (this.tiles[cy][cx] === TileType.FLOOR) {
                    this.tiles[cy][cx] = TileType.CHEST;
                    placed = true;
                }
            }
        }
    }

    placeStairs() {
        if (this.rooms.length > 1) {
            const lastRoom = this.rooms[this.rooms.length - 1];
            this.tiles[lastRoom.centerY][lastRoom.centerX] = TileType.STAIRS_DOWN;
        }
        if (this.rooms.length > 0) {
            const firstRoom = this.rooms[0];
            this.tiles[firstRoom.centerY + 1 < this.height ? firstRoom.centerY + 1 : firstRoom.centerY][firstRoom.centerX] = TileType.EXIT;
        }
    }

    getSpawnPosition() {
        if (this.rooms.length > 0) {
            const firstRoom = this.rooms[0];
            return { x: firstRoom.centerX, y: firstRoom.centerY };
        }
        return { x: 2, y: 2 };
    }

    isWalkable(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
        const tile = this.tiles[y][x];
        return tile === TileType.FLOOR || tile === TileType.DOOR_OPEN || tile === TileType.EXIT || tile === TileType.CHEST || tile === TileType.STAIRS_DOWN;
    }

    isLockedDoor(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
        return this.tiles[y][x] === TileType.DOOR_LOCKED;
    }

    isChest(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
        return this.tiles[y][x] === TileType.CHEST;
    }

    openChest(x, y) {
        if (this.isChest(x, y)) {
            this.tiles[y][x] = TileType.FLOOR;
            return true;
        }
        return false;
    }

    openDoor(x, y) {
        if (this.isLockedDoor(x, y)) {
            this.tiles[y][x] = TileType.DOOR_OPEN;
            return true;
        }
        return false;
    }

    isExit(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
        return this.tiles[y][x] === TileType.EXIT;
    }

    isStairsDown(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
        return this.tiles[y][x] === TileType.STAIRS_DOWN;
    }

    getRandomFloorPositions(count) {
        const positions = [];
        const floorTiles = [];
        
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.tiles[y][x] === TileType.FLOOR) {
                    floorTiles.push({ x, y });
                }
            }
        }

        const shuffled = this.rng ? this.rng.shuffle(floorTiles) : floorTiles;
        for (let i = 0; i < count && i < shuffled.length; i++) {
            positions.push(shuffled[i]);
        }
        
        return positions;
    }

    getFloorPositionsExcludingStart(count, startX, startY, minDistance = 5) {
        const floorTiles = [];
        
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.tiles[y][x] === TileType.FLOOR) {
                    const distance = Math.abs(x - startX) + Math.abs(y - startY);
                    if (distance >= minDistance) {
                        floorTiles.push({ x, y });
                    }
                }
            }
        }

        const shuffled = this.rng ? this.rng.shuffle(floorTiles) : floorTiles;
        return shuffled.slice(0, count);
    }

    render(ctx) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                const px = x * this.tileSize;
                const py = y * this.tileSize;
                
                switch (tile) {
                    case TileType.WALL: this.drawWall(ctx, px, py); break;
                    case TileType.FLOOR: this.drawFloor(ctx, px, py); break;
                    case TileType.DOOR_LOCKED: this.drawFloor(ctx, px, py); this.drawLockedDoor(ctx, px, py); break;
                    case TileType.DOOR_OPEN: this.drawFloor(ctx, px, py); this.drawOpenDoor(ctx, px, py); break;
                    case TileType.EXIT: this.drawFloor(ctx, px, py); this.drawExit(ctx, px, py); break;
                    case TileType.CHEST: this.drawFloor(ctx, px, py); this.drawChest(ctx, px, py); break;
                    case TileType.STAIRS_DOWN: this.drawFloor(ctx, px, py); this.drawStairs(ctx, px, py); break;
                }
            }
        }
    }

    drawWall(ctx, x, y) {
        const wallShade = this.floor > 3 ? '#3d2d44' : '#2d2d44';
        ctx.fillStyle = wallShade;
        ctx.fillRect(x, y, this.tileSize, this.tileSize);
        ctx.fillStyle = this.floor > 3 ? '#4d3d5c' : '#3d3d5c';
        ctx.fillRect(x + 2, y + 2, this.tileSize - 4, this.tileSize - 4);
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(x, y + this.tileSize - 4, this.tileSize, 4);
        ctx.fillRect(x + this.tileSize - 4, y, 4, this.tileSize);
    }

    drawFloor(ctx, x, y) {
        const floorShade = this.floor > 3 ? '#3d2522' : '#3d3522';
        ctx.fillStyle = floorShade;
        ctx.fillRect(x, y, this.tileSize, this.tileSize);
        ctx.fillStyle = '#4a4030';
        if ((x + y) % 64 === 0) ctx.fillRect(x + 8, y + 8, 4, 4);
        if ((x * y) % 128 === 0) ctx.fillRect(x + 20, y + 16, 4, 4);
    }

    drawLockedDoor(ctx, x, y) {
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x + 4, y + 4, this.tileSize - 8, this.tileSize - 8);
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x + this.tileSize / 2, y + this.tileSize / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.fillRect(x + this.tileSize / 2 - 2, y + this.tileSize / 2 - 1, 4, 6);
    }

    drawOpenDoor(ctx, x, y) {
        ctx.fillStyle = '#654321';
        ctx.fillRect(x + 2, y + 4, 8, this.tileSize - 8);
        ctx.fillRect(x + this.tileSize - 10, y + 4, 8, this.tileSize - 8);
    }

    drawExit(ctx, x, y) {
        const glow = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 215, 0, ${glow * 0.3})`;
        ctx.beginPath();
        ctx.arc(x + this.tileSize / 2, y + this.tileSize / 2, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x + 8, y + 4, this.tileSize - 16, this.tileSize - 8);
        ctx.fillStyle = '#ffec8b';
        ctx.fillRect(x + 12, y + 8, this.tileSize - 24, this.tileSize - 16);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⬆', x + this.tileSize / 2, y + this.tileSize / 2 + 4);
    }

    drawChest(ctx, x, y) {
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x + 6, y + 10, this.tileSize - 12, this.tileSize - 14);
        ctx.fillStyle = '#a0522d';
        ctx.fillRect(x + 6, y + 8, this.tileSize - 12, 6);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x + this.tileSize / 2 - 3, y + 14, 6, 6);
        ctx.fillStyle = '#daa520';
        ctx.fillRect(x + this.tileSize / 2 - 2, y + 9, 4, 4);
    }

    drawStairs(ctx, x, y) {
        const glow = Math.sin(Date.now() / 300) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(100, 200, 255, ${glow * 0.3})`;
        ctx.beginPath();
        ctx.arc(x + this.tileSize / 2, y + this.tileSize / 2, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4a90d9';
        ctx.fillRect(x + 8, y + 4, this.tileSize - 16, this.tileSize - 8);
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(x + 12, y + 8, this.tileSize - 24, this.tileSize - 16);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⬇', x + this.tileSize / 2, y + this.tileSize / 2 + 4);
    }
}
