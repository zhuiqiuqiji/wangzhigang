class GardenSystem {
  constructor(store) {
    this.store = store;
    this.gridSize = 5;
    this.selectedDecoration = null;
  }

  getGarden() {
    return this.store.getState().garden;
  }

  getGrid() {
    return this.getGarden().grid;
  }

  getDecorations() {
    return this.getGarden().decorations;
  }

  getDecorationQuantity(decorationId) {
    return this.getDecorations()[decorationId] || 0;
  }

  getAvailableQuantity(decorationId) {
    const total = this.getDecorationQuantity(decorationId);
    const placed = this.countPlaced(decorationId);
    return total - placed;
  }

  countPlaced(decorationId) {
    const grid = this.getGrid();
    let count = 0;
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (grid[row][col] === decorationId) count++;
      }
    }
    return count;
  }

  getPlacedDecoration(row, col) {
    const grid = this.getGrid();
    const decorationId = grid[row]?.[col];
    if (!decorationId) return null;
    return SHOP_ITEMS.find(item => item.id === decorationId);
  }

  selectDecoration(decorationId) {
    const available = this.getAvailableQuantity(decorationId) > 0;
    if (available) {
      this.selectedDecoration = decorationId;
      return true;
    }
    return false;
  }

  placeDecoration(row, col) {
    if (!this.selectedDecoration) return false;
    if (this.getAvailableQuantity(this.selectedDecoration) <= 0) {
      this.selectedDecoration = null;
      return false;
    }
    
    const state = this.store.getState();
    const newGrid = state.garden.grid.map(r => [...r]);
    newGrid[row][col] = this.selectedDecoration;
    
    this.store.setState({
      garden: {
        ...state.garden,
        grid: newGrid
      }
    });
    
    return true;
  }

  removeDecoration(row, col) {
    const state = this.store.getState();
    const newGrid = state.garden.grid.map(r => [...r]);
    
    if (newGrid[row][col]) {
      newGrid[row][col] = null;
      this.store.setState({
        garden: {
          ...state.garden,
          grid: newGrid
        }
      });
      return true;
    }
    return false;
  }

  clearSelection() {
    this.selectedDecoration = null;
  }

  getSelectedDecoration() {
    return this.selectedDecoration;
  }

  getDecorationCount() {
    const grid = this.getGrid();
    let count = 0;
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (grid[row][col]) count++;
      }
    }
    return count;
  }
}
