class InputHandler {
    constructor() {
        this.directions = [];
        this.maxBufferSize = 3;
        this.gameStarted = false;
        this.onStart = null;
        this.onPause = null;
        this.onBoostStart = null;
        this.onBoostEnd = null;

        this.boostPressed = false;

        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });

        let touchStartX = 0;
        let touchStartY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            const minSwipeDistance = 30;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0) {
                        this.addDirection(1, 0);
                    } else {
                        this.addDirection(-1, 0);
                    }
                }
            } else {
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0) {
                        this.addDirection(0, 1);
                    } else {
                        this.addDirection(0, -1);
                    }
                }
            }

            if (!this.gameStarted && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
                this.triggerStart();
            }
        });
    }

    handleKeyDown(e) {
        let handled = true;

        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.addDirection(0, -1);
                this.triggerStart();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.addDirection(0, 1);
                this.triggerStart();
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.addDirection(-1, 0);
                this.triggerStart();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.addDirection(1, 0);
                this.triggerStart();
                break;
            case ' ':
                e.preventDefault();
                if (!this.boostPressed) {
                    this.boostPressed = true;
                    if (this.onBoostStart) {
                        this.onBoostStart();
                    }
                }
                break;
            case 'Escape':
            case 'p':
            case 'P':
                if (this.onPause) {
                    this.onPause();
                }
                break;
            default:
                handled = false;
        }

        if (handled) {
            e.preventDefault();
        }
    }

    handleKeyUp(e) {
        if (e.key === ' ') {
            this.boostPressed = false;
            if (this.onBoostEnd) {
                this.onBoostEnd();
            }
        }
    }

    triggerStart() {
        if (!this.gameStarted && this.onStart) {
            this.gameStarted = true;
            this.onStart();
        }
    }

    addDirection(x, y) {
        const lastDirection = this.directions.length > 0
            ? this.directions[this.directions.length - 1]
            : null;

        if (lastDirection && lastDirection.x === x && lastDirection.y === y) {
            return;
        }

        if (this.directions.length < this.maxBufferSize) {
            this.directions.push({ x, y });
        } else {
            this.directions.shift();
            this.directions.push({ x, y });
        }
    }

    getNextDirection() {
        if (this.directions.length > 0) {
            return this.directions.shift();
        }
        return null;
    }

    peekNextDirection() {
        if (this.directions.length > 0) {
            return this.directions[0];
        }
        return null;
    }

    reset() {
        this.directions = [];
        this.gameStarted = false;
        this.boostPressed = false;
    }
}