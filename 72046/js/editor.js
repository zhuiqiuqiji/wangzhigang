class LevelEditor {
    constructor(game) {
        this.game = game;
        this.rows = 6;
        this.cols = 6;
        this.grid = [];
        this.selectedPipeType = PIPE_TYPES.STRAIGHT;
        this.selectedLiquidType = LIQUID_TYPES.WATER;
        this.startPos = null;
        this.endPos = null;
        this.createEditorUI();
    }

    createEditorUI() {
        const editorHTML = `
            <div class="editor-overlay" id="editorOverlay">
                <div class="editor-container">
                    <div class="editor-header">
                        <h2>🛠️ 关卡编辑器</h2>
                        <button class="btn-close-editor" id="closeEditorBtn">✕</button>
                    </div>
                    
                    <div class="editor-body">
                        <div class="editor-sidebar">
                            <div class="editor-section">
                                <h3>关卡设置</h3>
                                <div class="setting-row">
                                    <label>行数：</label>
                                    <input type="number" id="editorRows" value="6" min="4" max="12">
                                </div>
                                <div class="setting-row">
                                    <label>列数：</label>
                                    <input type="number" id="editorCols" value="6" min="4" max="12">
                                </div>
                                <div class="setting-row">
                                    <label>液体类型：</label>
                                    <select id="editorLiquid">
                                        <option value="water">💧 清水</option>
                                        <option value="sewage">🟢 污水</option>
                                        <option value="steam">♨️ 蒸汽</option>
                                    </select>
                                </div>
                                <div class="setting-row">
                                    <label>关卡名称：</label>
                                    <input type="text" id="editorName" placeholder="输入关卡名称">
                                </div>
                                <button class="btn btn-secondary" id="applySizeBtn">应用尺寸</button>
                            </div>
                            
                            <div class="editor-section">
                                <h3>管道工具</h3>
                                <div class="pipe-tool-grid">
                                    <div class="pipe-tool" data-type="straight">
                                        <span class="tool-icon">━</span>
                                        <span class="tool-label">直管</span>
                                    </div>
                                    <div class="pipe-tool" data-type="curve">
                                        <span class="tool-icon">┗</span>
                                        <span class="tool-label">弯管</span>
                                    </div>
                                    <div class="pipe-tool" data-type="t-pipe">
                                        <span class="tool-icon">┳</span>
                                        <span class="tool-label">T型管</span>
                                    </div>
                                    <div class="pipe-tool" data-type="cross">
                                        <span class="tool-icon">╋</span>
                                        <span class="tool-label">十字管</span>
                                    </div>
                                    <div class="pipe-tool" data-type="valve">
                                        <span class="tool-icon">⊙</span>
                                        <span class="tool-label">阀门</span>
                                    </div>
                                    <div class="pipe-tool" data-type="pump">
                                        <span class="tool-icon">⚡</span>
                                        <span class="tool-label">增压泵</span>
                                    </div>
                                    <div class="pipe-tool" data-type="blocked">
                                        <span class="tool-icon">✕</span>
                                        <span class="tool-label">堵塞</span>
                                    </div>
                                    <div class="pipe-tool" data-type="leaking">
                                        <span class="tool-icon">💦</span>
                                        <span class="tool-label">漏水</span>
                                    </div>
                                    <div class="pipe-tool" data-type="start">
                                        <span class="tool-icon">💧</span>
                                        <span class="tool-label">起点</span>
                                    </div>
                                    <div class="pipe-tool" data-type="end">
                                        <span class="tool-icon">🏠</span>
                                        <span class="tool-label">终点</span>
                                    </div>
                                    <div class="pipe-tool" data-type="erase">
                                        <span class="tool-icon">🗑</span>
                                        <span class="tool-label">清除</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="editor-section">
                                <h3>操作</h3>
                                <div class="editor-hint">
                                    <p>💡 提示：</p>
                                    <ul>
                                        <li>点击管道工具选择类型</li>
                                        <li>点击格子放置管道</li>
                                        <li>再次点击已放置管道可旋转</li>
                                        <li>必须设置一个起点和一个终点</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <div class="editor-main">
                            <div class="editor-grid-container">
                                <div class="editor-grid" id="editorGrid"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="editor-footer">
                        <button class="btn btn-secondary" id="clearGridBtn">清空网格</button>
                        <button class="btn btn-primary" id="testLevelBtn">🧪 测试关卡</button>
                        <button class="btn btn-primary" id="saveLevelBtn">💾 保存关卡</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', editorHTML);
        
        this.overlay = document.getElementById('editorOverlay');
        this.editorGrid = document.getElementById('editorGrid');
        this.rowsInput = document.getElementById('editorRows');
        this.colsInput = document.getElementById('editorCols');
        this.liquidSelect = document.getElementById('editorLiquid');
        this.nameInput = document.getElementById('editorName');
        
        this.bindEditorEvents();
        this.initEditorGrid();
    }

    bindEditorEvents() {
        document.getElementById('closeEditorBtn').addEventListener('click', () => this.close());
        document.getElementById('applySizeBtn').addEventListener('click', () => this.applySize());
        document.getElementById('clearGridBtn').addEventListener('click', () => this.clearGrid());
        document.getElementById('testLevelBtn').addEventListener('click', () => this.testLevel());
        document.getElementById('saveLevelBtn').addEventListener('click', () => this.saveLevel());
        
        this.liquidSelect.addEventListener('change', (e) => {
            this.selectedLiquidType = e.target.value;
        });
        
        document.querySelectorAll('.pipe-tool').forEach(tool => {
            tool.addEventListener('click', (e) => {
                const type = tool.dataset.type;
                this.selectedPipeType = type;
                document.querySelectorAll('.pipe-tool').forEach(t => t.classList.remove('selected'));
                tool.classList.add('selected');
            });
        });
        
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
    }

    applySize() {
        const rows = Math.max(4, Math.min(12, parseInt(this.rowsInput.value) || 6));
        const cols = Math.max(4, Math.min(12, parseInt(this.colsInput.value) || 6));
        this.rows = rows;
        this.cols = cols;
        this.rowsInput.value = rows;
        this.colsInput.value = cols;
        this.initEditorGrid();
    }

    initEditorGrid() {
        this.grid = [];
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = null;
            }
        }
        this.startPos = null;
        this.endPos = null;
        this.renderEditorGrid();
    }

    clearGrid() {
        if (confirm('确定要清空所有放置的管道吗？')) {
            this.initEditorGrid();
        }
    }

    renderEditorGrid() {
        this.editorGrid.innerHTML = '';
        this.editorGrid.style.gridTemplateColumns = `repeat(${this.cols}, 50px)`;
        this.editorGrid.style.gridTemplateRows = `repeat(${this.rows}, 50px)`;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'editor-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                if (this.grid[row][col]) {
                    const pipe = this.grid[row][col];
                    pipe.liquidType = this.selectedLiquidType;
                    const pipeEl = pipe.render();
                    pipeEl.style.pointerEvents = 'none';
                    cell.appendChild(pipeEl);
                    cell.classList.add('has-pipe');
                }
                
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                this.editorGrid.appendChild(cell);
            }
        }
    }

    handleCellClick(row, col) {
        if (this.selectedPipeType === 'erase') {
            if (this.grid[row][col]) {
                if (this.grid[row][col].isStart) this.startPos = null;
                if (this.grid[row][col].isEnd) this.endPos = null;
                this.grid[row][col] = null;
            }
            this.renderEditorGrid();
            return;
        }
        
        if (this.selectedPipeType === 'start') {
            if (this.startPos) {
                this.grid[this.startPos.row][this.startPos.col] = null;
            }
            const pipe = new Pipe(PIPE_TYPES.START, row, col);
            pipe.liquidType = this.selectedLiquidType;
            pipe.setRotation(0);
            this.grid[row][col] = pipe;
            this.startPos = { row, col };
            this.renderEditorGrid();
            return;
        }
        
        if (this.selectedPipeType === 'end') {
            if (this.endPos) {
                this.grid[this.endPos.row][this.endPos.col] = null;
            }
            const pipe = new Pipe(PIPE_TYPES.END, row, col);
            pipe.liquidType = this.selectedLiquidType;
            pipe.setRotation(0);
            this.grid[row][col] = pipe;
            this.endPos = { row, col };
            this.renderEditorGrid();
            return;
        }
        
        if (this.startPos && this.startPos.row === row && this.startPos.col === col) {
            return;
        }
        if (this.endPos && this.endPos.row === row && this.endPos.col === col) {
            return;
        }
        
        if (this.grid[row][col] && this.grid[row][col].type === this.selectedPipeType) {
            if (!this.grid[row][col].isStart && !this.grid[row][col].isEnd && 
                !this.grid[row][col].isBlocked && !this.grid[row][col].isLeaking) {
                this.grid[row][col].rotate();
            }
            this.renderEditorGrid();
            return;
        }
        
        const pipe = new Pipe(this.selectedPipeType, row, col);
        pipe.liquidType = this.selectedLiquidType;
        this.grid[row][col] = pipe;
        this.renderEditorGrid();
    }

    collectLevelData() {
        const pipes = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col]) {
                    pipes.push(this.grid[row][col].toJSON());
                }
            }
        }
        
        return {
            name: this.nameInput.value || '自定义关卡',
            rows: this.rows,
            cols: this.cols,
            liquidType: this.selectedLiquidType,
            startPos: this.startPos,
            endPos: this.endPos,
            pipes: pipes
        };
    }

    testLevel() {
        if (!this.startPos || !this.endPos) {
            alert('请设置起点和终点！');
            return;
        }
        
        const levelData = this.collectLevelData();
        this.game.playCustomLevel(levelData);
        this.close();
        
        if (window.gameUI) {
            window.gameUI.renderGrid();
            this.game.startTimer();
            window.gameUI.updateUI();
            window.gameUI.updateLiquidInfo();
        }
    }

    saveLevel() {
        if (!this.startPos || !this.endPos) {
            alert('请设置起点和终点！');
            return;
        }
        
        const levelData = this.collectLevelData();
        this.game.saveCustomLevel(levelData);
        alert('关卡已保存！');
    }

    close() {
        this.overlay.remove();
    }
}

window.LevelEditor = LevelEditor;