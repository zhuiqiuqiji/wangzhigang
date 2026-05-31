import stateManager from './state-manager.js';
import graphRenderer from './graph-renderer.js';
import { throttle, formatNumber, clamp } from './utils.js';

class InteractionController {
    constructor() {
        this.canvas = null;
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.mouseWorldPos = { x: 0, y: 0 };
        this.onCoordinateUpdate = null;
    }

    init(canvasElement) {
        this.canvas = canvasElement;
        
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
        
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const view = stateManager.getState().view;
        const worldPosBefore = graphRenderer.screenToWorld(mouseX, mouseY, view);
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = clamp(view.scale * zoomFactor, 1, 2000);
        
        stateManager.setState('view.scale', newScale);
        
        const newView = stateManager.getState().view;
        const worldPosAfter = graphRenderer.screenToWorld(mouseX, mouseY, newView);
        
        const offsetX = view.offsetX + (worldPosBefore.x - worldPosAfter.x);
        const offsetY = view.offsetY + (worldPosBefore.y - worldPosAfter.y);
        
        stateManager.setState('view.offsetX', offsetX);
        stateManager.setState('view.offsetY', offsetY);
    }

    handleMouseDown(e) {
        this.isDragging = true;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.canvas.style.cursor = 'grabbing';
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const view = stateManager.getState().view;
        const worldPos = graphRenderer.screenToWorld(mouseX, mouseY, view);
        this.mouseWorldPos = worldPos;
        
        if (this.onCoordinateUpdate) {
            this.onCoordinateUpdate({
                screenX: mouseX,
                screenY: mouseY,
                worldX: worldPos.x,
                worldY: worldPos.y
            });
        }
        
        if (this.isDragging) {
            const dx = e.clientX - this.lastMousePos.x;
            const dy = e.clientY - this.lastMousePos.y;
            
            const newOffsetX = view.offsetX - dx / view.scale;
            const newOffsetY = view.offsetY + dy / view.scale;
            
            stateManager.setState('view.offsetX', newOffsetX);
            stateManager.setState('view.offsetY', newOffsetY);
            
            this.lastMousePos = { x: e.clientX, y: e.clientY };
        }
    }

    handleMouseUp() {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }

    handleTouchStart(e) {
        e.preventDefault();
        
        if (e.touches.length === 1) {
            this.isDragging = true;
            this.lastMousePos = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        } else if (e.touches.length === 2) {
            this.isDragging = false;
            this.lastPinchDistance = this.getPinchDistance(e.touches);
            const rect = this.canvas.getBoundingClientRect();
            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
            const view = stateManager.getState().view;
            this.pinchCenter = graphRenderer.screenToWorld(centerX, centerY, view);
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        
        if (e.touches.length === 1 && this.isDragging) {
            const view = stateManager.getState().view;
            const dx = e.touches[0].clientX - this.lastMousePos.x;
            const dy = e.touches[0].clientY - this.lastMousePos.y;
            
            const newOffsetX = view.offsetX - dx / view.scale;
            const newOffsetY = view.offsetY + dy / view.scale;
            
            stateManager.setState('view.offsetX', newOffsetX);
            stateManager.setState('view.offsetY', newOffsetY);
            
            this.lastMousePos = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        } else if (e.touches.length === 2) {
            const currentDistance = this.getPinchDistance(e.touches);
            const zoomFactor = currentDistance / this.lastPinchDistance;
            
            const view = stateManager.getState().view;
            const newScale = clamp(view.scale * zoomFactor, 1, 2000);
            
            stateManager.setState('view.scale', newScale);
            
            const rect = this.canvas.getBoundingClientRect();
            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
            const newView = stateManager.getState().view;
            const worldPosAfter = graphRenderer.screenToWorld(centerX, centerY, newView);
            
            const offsetX = view.offsetX + (this.pinchCenter.x - worldPosAfter.x);
            const offsetY = view.offsetY + (this.pinchCenter.y - worldPosAfter.y);
            
            stateManager.setState('view.offsetX', offsetX);
            stateManager.setState('view.offsetY', offsetY);
            
            this.lastPinchDistance = currentDistance;
        }
    }

    handleTouchEnd(e) {
        if (e.touches.length === 0) {
            this.isDragging = false;
            this.lastPinchDistance = null;
        } else if (e.touches.length === 1) {
            this.isDragging = true;
            this.lastPinchDistance = null;
            this.lastMousePos = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
    }

    getPinchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    handleKeyDown(e) {
        const activeElement = document.activeElement;
        const activeTag = activeElement.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select' || activeElement.isContentEditable) {
            return;
        }

        const view = stateManager.getState().view;
        const panSpeed = 20 / view.scale;
        
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                stateManager.setState('view.offsetX', view.offsetX - panSpeed);
                break;
            case 'ArrowRight':
                e.preventDefault();
                stateManager.setState('view.offsetX', view.offsetX + panSpeed);
                break;
            case 'ArrowUp':
                e.preventDefault();
                stateManager.setState('view.offsetY', view.offsetY + panSpeed);
                break;
            case 'ArrowDown':
                e.preventDefault();
                stateManager.setState('view.offsetY', view.offsetY - panSpeed);
                break;
            case '+':
            case '=':
                stateManager.setState('view.scale', clamp(view.scale * 1.2, 1, 2000));
                break;
            case '-':
                stateManager.setState('view.scale', clamp(view.scale / 1.2, 1, 2000));
                break;
            case 'r':
            case 'R':
                this.resetView();
                break;
        }
    }

    resetView() {
        stateManager.setState('view.scale', 50);
        stateManager.setState('view.offsetX', 0);
        stateManager.setState('view.offsetY', 0);
    }

    getMouseWorldPos() {
        return this.mouseWorldPos;
    }
}

const interactionController = new InteractionController();
export default interactionController;
