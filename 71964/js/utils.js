export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

export function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

export function formatNumber(num, decimals = 4) {
    if (!isFinite(num)) return '-';
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
}

export const COLORS = [
    '#FF6B35',
    '#4ECDC4',
    '#9B5DE5',
    '#FEE440',
    '#00BBF9',
    '#FF6B9D',
    '#06D6A0',
    '#118AB2',
    '#EF476F',
    '#FFD166'
];

export function getRandomColor(index) {
    return COLORS[index % COLORS.length];
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
