class InputManager {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.keys = {};
        this.touchActive = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));

        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));

        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e));

        window.addEventListener('resize', () => this.game.resize());
    }

    handleKeyDown(e) {
        this.keys[e.code] = true;
        
        if (e.code === 'Space') {
            e.preventDefault();
            this.tryDash();
        }
        
        if (e.code === 'Escape') {
            if (this.game.state === 'playing') {
                this.game.pause();
            }
        }
        
        if (e.code === 'KeyR') {
            if (this.game.state === 'playing' || this.game.state === 'fail') {
                this.game.restart();
            }
        }
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
    }

    handleMouseDown(e) {
        e.preventDefault();
        this.tryDash();
    }

    handleMouseUp(e) {
    }

    handleClick(e) {
    }

    handleTouchStart(e) {
        e.preventDefault();
        this.touchActive = true;
        this.tryDash();
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.touchActive = false;
    }

    tryDash() {
        if (this.game.state === 'playing') {
            this.game.dash();
        }
    }

    isKeyPressed(code) {
        return this.keys[code] === true;
    }
}
