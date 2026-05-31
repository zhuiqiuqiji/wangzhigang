class MathEngine {
    constructor() {
        this.constants = {
            pi: Math.PI,
            PI: Math.PI,
            e: Math.E,
            E: Math.E
        };
    }

    parse(expression) {
        try {
            const tokens = this.tokenize(expression);
            const rpn = this.shuntingYard(tokens);
            return (x) => this.evaluateRPN(rpn, x);
        } catch (error) {
            throw new Error(`表达式解析错误: ${error.message}`);
        }
    }

    tokenize(expression) {
        const tokens = [];
        let current = '';
        const operators = ['+', '-', '*', '/', '^', '(', ')', ','];
        const functions = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'abs', 'log', 'ln', 'exp', 'floor', 'ceil', 'round', 'sign'];

        for (let i = 0; i < expression.length; i++) {
            const char = expression[i];

            if (/\s/.test(char)) continue;

            if (operators.includes(char)) {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
                if (char === '-' && (tokens.length === 0 || tokens[tokens.length - 1] === '(' || operators.includes(tokens[tokens.length - 1]))) {
                    tokens.push('u-');
                } else {
                    tokens.push(char);
                }
                continue;
            }

            if (/[a-zA-Z]/.test(char)) {
                current += char;
                if (functions.includes(current) || /^[a-zA-Z]$/.test(current)) {
                    if (i + 1 >= expression.length || !/[a-zA-Z]/.test(expression[i + 1])) {
                        tokens.push(current);
                        current = '';
                    }
                }
                continue;
            }

            if (/[0-9.]/.test(char)) {
                current += char;
                if (i + 1 >= expression.length || !/[0-9.]/.test(expression[i + 1])) {
                    tokens.push(current);
                    current = '';
                }
                continue;
            }

            throw new Error(`未知字符: ${char}`);
        }

        if (current) tokens.push(current);
        return tokens;
    }

    shuntingYard(tokens) {
        const output = [];
        const stack = [];
        const precedence = {
            '+': 1, '-': 1,
            '*': 2, '/': 2,
            'u-': 3,
            '^': 4
        };
        const rightAssociative = ['^', 'u-'];
        const functions = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'abs', 'log', 'ln', 'exp', 'floor', 'ceil', 'round', 'sign'];

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (/^[0-9.]+$/.test(token)) {
                output.push({ type: 'number', value: parseFloat(token) });
                continue;
            }

            if (token === 'x') {
                output.push({ type: 'variable', value: 'x' });
                continue;
            }

            if (this.constants[token] !== undefined) {
                output.push({ type: 'number', value: this.constants[token] });
                continue;
            }

            if (functions.includes(token)) {
                stack.push({ type: 'function', value: token });
                continue;
            }

            if (token === ',') {
                while (stack.length > 0 && stack[stack.length - 1].value !== '(') {
                    output.push(stack.pop());
                }
                continue;
            }

            if (precedence[token] !== undefined) {
                while (stack.length > 0) {
                    const top = stack[stack.length - 1];
                    if (top.value === '(') break;
                    const topPrec = precedence[top.value] || 0;
                    const currPrec = precedence[token];
                    if (topPrec > currPrec || (topPrec === currPrec && !rightAssociative.includes(token))) {
                        output.push(stack.pop());
                    } else {
                        break;
                    }
                }
                stack.push({ type: 'operator', value: token });
                continue;
            }

            if (token === '(') {
                stack.push({ type: 'paren', value: '(' });
                continue;
            }

            if (token === ')') {
                while (stack.length > 0 && stack[stack.length - 1].value !== '(') {
                    output.push(stack.pop());
                }
                if (stack.length === 0) {
                    throw new Error('括号不匹配');
                }
                stack.pop();
                if (stack.length > 0 && stack[stack.length - 1].type === 'function') {
                    output.push(stack.pop());
                }
                continue;
            }

            throw new Error(`未知符号: ${token}`);
        }

        while (stack.length > 0) {
            const top = stack.pop();
            if (top.value === '(' || top.value === ')') {
                throw new Error('括号不匹配');
            }
            output.push(top);
        }

        return output;
    }

    evaluateRPN(rpn, x) {
        const stack = [];
        const functions = {
            sin: Math.sin,
            cos: Math.cos,
            tan: Math.tan,
            asin: Math.asin,
            acos: Math.acos,
            atan: Math.atan,
            sqrt: Math.sqrt,
            abs: Math.abs,
            log: (n) => Math.log10(n),
            ln: Math.log,
            exp: Math.exp,
            floor: Math.floor,
            ceil: Math.ceil,
            round: Math.round,
            sign: Math.sign
        };

        for (const token of rpn) {
            if (token.type === 'number') {
                stack.push(token.value);
                continue;
            }

            if (token.type === 'variable') {
                stack.push(x);
                continue;
            }

            if (token.type === 'function') {
                const a = stack.pop();
                const result = functions[token.value](a);
                if (!isFinite(result)) return NaN;
                stack.push(result);
                continue;
            }

            if (token.type === 'operator') {
                if (token.value === 'u-') {
                    const a = stack.pop();
                    stack.push(-a);
                    continue;
                }

                const b = stack.pop();
                const a = stack.pop();
                let result;

                switch (token.value) {
                    case '+': result = a + b; break;
                    case '-': result = a - b; break;
                    case '*': result = a * b; break;
                    case '/': result = a / b; break;
                    case '^': result = Math.pow(a, b); break;
                    default: throw new Error(`未知运算符: ${token.value}`);
                }

                if (!isFinite(result)) return NaN;
                stack.push(result);
            }
        }

        return stack.pop();
    }

    validate(expression) {
        try {
            const fn = this.parse(expression);
            const test = fn(1);
            return { valid: true, error: null };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    findXIntersections(fn, minX, maxX, step = 0.01) {
        const intersections = [];
        let prevY = fn(minX);

        for (let x = minX + step; x <= maxX; x += step) {
            const y = fn(x);
            if (!isFinite(y)) {
                prevY = y;
                continue;
            }
            if ((prevY < 0 && y > 0) || (prevY > 0 && y < 0)) {
                const rootX = this.bisectionMethod(fn, x - step, x);
                if (rootX !== null) {
                    intersections.push({ x: rootX, y: 0, type: 'x-axis' });
                }
            } else if (Math.abs(y) < step * 0.1) {
                intersections.push({ x, y: 0, type: 'x-axis' });
            }
            prevY = y;
        }

        return intersections;
    }

    bisectionMethod(fn, a, b, tolerance = 1e-8, maxIterations = 100) {
        let fa = fn(a);
        let fb = fn(b);

        if (fa * fb > 0) return null;

        for (let i = 0; i < maxIterations; i++) {
            const c = (a + b) / 2;
            const fc = fn(c);

            if (Math.abs(fc) < tolerance || (b - a) / 2 < tolerance) {
                return c;
            }

            if (fa * fc < 0) {
                b = c;
                fb = fc;
            } else {
                a = c;
                fa = fc;
            }
        }

        return (a + b) / 2;
    }

    findYIntersection(fn) {
        const y = fn(0);
        if (isFinite(y)) {
            return { x: 0, y, type: 'y-axis' };
        }
        return null;
    }
}

const mathEngine = new MathEngine();
export default mathEngine;
