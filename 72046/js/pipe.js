const DIRECTION = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
};

const OPPOSITE = {
    [DIRECTION.UP]: DIRECTION.DOWN,
    [DIRECTION.RIGHT]: DIRECTION.LEFT,
    [DIRECTION.DOWN]: DIRECTION.UP,
    [DIRECTION.LEFT]: DIRECTION.RIGHT
};

const DIR_OFFSET = {
    [DIRECTION.UP]: { row: -1, col: 0 },
    [DIRECTION.RIGHT]: { row: 0, col: 1 },
    [DIRECTION.DOWN]: { row: 1, col: 0 },
    [DIRECTION.LEFT]: { row: 0, col: -1 }
};

const PIPE_TYPES = {
    STRAIGHT: 'straight',
    CURVE: 'curve',
    T_PIPE: 't-pipe',
    CROSS: 'cross',
    START: 'start',
    END: 'end',
    VALVE: 'valve',
    PUMP: 'pump',
    BLOCKED: 'blocked',
    LEAKING: 'leaking'
};

const PIPE_LABELS = {
    [PIPE_TYPES.STRAIGHT]: '直管',
    [PIPE_TYPES.CURVE]: '弯管',
    [PIPE_TYPES.T_PIPE]: 'T型管',
    [PIPE_TYPES.CROSS]: '十字管',
    [PIPE_TYPES.START]: '起点',
    [PIPE_TYPES.END]: '终点',
    [PIPE_TYPES.VALVE]: '阀门',
    [PIPE_TYPES.PUMP]: '增压泵',
    [PIPE_TYPES.BLOCKED]: '堵塞',
    [PIPE_TYPES.LEAKING]: '漏水'
};

const PIPE_OPENINGS = {
    [PIPE_TYPES.STRAIGHT]: [DIRECTION.UP, DIRECTION.DOWN],
    [PIPE_TYPES.CURVE]: [DIRECTION.UP, DIRECTION.RIGHT],
    [PIPE_TYPES.T_PIPE]: [DIRECTION.UP, DIRECTION.LEFT, DIRECTION.RIGHT],
    [PIPE_TYPES.CROSS]: [DIRECTION.UP, DIRECTION.DOWN, DIRECTION.LEFT, DIRECTION.RIGHT],
    [PIPE_TYPES.START]: [DIRECTION.RIGHT],
    [PIPE_TYPES.END]: [DIRECTION.LEFT],
    [PIPE_TYPES.VALVE]: [DIRECTION.UP, DIRECTION.DOWN],
    [PIPE_TYPES.PUMP]: [DIRECTION.LEFT, DIRECTION.RIGHT],
    [PIPE_TYPES.BLOCKED]: [],
    [PIPE_TYPES.LEAKING]: [DIRECTION.UP, DIRECTION.DOWN]
};

const LIQUID_TYPES = {
    WATER: 'water',
    SEWAGE: 'sewage',
    STEAM: 'steam'
};

const LIQUID_CONFIG = {
    [LIQUID_TYPES.WATER]: {
        name: '清水',
        color: '#0ea5e9',
        glowColor: 'rgba(14, 165, 233, 0.6)',
        particleColor: '#38bdf8',
        icon: '💧'
    },
    [LIQUID_TYPES.SEWAGE]: {
        name: '污水',
        color: '#65a30d',
        glowColor: 'rgba(101, 163, 13, 0.6)',
        particleColor: '#84cc16',
        icon: '🟢'
    },
    [LIQUID_TYPES.STEAM]: {
        name: '蒸汽',
        color: '#e2e8f0',
        glowColor: 'rgba(226, 232, 240, 0.6)',
        particleColor: '#f1f5f9',
        icon: '♨️'
    }
};

class Pipe {
    constructor(type, row, col) {
        this.type = type;
        this.row = row;
        this.col = col;
        this.rotation = 0;
        this.isConnected = false;
        this.isStart = type === PIPE_TYPES.START;
        this.isEnd = type === PIPE_TYPES.END;
        this.isValve = type === PIPE_TYPES.VALVE;
        this.isPump = type === PIPE_TYPES.PUMP;
        this.isBlocked = type === PIPE_TYPES.BLOCKED;
        this.isLeaking = type === PIPE_TYPES.LEAKING;
        this.valveOpen = true;
        this.blockageCleared = false;
        this.leakFixed = false;
        this.liquidType = LIQUID_TYPES.WATER;
        this.waterFlowing = false;
    }

    getOpenings() {
        if (this.isBlocked && !this.blockageCleared) {
            return [];
        }
        if (this.isValve && !this.valveOpen) {
            return [];
        }
        const baseOpenings = PIPE_OPENINGS[this.type];
        const rotationSteps = this.rotation / 90;
        return baseOpenings.map(dir => (dir + rotationSteps) % 4);
    }

    hasOpening(direction) {
        return this.getOpenings().includes(direction);
    }

    rotate() {
        if (this.isStart || this.isEnd || this.isBlocked || this.isLeaking) return;
        this.rotation = (this.rotation + 90) % 360;
    }

    setRotation(rotation) {
        this.rotation = rotation % 360;
    }

    randomRotation() {
        if (this.isStart || this.isEnd || this.isBlocked || this.isLeaking) return;
        const rotations = [0, 90, 180, 270];
        this.rotation = rotations[Math.floor(Math.random() * rotations.length)];
    }

    toggleValve() {
        if (this.isValve) {
            this.valveOpen = !this.valveOpen;
        }
    }

    clearBlockage() {
        if (this.isBlocked) {
            this.blockageCleared = true;
            this.type = PIPE_TYPES.STRAIGHT;
            this.isBlocked = false;
            this.rotation = Math.random() > 0.5 ? 0 : 90;
        }
    }

    fixLeak() {
        if (this.isLeaking) {
            this.leakFixed = true;
            this.isLeaking = false;
        }
    }

    setLiquidType(type) {
        this.liquidType = type;
    }

    renderSVG() {
        const size = 60;
        const center = size / 2;
        const pipeWidth = 12;

        let pathD = '';
        let extraElements = '';

        switch (this.type) {
            case PIPE_TYPES.STRAIGHT:
                pathD = `M ${center} 0 L ${center} ${size}`;
                break;
            case PIPE_TYPES.CURVE:
                pathD = `M ${center} 0 Q ${center} ${center} ${size} ${center}`;
                break;
            case PIPE_TYPES.T_PIPE:
                pathD = `M 0 ${center} L ${size} ${center} M ${center} 0 L ${center} ${center}`;
                break;
            case PIPE_TYPES.CROSS:
                pathD = `M ${center} 0 L ${center} ${size} M 0 ${center} L ${size} ${center}`;
                break;
            case PIPE_TYPES.START:
                pathD = `M ${center} ${center} L ${size} ${center}`;
                break;
            case PIPE_TYPES.END:
                pathD = `M 0 ${center} L ${center} ${center}`;
                break;
            case PIPE_TYPES.VALVE:
                pathD = `M ${center} 0 L ${center} ${size}`;
                extraElements = `
                    <circle cx="${center}" cy="${center}" r="10" fill="currentColor" opacity="0.3" />
                    <circle cx="${center}" cy="${center}" r="6" fill="currentColor" opacity="0.6" />
                    <line x1="${center - 8}" y1="${center}" x2="${center + 8}" y2="${center}" 
                          stroke="currentColor" stroke-width="2" />
                `;
                break;
            case PIPE_TYPES.PUMP:
                pathD = `M 0 ${center} L ${size} ${center}`;
                extraElements = `
                    <rect x="${center - 10}" y="${center - 12}" width="20" height="24" rx="4" 
                          fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1.5" />
                    <polygon points="${center - 4},${center - 6} ${center + 4},${center} ${center - 4},${center + 6}" 
                             fill="currentColor" opacity="0.7" />
                `;
                break;
            case PIPE_TYPES.BLOCKED:
                pathD = '';
                extraElements = `
                    <rect x="8" y="8" width="${size - 16}" height="${size - 16}" rx="8" 
                          fill="none" stroke="#64748b" stroke-width="4" stroke-dasharray="4,4" />
                    <text x="${center}" y="${center + 8}" text-anchor="middle" font-size="24" fill="#ef4444">✕</text>
                `;
                break;
            case PIPE_TYPES.LEAKING:
                pathD = `M ${center} 0 L ${center} ${size}`;
                extraElements = `
                    <circle cx="${center - 12}" cy="${center}" r="4" fill="#0ea5e9" opacity="0.7" />
                    <circle cx="${center + 12}" cy="${center + 5}" r="3" fill="#0ea5e9" opacity="0.6" />
                    <circle cx="${center - 8}" cy="${center + 14}" r="3" fill="#0ea5e9" opacity="0.5" />
                `;
                break;
        }

        const liquidConfig = LIQUID_CONFIG[this.liquidType];
        const strokeColor = this.waterFlowing ? liquidConfig.color : '#64748b';
        const filterStyle = this.waterFlowing ? `drop-shadow(0 0 8px ${liquidConfig.glowColor})` : 'none';

        return `
            <svg class="pipe-svg" viewBox="0 0 ${size} ${size}" style="color: ${strokeColor}">
                <defs>
                    <filter id="glow-${this.row}-${this.col}">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                ${pathD ? `<path class="pipe-path" d="${pathD}" style="stroke: ${strokeColor}; filter: ${filterStyle};" />` : ''}
                ${extraElements}
            </svg>
        `;
    }

    render() {
        const cell = document.createElement('div');
        cell.className = 'pipe-cell';
        cell.dataset.row = this.row;
        cell.dataset.col = this.col;

        if (this.isStart) {
            cell.classList.add('start');
        } else if (this.isEnd) {
            cell.classList.add('end');
        } else if (this.isBlocked) {
            cell.classList.add('blocked');
        } else if (this.isLeaking) {
            cell.classList.add('leaking');
        } else if (this.isValve) {
            cell.classList.add('valve');
        } else if (this.isPump) {
            cell.classList.add('pump');
        }

        if (!this.valveOpen && this.isValve) {
            cell.classList.add('valve-closed');
        }

        const inner = document.createElement('div');
        inner.className = 'pipe-inner';
        inner.style.transform = `rotate(${this.rotation}deg)`;
        inner.innerHTML = this.renderSVG();

        cell.appendChild(inner);

        if (this.isStart) {
            const marker = document.createElement('span');
            marker.className = 'start-marker';
            marker.textContent = LIQUID_CONFIG[this.liquidType].icon;
            cell.appendChild(marker);
        } else if (this.isEnd) {
            const marker = document.createElement('span');
            marker.className = 'end-marker';
            marker.textContent = '🏠';
            cell.appendChild(marker);
        } else if (this.isBlocked && !this.blockageCleared) {
            const marker = document.createElement('span');
            marker.className = 'blocked-marker';
            marker.textContent = '�';
            cell.appendChild(marker);
        } else if (this.isLeaking && !this.leakFixed) {
            const marker = document.createElement('span');
            marker.className = 'leaking-marker';
            marker.textContent = '💦';
            cell.appendChild(marker);
        } else if (this.isValve) {
            const marker = document.createElement('span');
            marker.className = 'valve-marker';
            marker.textContent = this.valveOpen ? '🔛' : '🔒';
            cell.appendChild(marker);
        } else if (this.isPump) {
            const marker = document.createElement('span');
            marker.className = 'pump-marker';
            marker.textContent = '⚡';
            cell.appendChild(marker);
        }

        if (this.isPump) {
            cell.classList.add('pump-active');
        }

        this.element = cell;
        return cell;
    }

    updateVisual() {
        if (!this.element) return;
        
        const inner = this.element.querySelector('.pipe-inner');
        if (inner) {
            inner.style.transform = `rotate(${this.rotation}deg)`;
            inner.innerHTML = this.renderSVG();
        }

        if (this.isConnected) {
            this.element.classList.add('connected');
        } else {
            this.element.classList.remove('connected');
        }

        if (this.isValve) {
            if (this.valveOpen) {
                this.element.classList.remove('valve-closed');
            } else {
                this.element.classList.add('valve-closed');
            }
            const marker = this.element.querySelector('.valve-marker');
            if (marker) {
                marker.textContent = this.valveOpen ? '🔛' : '🔒';
            }
        }

        if (this.isBlocked && this.blockageCleared) {
            this.element.classList.remove('blocked');
            const marker = this.element.querySelector('.blocked-marker');
            if (marker) marker.remove();
        }

        if (this.leakFixed) {
            this.element.classList.remove('leaking');
            const marker = this.element.querySelector('.leaking-marker');
            if (marker) marker.remove();
        }
    }

    setWaterFlowing(flowing) {
        this.waterFlowing = flowing;
        if (!this.element) return;
        
        const liquidConfig = LIQUID_CONFIG[this.liquidType];
        
        if (flowing) {
            this.element.classList.add('water-flowing');
            this.element.style.setProperty('--liquid-color', liquidConfig.color);
            this.element.style.setProperty('--glow-color', liquidConfig.glowColor);
        } else {
            this.element.classList.remove('water-flowing');
        }
    }

    toJSON() {
        return {
            type: this.type,
            row: this.row,
            col: this.col,
            rotation: this.rotation,
            isStart: this.isStart,
            isEnd: this.isEnd,
            valveOpen: this.valveOpen,
            blockageCleared: this.blockageCleared,
            leakFixed: this.leakFixed,
            liquidType: this.liquidType
        };
    }

    static fromJSON(data) {
        const pipe = new Pipe(data.type, data.row, data.col);
        pipe.rotation = data.rotation || 0;
        pipe.valveOpen = data.valveOpen !== undefined ? data.valveOpen : true;
        pipe.blockageCleared = data.blockageCleared || false;
        pipe.leakFixed = data.leakFixed || false;
        pipe.liquidType = data.liquidType || LIQUID_TYPES.WATER;
        return pipe;
    }
}