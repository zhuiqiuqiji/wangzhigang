class StateManager {
    constructor() {
        this.listeners = new Map();
        this.state = {
            view: {
                scale: 50,
                offsetX: 0,
                offsetY: 0,
                showGrid: true,
                showAxis: true,
                showIntersections: true
            },
            functions: [],
            display: {
                defaultLineWidth: 2,
                backgroundColor: '#1a1a2e',
                gridColor: '#16213e',
                axisColor: '#4ECDC4'
            }
        };
    }

    getState() {
        return this.state;
    }

    setState(path, value) {
        const keys = path.split('.');
        let current = this.state;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        this.notify(path);
    }

    subscribe(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, []);
        }
        this.listeners.get(path).push(callback);
        return () => this.unsubscribe(path, callback);
    }

    unsubscribe(path, callback) {
        if (this.listeners.has(path)) {
            const callbacks = this.listeners.get(path);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    notify(path) {
        const keys = path.split('.');
        let currentPath = '';
        for (const key of keys) {
            currentPath = currentPath ? `${currentPath}.${key}` : key;
            if (this.listeners.has(currentPath)) {
                this.listeners.get(currentPath).forEach(cb => cb(this.getPathValue(currentPath)));
            }
        }
        if (this.listeners.has('*')) {
            this.listeners.get('*').forEach(cb => cb(this.state));
        }
    }

    getPathValue(path) {
        const keys = path.split('.');
        let current = this.state;
        for (const key of keys) {
            current = current[key];
        }
        return current;
    }
}

const stateManager = new StateManager();
export default stateManager;
