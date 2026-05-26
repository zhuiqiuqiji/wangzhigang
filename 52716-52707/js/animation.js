class Animation {
    constructor(gameBoard, pathCanvas) {
        this.gameBoard = gameBoard;
        this.pathCanvas = pathCanvas;
    }

    showPath(points, tileWidth, tileHeight, offsetX, offsetY) {
        this.pathCanvas.innerHTML = '';

        if (points.length < 2) return;

        let pathD = `M ${points[0].x * tileWidth + tileWidth / 2 + offsetX} ${points[0].y * tileHeight + tileHeight / 2 + offsetY}`;
        
        for (let i = 1; i < points.length; i++) {
            const x = points[i].x * tileWidth + tileWidth / 2 + offsetX;
            const y = points[i].y * tileHeight + tileHeight / 2 + offsetY;
            pathD += ` L ${x} ${y}`;
        }

        const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathElement.setAttribute('d', pathD);
        pathElement.setAttribute('class', 'path-line');
        this.pathCanvas.appendChild(pathElement);

        setTimeout(() => {
            this.clearPath();
        }, 500);
    }

    clearPath() {
        this.pathCanvas.innerHTML = '';
    }

    showScorePopup(x, y, score) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = `+${score}`;
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        this.gameBoard.appendChild(popup);

        setTimeout(() => {
            popup.remove();
        }, 800);
    }

    removeTileWithAnimation(tile, callback) {
        if (tile.element) {
            tile.element.classList.add('removing');
            setTimeout(() => {
                if (tile.element && tile.element.parentNode) {
                    tile.element.parentNode.removeChild(tile.element);
                }
                if (callback) callback();
            }, 400);
        } else if (callback) {
            callback();
        }
    }

    shakeTile(tile) {
        if (tile.element) {
            tile.element.style.animation = 'none';
            tile.element.offsetHeight;
            tile.element.style.animation = 'shake 0.3s ease';
            setTimeout(() => {
                if (tile.element) {
                    tile.element.style.animation = '';
                }
            }, 300);
        }
    }
}
