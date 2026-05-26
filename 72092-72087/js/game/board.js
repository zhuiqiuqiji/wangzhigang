class Board {
  constructor(rows, cols, allowedColors = null) {
    this.rows = rows;
    this.cols = cols;
    this.grid = [];
    this.selected = null;
    this.isAnimating = false;
    this.allowedColors = allowedColors;
  }

  init(allowedColors = null) {
    if (allowedColors) {
      this.allowedColors = allowedColors;
    }
    this.grid = [];
    for (let row = 0; row < this.rows; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.cols; col++) {
        this.grid[row][col] = this.getRandomBlock();
      }
    }
    this.removeInitialMatches();
  }

  getRandomBlock() {
    let availableTypes = BLOCK_TYPES;
    if (this.allowedColors && this.allowedColors.length > 0) {
      availableTypes = BLOCK_TYPES.filter(b => this.allowedColors.includes(b.id));
    }
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    return { ...type, id: type.id };
  }

  removeInitialMatches() {
    let hasMatches = true;
    while (hasMatches) {
      const matches = this.findMatches();
      if (matches.length === 0) {
        hasMatches = false;
      } else {
        matches.forEach(({ row, col }) => {
          this.grid[row][col] = this.getRandomBlock();
        });
      }
    }
  }

  findMatches() {
    const matches = [];
    const matched = new Set();

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols - 2; col++) {
        const block = this.grid[row][col];
        if (block &&
            this.grid[row][col + 1]?.id === block.id &&
            this.grid[row][col + 2]?.id === block.id) {
          let endCol = col + 2;
          while (endCol + 1 < this.cols && this.grid[row][endCol + 1]?.id === block.id) {
            endCol++;
          }
          for (let c = col; c <= endCol; c++) {
            const key = `${row},${c}`;
            if (!matched.has(key)) {
              matched.add(key);
              matches.push({ row, col: c, type: block.id });
            }
          }
        }
      }
    }

    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows - 2; row++) {
        const block = this.grid[row][col];
        if (block &&
            this.grid[row + 1]?.[col]?.id === block.id &&
            this.grid[row + 2]?.[col]?.id === block.id) {
          let endRow = row + 2;
          while (endRow + 1 < this.rows && this.grid[endRow + 1]?.[col]?.id === block.id) {
            endRow++;
          }
          for (let r = row; r <= endRow; r++) {
            const key = `${r},${col}`;
            if (!matched.has(key)) {
              matched.add(key);
              matches.push({ row: r, col, type: block.id });
            }
          }
        }
      }
    }

    return matches;
  }

  swap(row1, col1, row2, col2) {
    const temp = this.grid[row1][col1];
    this.grid[row1][col1] = this.grid[row2][col2];
    this.grid[row2][col2] = temp;
  }

  isValidSwap(row1, col1, row2, col2) {
    this.swap(row1, col1, row2, col2);
    const matches = this.findMatches();
    this.swap(row1, col1, row2, col2);
    return matches.length > 0;
  }

  removeMatches(matches) {
    matches.forEach(({ row, col }) => {
      this.grid[row][col] = null;
    });
  }

  dropBlocks() {
    let dropped = false;
    for (let col = 0; col < this.cols; col++) {
      let emptyRow = this.rows - 1;
      for (let row = this.rows - 1; row >= 0; row--) {
        if (this.grid[row][col] !== null) {
          if (row !== emptyRow) {
            this.grid[emptyRow][col] = this.grid[row][col];
            this.grid[row][col] = null;
            dropped = true;
          }
          emptyRow--;
        }
      }
    }
    return dropped;
  }

  fillEmpty() {
    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        if (this.grid[row][col] === null) {
          this.grid[row][col] = this.getRandomBlock();
        }
      }
    }
  }

  getBlockAt(row, col) {
    return this.grid[row]?.[col];
  }

  setSelected(row, col) {
    this.selected = { row, col };
  }

  clearSelected() {
    this.selected = null;
  }

  isAdjacent(row1, col1, row2, col2) {
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }
}
