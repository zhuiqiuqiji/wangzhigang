import stateManager from './state-manager.js';
import mathEngine from './math-engine.js';
import { formatNumber } from './utils.js';

class GraphRenderer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this.animationFrame = null;
        this.needsRender = true;
    }

    init(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        stateManager.subscribe('*', () => {
            this.scheduleRender();
        });
    }

    resize() {
        const container = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        
        this.ctx.scale(dpr, dpr);
        this.scheduleRender();
    }

    scheduleRender() {
        if (this.animationFrame) return;
        this.animationFrame = requestAnimationFrame(() => {
            this.render();
            this.animationFrame = null;
        });
    }

    render() {
        const state = stateManager.getState();
        const { view, functions, display } = state;
        
        this.ctx.fillStyle = display.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (view.showGrid) {
            this.drawGrid(view);
        }

        if (view.showAxis) {
            this.drawAxis(view);
        }

        const visibleFunctions = functions.filter(f => f.visible);
        for (const func of visibleFunctions) {
            this.drawFunction(func, view);
        }

        if (view.showIntersections) {
            for (const func of visibleFunctions) {
                this.drawIntersections(func, view);
            }
        }
    }

    worldToScreen(x, y, view) {
        const screenX = (x - view.offsetX) * view.scale + this.width / 2;
        const screenY = this.height / 2 - (y - view.offsetY) * view.scale;
        return { x: screenX, y: screenY };
    }

    screenToWorld(screenX, screenY, view) {
        const x = (screenX - this.width / 2) / view.scale + view.offsetX;
        const y = (this.height / 2 - screenY) / view.scale + view.offsetY;
        return { x, y };
    }

    drawGrid(view) {
        const { scale, offsetX, offsetY } = view;
        const gridSize = this.getGridSize(scale);
        
        this.ctx.strokeStyle = stateManager.getState().display.gridColor;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();

        const startX = Math.floor((-this.width / 2 / scale - offsetX) / gridSize) * gridSize;
        const endX = Math.ceil((this.width / 2 / scale - offsetX) / gridSize) * gridSize;
        
        for (let x = startX; x <= endX; x += gridSize) {
            const screenPos = this.worldToScreen(x, 0, view);
            this.ctx.moveTo(screenPos.x, 0);
            this.ctx.lineTo(screenPos.x, this.height);
        }

        const startY = Math.floor((-this.height / 2 / scale - offsetY) / gridSize) * gridSize;
        const endY = Math.ceil((this.height / 2 / scale - offsetY) / gridSize) * gridSize;
        
        for (let y = startY; y <= endY; y += gridSize) {
            const screenPos = this.worldToScreen(0, y, view);
            this.ctx.moveTo(0, screenPos.y);
            this.ctx.lineTo(this.width, screenPos.y);
        }

        this.ctx.stroke();
    }

    getGridSize(scale) {
        const targetPixels = 80;
        const unitSize = targetPixels / scale;
        
        const sizes = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
        for (const size of sizes) {
            if (size >= unitSize) {
                return size;
            }
        }
        return 100;
    }

    drawAxis(view) {
        const axisColor = stateManager.getState().display.axisColor;
        const origin = this.worldToScreen(0, 0, view);

        this.ctx.strokeStyle = axisColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        if (origin.y >= 0 && origin.y <= this.height) {
            this.ctx.moveTo(0, origin.y);
            this.ctx.lineTo(this.width, origin.y);
        } else {
            this.ctx.moveTo(0, this.height / 2);
            this.ctx.lineTo(this.width, this.height / 2);
        }

        if (origin.x >= 0 && origin.x <= this.width) {
            this.ctx.moveTo(origin.x, 0);
            this.ctx.lineTo(origin.x, this.height);
        } else {
            this.ctx.moveTo(this.width / 2, 0);
            this.ctx.lineTo(this.width / 2, this.height);
        }

        this.ctx.stroke();
        this.drawAxisLabels(view);
    }

    drawAxisLabels(view) {
        const { scale, offsetX, offsetY } = view;
        const gridSize = this.getGridSize(scale);
        const origin = this.worldToScreen(0, 0, view);
        
        this.ctx.fillStyle = '#8892b0';
        this.ctx.font = '12px "Noto Sans SC", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';

        const startX = Math.floor((-this.width / 2 / scale - offsetX) / gridSize) * gridSize;
        const endX = Math.ceil((this.width / 2 / scale - offsetX) / gridSize) * gridSize;
        const yPos = Math.min(Math.max(origin.y + 5, 5), this.height - 20);
        
        for (let x = startX; x <= endX; x += gridSize) {
            if (Math.abs(x) < 0.0001) continue;
            const screenPos = this.worldToScreen(x, 0, view);
            this.ctx.fillText(formatNumber(x, 2), screenPos.x, yPos);
        }

        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        const startY = Math.floor((-this.height / 2 / scale - offsetY) / gridSize) * gridSize;
        const endY = Math.ceil((this.height / 2 / scale - offsetY) / gridSize) * gridSize;
        const xPos = Math.min(Math.max(origin.x - 5, 40), this.width - 5);
        
        for (let y = startY; y <= endY; y += gridSize) {
            if (Math.abs(y) < 0.0001) continue;
            const screenPos = this.worldToScreen(0, y, view);
            this.ctx.fillText(formatNumber(y, 2), xPos, screenPos.y);
        }

        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.font = 'bold 12px "Noto Sans SC", sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText('O', Math.min(Math.max(origin.x + 5, 5), this.width - 20), Math.min(Math.max(origin.y - 5, 15), this.height));
    }

    drawFunction(func, view) {
        const { scale, offsetX } = view;
        const fn = func.compiled;
        
        if (!fn) return;

        this.ctx.strokeStyle = func.color;
        this.ctx.lineWidth = func.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();

        const minX = -this.width / 2 / scale + offsetX;
        const maxX = this.width / 2 / scale + offsetX;
        const step = Math.max(1 / scale, 0.001);

        let isDrawing = false;
        let prevScreenY = null;

        for (let x = minX; x <= maxX; x += step) {
            const y = fn(x);
            
            if (!isFinite(y)) {
                isDrawing = false;
                prevScreenY = null;
                continue;
            }

            const screenPos = this.worldToScreen(x, y, view);
            
            if (prevScreenY !== null && Math.abs(screenPos.y - prevScreenY) > this.height) {
                isDrawing = false;
            }

            if (!isDrawing) {
                this.ctx.moveTo(screenPos.x, screenPos.y);
                isDrawing = true;
            } else {
                this.ctx.lineTo(screenPos.x, screenPos.y);
            }
            
            prevScreenY = screenPos.y;
        }

        this.ctx.stroke();
    }

    drawIntersections(func, view) {
        const fn = func.compiled;
        if (!fn) return;

        const { scale, offsetX } = view;
        const minX = -this.width / 2 / scale + offsetX;
        const maxX = this.width / 2 / scale + offsetX;

        const xIntersections = mathEngine.findXIntersections(fn, minX, maxX);
        const yIntersection = mathEngine.findYIntersection(fn);

        for (const intersection of xIntersections) {
            this.drawIntersectionPoint(intersection, func.color, view);
        }

        if (yIntersection) {
            this.drawIntersectionPoint(yIntersection, func.color, view);
        }
    }

    drawIntersectionPoint(intersection, color, view) {
        const screenPos = this.worldToScreen(intersection.x, intersection.y, view);

        if (screenPos.x < 0 || screenPos.x > this.width || 
            screenPos.y < 0 || screenPos.y > this.height) {
            return;
        }

        const gradient = this.ctx.createRadialGradient(
            screenPos.x, screenPos.y, 0,
            screenPos.x, screenPos.y, 12
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, 12, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, 5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, 2, 0, Math.PI * 2);
        this.ctx.fill();

        const label = `(${formatNumber(intersection.x, 2)}, ${formatNumber(intersection.y, 2)})`;
        this.ctx.font = '10px "Noto Sans SC", sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';
        
        const labelX = screenPos.x + 10;
        const labelY = screenPos.y - 10;
        
        this.ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
        const labelWidth = this.ctx.measureText(label).width + 8;
        this.ctx.fillRect(labelX - 4, labelY - 12, labelWidth, 16);
        
        this.ctx.fillStyle = color;
        this.ctx.fillText(label, labelX, labelY);
    }
}

const graphRenderer = new GraphRenderer();
export default graphRenderer;
