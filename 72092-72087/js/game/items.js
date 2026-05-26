class ItemSystem {
  constructor(store) {
    this.store = store;
    this.selectedItem = null;
    this.itemsUsedThisLevel = [];
  }

  getItems() {
    return SPECIAL_ITEMS;
  }

  getItemById(id) {
    return SPECIAL_ITEMS.find(item => item.id === id);
  }

  getOwnedItems() {
    const state = this.store.getState();
    return state.items || {};
  }

  getQuantity(itemId) {
    const owned = this.getOwnedItems();
    return owned[itemId] || 0;
  }

  hasItem(itemId) {
    return this.getQuantity(itemId) > 0;
  }

  purchaseItem(itemId) {
    const item = this.getItemById(itemId);
    if (!item) return { success: false, message: '道具不存在' };

    const state = this.store.getState();
    if (state.coins < item.price.coins || state.stars < item.price.stars) {
      return { success: false, message: '资源不足' };
    }

    const currentQty = state.items?.[itemId] || 0;
    this.store.setState({
      coins: state.coins - item.price.coins,
      stars: state.stars - item.price.stars,
      items: {
        ...state.items,
        [itemId]: currentQty + 1
      }
    });

    return { success: true, message: `购买${item.name}成功！` };
  }

  useItem(itemId, board, levelSystem) {
    if (!this.hasItem(itemId)) return { success: false, message: '没有该道具' };

    const item = this.getItemById(itemId);
    if (!item) return { success: false, message: '道具不存在' };

    const state = this.store.getState();
    const newQty = (state.items?.[itemId] || 0) - 1;
    this.store.setState({
      items: {
        ...state.items,
        [itemId]: newQty
      }
    });

    this.itemsUsedThisLevel.push(itemId);

    let result = { success: true, message: `使用了${item.name}！`, effect: null };

    switch (itemId) {
      case 'rainbow':
        result.effect = this.applyRainbow(board, levelSystem);
        break;
      case 'hammer':
        result.effect = { type: 'select_target', message: '点击要消除的方块' };
        break;
      case 'extra_moves':
        levelSystem.addMoves(5);
        result.effect = { type: 'moves_added', count: 5 };
        break;
      case 'shuffle':
        board.init();
        result.effect = { type: 'shuffled' };
        break;
      case 'bomb':
        result.effect = { type: 'select_target', message: '点击要爆炸的位置' };
        break;
      case 'time_freeze':
        if (levelSystem.isTimeLimit) {
          levelSystem.addTime(30);
          result.effect = { type: 'time_added', count: 30 };
        } else {
          result.effect = { type: 'skip_move' };
          levelSystem.addMoves(1);
        }
        break;
    }

    return result;
  }

  applyRainbow(board, levelSystem) {
    const colors = {};
    for (let row = 0; row < board.rows; row++) {
      for (let col = 0; col < board.cols; col++) {
        const block = board.getBlockAt(row, col);
        if (block) {
          colors[block.id] = colors[block.id] || 0;
          colors[block.id]++;
        }
      }
    }

    let mostColor = null;
    let maxCount = 0;
    Object.entries(colors).forEach(([color, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostColor = color;
      }
    });

    if (!mostColor) return { type: 'rainbow', removed: 0 };

    let removed = 0;
    const matches = [];
    const obstacles = levelSystem.getObstacles();

    for (let row = 0; row < board.rows; row++) {
      for (let col = 0; col < board.cols; col++) {
        const block = board.getBlockAt(row, col);
        if (block && block.id === mostColor) {
          matches.push({ row, col, type: block.id });
          removed++;

          const obstacle = obstacles.find(o => o.row === row && o.col === col);
          if (obstacle) {
            const hitResult = levelSystem.hitObstacle(row, col);
            if (hitResult?.destroyed) {
              levelSystem.addProgress(hitResult.type, 1);
            }
          }
        }
      }
    }

    if (matches.length > 0) {
      levelSystem.processMatchGroup(matches);
    }

    matches.forEach(m => levelSystem.addProgress(m.type, 1));
    board.removeMatches(matches);

    return { type: 'rainbow', color: mostColor, removed, matches };
  }

  applyHammer(board, row, col, levelSystem) {
    const block = board.getBlockAt(row, col);
    if (!block) return { success: false, message: '无效位置' };

    board.grid[row][col] = null;

    const matches = [{ row, col, type: block.id }];
    levelSystem.processMatchGroup(matches);
    levelSystem.addProgress(block.id, 1);
    levelSystem.addScore(20);

    const obstacle = levelSystem.getObstacles().find(o => o.row === row && o.col === col);
    if (obstacle) {
      const hitResult = levelSystem.hitObstacle(row, col);
      if (hitResult?.destroyed) {
        levelSystem.addProgress(hitResult.type, 1);
      }
    }

    board.dropBlocks();
    board.fillEmpty();

    return { success: true, removed: block };
  }

  applyBomb(board, row, col, levelSystem) {
    const matches = [];
    const obstacles = levelSystem.getObstacles();

    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (r >= 0 && r < board.rows && c >= 0 && c < board.cols) {
          const block = board.getBlockAt(r, c);
          if (block) {
            matches.push({ row: r, col: c, type: block.id });
          }

          const obstacle = obstacles.find(o => o.row === r && o.col === c);
          if (obstacle) {
            const hitResult = levelSystem.hitObstacle(r, c);
            if (hitResult?.destroyed) {
              levelSystem.addProgress(hitResult.type, 1);
            }
          }
        }
      }
    }

    if (matches.length > 0) {
      levelSystem.processMatchGroup(matches);
    }

    matches.forEach(m => levelSystem.addProgress(m.type, 1));
    board.removeMatches(matches);
    board.dropBlocks();
    board.fillEmpty();

    return { success: true, removed: matches.length };
  }

  selectItem(itemId) {
    this.selectedItem = itemId;
  }

  clearSelection() {
    this.selectedItem = null;
  }

  getSelectedItem() {
    return this.selectedItem;
  }

  getItemsUsedThisLevel() {
    return this.itemsUsedThisLevel;
  }

  resetLevelUsage() {
    this.itemsUsedThisLevel = [];
  }
}
