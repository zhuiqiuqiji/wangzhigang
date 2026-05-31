const CODE_SNIPPETS = {
    keywords: [
        'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
        'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'class',
        'extends', 'super', 'this', 'import', 'export', 'default', 'from', 'as', 'async', 'await',
        'true', 'false', 'null', 'undefined', 'NaN', 'Infinity', 'typeof', 'instanceof', 'void', 'delete'
    ],
    functions: [
        'console.log()', 'document.getElementById()', 'document.querySelector()',
        'Array.prototype.map()', 'Array.prototype.filter()', 'Array.prototype.reduce()',
        'Array.prototype.forEach()', 'Array.prototype.push()', 'Array.prototype.pop()',
        'String.prototype.split()', 'String.prototype.join()', 'String.prototype.replace()',
        'JSON.parse()', 'JSON.stringify()', 'parseInt()', 'parseFloat()',
        'setTimeout()', 'setInterval()', 'clearTimeout()', 'clearInterval()',
        'Promise.resolve()', 'Promise.reject()', 'fetch()', 'async/await'
    ],
    operators: [
        '===', '!==', '==', '!=', '>=', '<=', '&&', '||', '??', '?.',
        '++', '--', '+=', '-=', '*=', '/=', '%=', '**=', '<<=', '>>=',
        '=>', '->', '...', '!', '~', '&', '|', '^', '<<', '>>'
    ],
    patterns: [
        'const x = 10;',
        'let y = "hello";',
        'function foo() { return 42; }',
        'const arr = [1, 2, 3, 4, 5];',
        'const obj = { key: "value" };',
        'if (condition) { /* code */ }',
        'for (let i = 0; i < 10; i++) {}',
        'while (true) { break; }',
        'try { /* code */ } catch (e) {}',
        'const result = arr.map(x => x * 2);',
        'const filtered = arr.filter(x => x > 0);',
        'fetch(url).then(r => r.json());',
        'class MyClass extends Base {}',
        'export default function() {}',
        'import React from "react";'
    ],
    boss: [
        'const fibonacci = (n) => n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2);',
        'const quickSort = (arr) => arr.length <= 1 ? arr : [...quickSort(arr.filter(x => x < arr[0])), arr[0], ...quickSort(arr.filter(x => x > arr[0]))];',
        'const debounce = (fn, delay) => { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; };',
        'const deepClone = (obj) => JSON.parse(JSON.stringify(obj));',
        'const flatten = (arr) => arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatten(val) : val), []);',
        'const throttle = (fn, limit) => { let inThrottle; return function() { const args = arguments; const context = this; if (!inThrottle) { fn.apply(context, args); inThrottle = true; setTimeout(() => inThrottle = false, limit); } }; };',
        'const binarySearch = (arr, target) => { let left = 0; let right = arr.length - 1; while (left <= right) { const mid = Math.floor((left + right) / 2); if (arr[mid] === target) return mid; if (arr[mid] < target) left = mid + 1; else right = mid - 1; } return -1; };',
        'const curry = (fn) => (a) => (b) => fn(a, b);',
        'const compose = (...fns) => (x) => fns.reduceRight((y, f) => f(y), x);',
        'const pipe = (...fns) => (x) => fns.reduce((y, f) => f(y), x);'
    ]
};

if (typeof window !== 'undefined') {
    window.CODE_SNIPPETS = CODE_SNIPPETS;
}
