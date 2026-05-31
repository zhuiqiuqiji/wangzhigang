import stateManager from './state-manager.js';
import graphRenderer from './graph-renderer.js';
import interactionController from './interaction.js';
import functionManager from './function-manager.js';
import { formatNumber } from './utils.js';

class App {
    constructor() {
        this.elements = {};
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadDefaultFunctions();
        this.initModules();
        this.updateFunctionList();
    }

    cacheElements() {
        this.elements = {
            canvas: document.getElementById('graph-canvas'),
            functionInput: document.getElementById('function-input'),
            addFunctionBtn: document.getElementById('add-function-btn'),
            functionList: document.getElementById('function-list'),
            showGridToggle: document.getElementById('show-grid'),
            showAxisToggle: document.getElementById('show-axis'),
            showIntersectionsToggle: document.getElementById('show-intersections'),
            resetViewBtn: document.getElementById('reset-view-btn'),
            zoomInBtn: document.getElementById('zoom-in-btn'),
            zoomOutBtn: document.getElementById('zoom-out-btn'),
            coordinateDisplay: document.getElementById('coordinate-display'),
            errorMessage: document.getElementById('error-message')
        };
    }

    bindEvents() {
        this.elements.addFunctionBtn.addEventListener('click', () => this.addFunction());
        this.elements.functionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addFunction();
        });

        this.elements.showGridToggle.addEventListener('change', (e) => {
            stateManager.setState('view.showGrid', e.target.checked);
        });

        this.elements.showAxisToggle.addEventListener('change', (e) => {
            stateManager.setState('view.showAxis', e.target.checked);
        });

        this.elements.showIntersectionsToggle.addEventListener('change', (e) => {
            stateManager.setState('view.showIntersections', e.target.checked);
        });

        this.elements.resetViewBtn.addEventListener('click', () => {
            interactionController.resetView();
        });

        this.elements.zoomInBtn.addEventListener('click', () => {
            const view = stateManager.getState().view;
            stateManager.setState('view.scale', Math.min(view.scale * 1.3, 2000));
        });

        this.elements.zoomOutBtn.addEventListener('click', () => {
            const view = stateManager.getState().view;
            stateManager.setState('view.scale', Math.max(view.scale / 1.3, 1));
        });

        interactionController.onCoordinateUpdate = (coords) => {
            this.updateCoordinateDisplay(coords);
        };

        stateManager.subscribe('functions', () => {
            this.updateFunctionList();
        });

        stateManager.subscribe('view', () => {
            this.updateViewControls();
        });
    }

    initModules() {
        graphRenderer.init(this.elements.canvas);
        interactionController.init(this.elements.canvas);
    }

    loadDefaultFunctions() {
        functionManager.loadDefaultFunctions();
    }

    addFunction() {
        const expression = this.elements.functionInput.value.trim();
        if (!expression) {
            this.showError('请输入函数表达式');
            return;
        }

        const result = functionManager.addFunction(expression);
        if (result.success) {
            this.elements.functionInput.value = '';
            this.hideError();
        } else {
            this.showError(result.error);
        }
    }

    updateFunctionList() {
        const functions = functionManager.getFunctions();
        this.elements.functionList.innerHTML = '';

        functions.forEach((func, index) => {
            const item = document.createElement('div');
            item.className = 'function-item';
            item.innerHTML = `
                <div class="function-color" style="background-color: ${func.color}"></div>
                <div class="function-expression">${func.expression}</div>
                <div class="function-controls">
                    <button class="btn-icon toggle-visibility" data-id="${func.id}" title="${func.visible ? '隐藏' : '显示'}">
                        ${func.visible ? '👁️' : '👁️‍🗨️'}
                    </button>
                    <input type="color" class="color-picker" value="${func.color}" data-id="${func.id}" title="选择颜色">
                    <button class="btn-icon remove-function" data-id="${func.id}" title="删除">🗑️</button>
                </div>
            `;

            item.querySelector('.toggle-visibility').addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                functionManager.toggleFunctionVisibility(id);
            });

            item.querySelector('.color-picker').addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                functionManager.updateFunctionColor(id, e.target.value);
            });

            item.querySelector('.remove-function').addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                functionManager.removeFunction(id);
            });

            this.elements.functionList.appendChild(item);
        });
    }

    updateViewControls() {
        const view = stateManager.getState().view;
        this.elements.showGridToggle.checked = view.showGrid;
        this.elements.showAxisToggle.checked = view.showAxis;
        this.elements.showIntersectionsToggle.checked = view.showIntersections;
    }

    updateCoordinateDisplay(coords) {
        this.elements.coordinateDisplay.innerHTML = `
            <span>屏幕: (${Math.round(coords.screenX)}, ${Math.round(coords.screenY)})</span>
            <span>坐标: (${formatNumber(coords.worldX, 3)}, ${formatNumber(coords.worldY, 3)})</span>
        `;
    }

    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.style.display = 'block';
    }

    hideError() {
        this.elements.errorMessage.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
