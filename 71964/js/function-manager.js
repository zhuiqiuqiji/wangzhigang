import stateManager from './state-manager.js';
import mathEngine from './math-engine.js';
import { generateId, getRandomColor } from './utils.js';

class FunctionManager {
    constructor() {
        this.defaultFunctions = [
            { expression: 'x^2', color: '#FF6B35' },
            { expression: 'sin(x)', color: '#4ECDC4' },
            { expression: 'cos(x)', color: '#9B5DE5' }
        ];
    }

    addFunction(expression, color = null, lineWidth = 2) {
        const validation = mathEngine.validate(expression);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        const functions = stateManager.getState().functions;
        const compiled = mathEngine.parse(expression);
        
        const func = {
            id: generateId(),
            expression: expression,
            color: color || getRandomColor(functions.length),
            lineWidth: lineWidth,
            visible: true,
            compiled: compiled
        };

        functions.push(func);
        stateManager.setState('functions', functions);
        
        return { success: true, function: func };
    }

    removeFunction(id) {
        const functions = stateManager.getState().functions;
        const index = functions.findIndex(f => f.id === id);
        if (index > -1) {
            functions.splice(index, 1);
            stateManager.setState('functions', functions);
            return true;
        }
        return false;
    }

    toggleFunctionVisibility(id) {
        const functions = stateManager.getState().functions;
        const func = functions.find(f => f.id === id);
        if (func) {
            func.visible = !func.visible;
            stateManager.setState('functions', functions);
            return func.visible;
        }
        return null;
    }

    updateFunctionColor(id, color) {
        const functions = stateManager.getState().functions;
        const func = functions.find(f => f.id === id);
        if (func) {
            func.color = color;
            stateManager.setState('functions', functions);
            return true;
        }
        return false;
    }

    updateFunctionExpression(id, expression) {
        const validation = mathEngine.validate(expression);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        const functions = stateManager.getState().functions;
        const func = functions.find(f => f.id === id);
        if (func) {
            func.expression = expression;
            func.compiled = mathEngine.parse(expression);
            stateManager.setState('functions', functions);
            return { success: true, function: func };
        }
        return { success: false, error: '函数不存在' };
    }

    updateFunctionLineWidth(id, lineWidth) {
        const functions = stateManager.getState().functions;
        const func = functions.find(f => f.id === id);
        if (func) {
            func.lineWidth = lineWidth;
            stateManager.setState('functions', functions);
            return true;
        }
        return false;
    }

    getFunctions() {
        return stateManager.getState().functions;
    }

    clearAllFunctions() {
        stateManager.setState('functions', []);
    }

    loadDefaultFunctions() {
        const functions = [];
        for (const func of this.defaultFunctions) {
            const validation = mathEngine.validate(func.expression);
            if (validation.valid) {
                const compiled = mathEngine.parse(func.expression);
                functions.push({
                    id: generateId(),
                    expression: func.expression,
                    color: func.color,
                    lineWidth: 2,
                    visible: true,
                    compiled: compiled
                });
            }
        }
        stateManager.setState('functions', functions);
    }

    getFunctionIntersections(id) {
        const functions = stateManager.getState().functions;
        const func = functions.find(f => f.id === id);
        if (!func || !func.compiled) return [];

        const view = stateManager.getState().view;
        const scale = view.scale;
        const minX = -1000 / scale + view.offsetX;
        const maxX = 1000 / scale + view.offsetX;

        const xIntersections = mathEngine.findXIntersections(func.compiled, minX, maxX);
        const yIntersection = mathEngine.findYIntersection(func.compiled);

        const intersections = [...xIntersections];
        if (yIntersection) {
            intersections.push(yIntersection);
        }

        return intersections;
    }
}

const functionManager = new FunctionManager();
export default functionManager;
