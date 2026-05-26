class GardenMatch3Game {
  constructor() {
    this.init();
  }

  init() {
    this.store = new Store(Storage.load());
    this.board = new Board(BOARD_ROWS, BOARD_COLS);
    this.levelSystem = new LevelSystem(this.store);
    this.gardenSystem = new GardenSystem(this.store);
    this.shopSystem = new ShopSystem(this.store);
    this.itemSystem = new ItemSystem(this.store);
    this.storySystem = new StorySystem(this.store);
    this.socialSystem = new SocialSystem(this.store);
    this.eventSystem = new EventSystem(this.store);

    this.currentTab = 'game';
    this.isProcessing = false;
    this.pendingItemAction = null;
    this.selectedBuffs = [];
    this.currentShopCategory = 'all';
    this.redCollectedThisLevel = 0;
    this.comboCount = 0;
    this.movesUsedThisLevel = 0;
    this.levelCompletedNoItems = true;

    this.store.subscribe(() => {
      Storage.save(this.store.getState());
      this.updateResourcesDisplay();
    });

    this.startLevel(this.store.getState().currentLevel || 1, [], true);
    this.setupEventListeners();
    this.checkStoryProgress();
    this.updateEventBanner();
    this.render();
  }

  startLevel(levelId, selectedBuffs = [], skipBuffModal = false) {
    this.levelSystem.startLevel(levelId, selectedBuffs);
    this.itemSystem.resetLevelUsage();
    this.redCollectedThisLevel = 0;
    this.comboCount = 0;
    this.movesUsedThisLevel = 0;
    this.levelCompletedNoItems = true;

    const progress = this.levelSystem.getProgress();
    const targetColors = progress.level ? Object.keys(progress.level.target).filter(k =>
      BLOCK_TYPES.some(b => b.id === k)
    ) : null;
    this.board.init(targetColors);
    this.store.setState({ currentLevel: levelId });
    this.updateLevelUI();
    this.renderBoard();
    this.renderItems();

    if (this.levelSystem.isTimeLimit) {
      this.levelSystem.startTimer((time) => {
        document.getElementById('moves-left').textContent = time;
        if (time <= 0 && !this.levelSystem.checkWin()) {
          this.handleLose();
        }
      });
    }

    if (!skipBuffModal && selectedBuffs.length === 0 && this.levelSystem.getStory()) {
      this.showBuffSelection();
    }
  }

  showBuffSelection() {
    const container = document.getElementById('buffs-selection');
    container.innerHTML = '';

    START_BUFFS.forEach(buff => {
      const buffEl = document.createElement('div');
      buffEl.className = 'buff-card';
      buffEl.dataset.buffId = buff.id;
      buffEl.innerHTML = `
        <div class="buff-emoji">${buff.emoji}</div>
        <div class="buff-name">${buff.name}</div>
        <div class="buff-desc">${buff.description}</div>
        <div class="buff-price">💰 ${buff.price.coins}</div>
      `;
      buffEl.addEventListener('click', () => {
        const isSelected = buffEl.classList.toggle('selected');
        if (isSelected) {
          this.selectedBuffs.push(buff.id);
        } else {
          this.selectedBuffs = this.selectedBuffs.filter(id => id !== buff.id);
        }
      });
      container.appendChild(buffEl);
    });

    this.selectedBuffs = [];
    document.getElementById('buff-modal').classList.add('show');
  }

  setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
      this.levelSystem.stopTimer();
      this.startLevel(this.levelSystem.getCurrentLevelId(), this.selectedBuffs);
    });

    document.getElementById('modal-continue-btn').addEventListener('click', () => {
      this.hideModal('result-modal');
      if (this.levelSystem.hasNextLevel()) {
        this.startLevel(this.levelSystem.getNextLevelId(), [], true);
      } else {
        this.showToast('恭喜！你已完成所有关卡！', 'success');
      }
    });

    document.getElementById('modal-retry-btn').addEventListener('click', () => {
      this.hideModal('result-modal');
      this.levelSystem.stopTimer();
      this.startLevel(this.levelSystem.getCurrentLevelId(), [], true);
    });

    document.getElementById('buff-start-btn').addEventListener('click', () => {
      document.getElementById('buff-modal').classList.remove('show');
      if (this.selectedBuffs.length > 0) {
        const state = this.store.getState();
        let totalCost = 0;
        this.selectedBuffs.forEach(id => {
          const buff = START_BUFFS.find(b => b.id === id);
          if (buff) totalCost += buff.price.coins;
        });
        if (state.coins >= totalCost) {
          this.store.setState({ coins: state.coins - totalCost });
        } else {
          this.selectedBuffs = [];
          this.showToast('金币不足，未使用Buff', 'warning');
        }
      }
      this.levelSystem.stopTimer();
      this.startLevel(this.levelSystem.getCurrentLevelId(), this.selectedBuffs, true);
    });

    document.getElementById('buff-skip-btn').addEventListener('click', () => {
      document.getElementById('buff-modal').classList.remove('show');
      this.selectedBuffs = [];
    });

    document.getElementById('events-btn').addEventListener('click', () => {
      this.showEventsModal();
    });

    document.getElementById('friends-btn').addEventListener('click', () => {
      this.showFriendsModal();
    });

    document.getElementById('story-btn').addEventListener('click', () => {
      this.showStoryModal();
    });

    document.getElementById('settings-btn').addEventListener('click', () => {
      document.getElementById('settings-modal').classList.add('show');
    });

    document.getElementById('events-close-btn').addEventListener('click', () => {
      this.hideModal('events-modal');
    });

    document.getElementById('friends-close-btn').addEventListener('click', () => {
      this.hideModal('friends-modal');
    });

    document.getElementById('story-close-btn').addEventListener('click', () => {
      this.hideModal('story-modal');
    });

    document.getElementById('settings-close-btn').addEventListener('click', () => {
      this.hideModal('settings-modal');
    });

    document.getElementById('visit-close-btn').addEventListener('click', () => {
      this.hideModal('visit-modal');
      this.socialSystem.leaveFriendGarden();
    });

    document.getElementById('visit-gift-btn').addEventListener('click', () => {
      const visited = this.socialSystem.getVisitedFriend();
      if (visited) {
        const result = this.socialSystem.sendGift(visited.id, 'energy');
        this.showToast(result.message, result.success ? 'success' : 'error');
      }
    });

    document.querySelectorAll('.event-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.eventTab;
        document.querySelectorAll('.event-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.events-content').forEach(c => c.classList.add('hidden'));
        document.getElementById(`events-${tab}`).classList.remove('hidden');
      });
    });

    document.querySelectorAll('.friend-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.friendTab;
        document.querySelectorAll('.friend-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.friends-content').forEach(c => c.classList.add('hidden'));
        document.getElementById(`friends-${tab}`).classList.remove('hidden');
      });
    });

    document.querySelectorAll('.shop-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.shopTab;
        document.querySelectorAll('.shop-tab-btn').forEach(b => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.shop-tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById(`${tab}-shop`).classList.remove('hidden');
      });
    });

    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentShopCategory = btn.dataset.category;
        document.querySelectorAll('.category-btn').forEach(b => b.classList.toggle('active', b === btn));
        this.renderShopDecorations();
      });
    });

    document.getElementById('save-cloud-btn').addEventListener('click', () => {
      const result = Storage.saveToCloud(this.store.getState());
      this.showToast(result.message, result.success ? 'success' : 'error');
    });

    document.getElementById('load-cloud-btn').addEventListener('click', () => {
      const result = Storage.loadFromCloud();
      if (result.success) {
        const merged = Storage.mergeSaves(this.store.getState(), result.state);
        this.store.setState(merged);
        this.showToast('云存档同步成功！', 'success');
        this.render();
      } else {
        this.showToast(result.message, 'error');
      }
    });

    document.getElementById('export-save-btn').addEventListener('click', () => {
      const data = Storage.exportSave();
      if (data) {
        navigator.clipboard.writeText(data).then(() => {
          this.showToast('存档已复制到剪贴板！', 'success');
        }).catch(() => {
          this.showToast('导出成功，请手动复制', 'success');
          console.log('存档数据:', data);
        });
      }
    });

    document.getElementById('import-save-btn').addEventListener('click', () => {
      const data = prompt('请粘贴存档数据:');
      if (data) {
        const result = Storage.importSave(data);
        this.showToast(result.message, result.success ? 'success' : 'error');
        if (result.success) {
          this.store = new Store(Storage.load());
          this.render();
        }
      }
    });

    document.getElementById('reset-game-btn').addEventListener('click', () => {
      if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
        Storage.reset();
        this.store = new Store(Storage.load());
        this.render();
        this.showToast('游戏已重置', 'success');
      }
    });

    document.getElementById('use-hammer-btn').addEventListener('click', () => {
      this.pendingItemAction = 'hammer';
      this.showItemTargetOverlay('点击要消除的方块');
    });

    document.getElementById('use-bomb-btn').addEventListener('click', () => {
      this.pendingItemAction = 'bomb';
      this.showItemTargetOverlay('点击要爆炸的位置');
    });

    document.getElementById('item-target-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.hideItemTargetOverlay();
        this.pendingItemAction = null;
      }
    });
  }

  showItemTargetOverlay(message) {
    const overlay = document.getElementById('item-target-overlay');
    overlay.querySelector('.target-hint').textContent = message;
    overlay.classList.remove('hidden');
  }

  hideItemTargetOverlay() {
    document.getElementById('item-target-overlay').classList.add('hidden');
  }

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.getElementById('game-section').classList.toggle('hidden', tab !== 'game');
    document.getElementById('garden-section').classList.toggle('hidden', tab !== 'garden');
    document.getElementById('shop-section').classList.toggle('hidden', tab !== 'shop');
    document.getElementById('levels-section').classList.toggle('hidden', tab !== 'levels');

    if (tab === 'garden') {
      this.renderGarden();
      this.renderShop();
      this.renderInventory();
    } else if (tab === 'shop') {
      this.renderShopPage();
    } else if (tab === 'levels') {
      this.renderLevelsPage();
    }
  }

  render() {
    this.updateResourcesDisplay();
    this.renderBoard();
    this.updateLevelUI();
    this.renderItems();
  }

  updateResourcesDisplay() {
    const state = this.store.getState();
    document.getElementById('coins-display').textContent = state.coins;
    document.getElementById('stars-display').textContent = state.stars;
    document.getElementById('energy-display').textContent = `${state.energy}/${state.maxEnergy}`;
  }

  updateLevelUI() {
    const progress = this.levelSystem.getProgress();
    if (progress.level) {
      document.getElementById('level-number').textContent = progress.level.id;
      document.getElementById('level-name').textContent = progress.level.name;

      if (progress.isTimeLimit) {
        document.getElementById('moves-label').textContent = '剩余时间: ';
        document.getElementById('moves-left').textContent = progress.timeLeft;
      } else {
        document.getElementById('moves-label').textContent = '剩余步数: ';
        document.getElementById('moves-left').textContent = progress.movesLeft;
      }

      document.getElementById('score-display').textContent = progress.score;
      this.renderTargets(progress);
      this.renderObstacles(progress);
      this.renderStoryHint(progress);
    }
  }

  renderStoryHint(progress) {
    const storyHint = document.getElementById('story-hint');
    const story = this.levelSystem.getStory();
    if (story) {
      storyHint.textContent = story;
      storyHint.classList.remove('hidden');
    } else {
      storyHint.classList.add('hidden');
    }
  }

  renderTargets(progress) {
    const container = document.getElementById('targets-container');
    container.innerHTML = '';

    const goalType = this.levelSystem.getGoalType();

    if (goalType === LEVEL_GOAL_TYPES.SCORE || goalType === LEVEL_GOAL_TYPES.TIME_LIMIT) {
      const targetScore = this.levelSystem.currentLevel.targetScore || 0;
      const currentScore = progress.score;
      const completed = currentScore >= targetScore;

      const targetEl = document.createElement('div');
      targetEl.className = `target-item score-target ${completed ? 'completed' : ''}`;
      targetEl.innerHTML = `
        <span class="target-emoji">🎯</span>
        <span>${currentScore}/${targetScore}</span>
      `;
      container.appendChild(targetEl);
      return;
    }

    if (goalType === LEVEL_GOAL_TYPES.COLLECT_ORDER) {
      this.renderCollectOrder(progress);
      return;
    }

    if (goalType === LEVEL_GOAL_TYPES.DROP_ITEMS) {
      this.renderDropItems(progress);
      return;
    }

    Object.entries(progress.level.target).forEach(([color, target]) => {
      if (target >= 999) return;
      const current = progress.progress[color] || 0;
      const blockType = BLOCK_TYPES.find(b => b.id === color);
      const obstacleType = OBSTACLE_TYPES.find(o => o.id === color);
      const completed = current >= target;

      const targetEl = document.createElement('div');
      targetEl.className = `target-item ${completed ? 'completed' : ''}`;

      if (blockType) {
        targetEl.innerHTML = `
          <span class="target-emoji">${blockType.emoji}</span>
          <span>${current}/${target}</span>
        `;
      } else if (obstacleType) {
        targetEl.innerHTML = `
          <span class="target-emoji">${obstacleType.emoji}</span>
          <span>${current}/${target}</span>
        `;
      } else {
        targetEl.innerHTML = `
          <span class="target-emoji">❓</span>
          <span>${current}/${target}</span>
        `;
      }
      container.appendChild(targetEl);
    });
  }

  renderCollectOrder(progress) {
    const container = document.getElementById('targets-container');
    container.innerHTML = '';

    const orderDisplay = document.createElement('div');
    orderDisplay.className = 'collect-order-display';

    progress.collectOrder.forEach((type, index) => {
      const blockType = BLOCK_TYPES.find(b => b.id === type);
      const stepEl = document.createElement('div');
      let stepClass = 'order-step';
      if (index < progress.currentOrderIndex) {
        stepClass += ' completed';
      } else if (index === progress.currentOrderIndex) {
        stepClass += ' current';
      }
      stepEl.className = stepClass;
      stepEl.textContent = blockType?.emoji || '?';
      orderDisplay.appendChild(stepEl);

      if (index < progress.collectOrder.length - 1) {
        const arrow = document.createElement('div');
        arrow.className = 'order-arrow';
        arrow.textContent = '→';
        orderDisplay.appendChild(arrow);
      }
    });

    container.appendChild(orderDisplay);
  }

  renderDropItems(progress) {
    const container = document.getElementById('targets-container');
    container.innerHTML = '';

    const dropDisplay = document.createElement('div');
    dropDisplay.className = 'drop-items-display';

    progress.dropItems.forEach(item => {
      const blockType = BLOCK_TYPES.find(b => b.id === item.type);
      const dropEl = document.createElement('div');
      dropEl.className = `drop-item ${item.dropped ? 'dropped' : ''}`;
      dropEl.innerHTML = `
        <span>${blockType?.emoji || '?'}</span>
        <span>${item.dropped ? '✓' : '...'}</span>
      `;
      dropDisplay.appendChild(dropEl);
    });

    container.appendChild(dropDisplay);
  }

  renderObstacles(progress) {
    const container = document.getElementById('obstacles-container');

    if (progress.obstacles.length === 0) {
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');
    container.innerHTML = '';

    const counts = {};
    progress.obstacles.forEach(o => {
      counts[o.type] = (counts[o.type] || 0) + 1;
    });

    Object.entries(counts).forEach(([type, count]) => {
      const obstacleType = OBSTACLE_TYPES.find(o => o.id === type);
      const obstacleEl = document.createElement('div');
      obstacleEl.className = 'obstacle-item';
      obstacleEl.innerHTML = `
        <span class="obstacle-emoji">${obstacleType?.emoji || '?'}</span>
        <span>${obstacleType?.name || type} x${count}</span>
      `;
      container.appendChild(obstacleEl);
    });
  }

  renderBoard() {
    const boardEl = document.getElementById('game-board');
    boardEl.innerHTML = '';

    const obstacles = this.levelSystem.getObstacles();

    for (let row = 0; row < this.board.rows; row++) {
      for (let col = 0; col < this.board.cols; col++) {
        const block = this.board.getBlockAt(row, col);
        const obstacle = obstacles.find(o => o.row === row && o.col === col);

        const blockEl = document.createElement('div');
        blockEl.className = `block block-${block?.id || 'red'}`;

        if (obstacle) {
          const obstacleType = OBSTACLE_TYPES.find(o => o.id === obstacle.type);
          blockEl.textContent = obstacleType?.emoji || '';
          blockEl.classList.add('has-obstacle');
        } else {
          blockEl.textContent = block?.emoji || '';
        }

        blockEl.dataset.row = row;
        blockEl.dataset.col = col;

        if (this.board.selected?.row === row && this.board.selected?.col === col) {
          blockEl.classList.add('selected');
        }

        blockEl.addEventListener('click', () => this.handleBlockClick(row, col));
        boardEl.appendChild(blockEl);
      }
    }
  }

  renderItems() {
    const container = document.getElementById('items-container');
    container.innerHTML = '';

    SPECIAL_ITEMS.forEach(item => {
      const quantity = this.itemSystem.getQuantity(item.id);
      const itemEl = document.createElement('div');
      itemEl.className = `game-item ${quantity <= 0 ? 'disabled' : ''}`;
      itemEl.dataset.itemId = item.id;
      itemEl.innerHTML = `
        <span class="game-item-emoji">${item.emoji}</span>
        <span class="game-item-count">x${quantity}</span>
      `;
      itemEl.title = `${item.name}: ${item.description}`;

      itemEl.addEventListener('click', () => {
        if (quantity <= 0) {
          this.showToast(`没有${item.name}，去商店购买吧！`, 'warning');
          return;
        }
        this.handleItemUse(item.id);
      });

      container.appendChild(itemEl);
    });
  }

  handleItemUse(itemId) {
    const item = this.itemSystem.getItemById(itemId);
    if (!item) return;

    if (itemId === 'hammer' || itemId === 'bomb') {
      this.pendingItemAction = itemId;
      this.showItemTargetOverlay(`点击要${itemId === 'hammer' ? '消除' : '爆炸'}的位置`);
      this.showToast(item.description, 'info');
      return;
    }

    const result = this.itemSystem.useItem(itemId, this.board, this.levelSystem);

    if (result.success) {
      this.levelCompletedNoItems = false;
      this.showToast(result.message, 'success');
      this.renderBoard();
      this.renderItems();
      this.updateLevelUI();

      if (this.levelSystem.checkWin()) {
        this.handleWin();
      }
    } else {
      this.showToast(result.message, 'error');
    }
  }

  handleBlockClick(row, col) {
    if (this.isProcessing) return;

    if (this.pendingItemAction) {
      this.handleItemTargetClick(row, col);
      return;
    }

    if (this.board.selected === null) {
      this.board.setSelected(row, col);
      this.renderBoard();
    } else {
      const selected = this.board.selected;

      if (selected.row === row && selected.col === col) {
        this.board.clearSelected();
        this.renderBoard();
        return;
      }

      if (this.board.isAdjacent(selected.row, selected.col, row, col)) {
        this.trySwap(selected.row, selected.col, row, col);
      } else {
        this.board.setSelected(row, col);
        this.renderBoard();
      }
    }
  }

  handleItemTargetClick(row, col) {
    if (this.pendingItemAction === 'hammer') {
      const result = this.itemSystem.applyHammer(this.board, row, col, this.levelSystem);
      if (result.success) {
        this.levelCompletedNoItems = false;
        this.showToast('锤子使用成功！', 'success');
        this.renderBoard();
        this.renderItems();
        this.updateLevelUI();
        this.checkGameEnd();
      }
    } else if (this.pendingItemAction === 'bomb') {
      const result = this.itemSystem.applyBomb(this.board, row, col, this.levelSystem);
      if (result.success) {
        this.levelCompletedNoItems = false;
        this.showToast(`炸弹爆炸！消除了${result.removed}个方块`, 'success');
        this.renderBoard();
        this.renderItems();
        this.updateLevelUI();
        this.checkGameEnd();
      }
    }

    this.pendingItemAction = null;
    this.hideItemTargetOverlay();
  }

  async trySwap(row1, col1, row2, col2) {
    if (!this.levelSystem.isTimeLimit && this.levelSystem.getProgress().movesLeft <= 0) {
      this.board.clearSelected();
      this.renderBoard();
      this.showToast('步数已用完，请重新开始关卡', 'error');
      return;
    }

    this.isProcessing = true;

    if (this.board.isValidSwap(row1, col1, row2, col2)) {
      this.board.swap(row1, col1, row2, col2);
      this.board.clearSelected();
      this.levelSystem.useMove();
      this.movesUsedThisLevel++;
      this.updateLevelUI();
      this.renderBoard();

      await this.processMatches();

      this.checkGameEnd();
    } else {
      this.board.clearSelected();
      this.renderBoard();
    }

    this.isProcessing = false;
  }

  checkGameEnd() {
    if (this.levelSystem.checkWin()) {
      this.handleWin();
    } else if (this.levelSystem.checkLose()) {
      this.handleLose();
    }
  }

  async processMatches() {
    let hasMatches = true;
    let matchCount = 0;

    while (hasMatches) {
      const matches = this.board.findMatches();

      if (matches.length === 0) {
        hasMatches = false;
        break;
      }

      matchCount++;
      if (matchCount > 1) {
        this.comboCount++;
        const state = this.store.getState();
        this.store.setState({
          combo: this.comboCount,
          maxCombo: Math.max(state.maxCombo, this.comboCount)
        });
      }

      this.levelSystem.processMatchGroup(matches);

      matches.forEach(match => {
        this.levelSystem.addProgress(match.type, 1);
        if (match.type === 'red') {
          this.redCollectedThisLevel++;
        }
      });

      const obstacles = this.levelSystem.getObstacles();
      matches.forEach(({ row, col }) => {
        const obstacle = obstacles.find(o => o.row === row && o.col === col);
        if (obstacle) {
          const hitResult = this.levelSystem.hitObstacle(row, col);
          if (hitResult?.destroyed) {
            this.levelSystem.addProgress(hitResult.type, 1);
          }
        }
      });

      this.updateLevelUI();

      this.animateMatches(matches);
      await this.delay(400);

      this.board.removeMatches(matches);
      this.board.dropBlocks();
      this.board.fillEmpty();
      this.renderBoard();
      await this.delay(300);
    }
  }

  animateMatches(matches) {
    const boardEl = document.getElementById('game-board');
    matches.forEach(({ row, col }) => {
      const index = row * this.board.cols + col;
      const blockEl = boardEl.children[index];
      if (blockEl) {
        blockEl.classList.add('matched');
      }
    });
  }

  handleWin() {
    this.levelSystem.stopTimer();
    const reward = this.levelSystem.getReward();
    const state = this.store.getState();

    this.store.setState({
      coins: state.coins + reward.coins,
      stars: state.stars + reward.stars,
      levelsCompleted: Math.max(state.levelsCompleted, this.levelSystem.getCurrentLevelId())
    });

    this.updateDailyChallenges();
    this.checkStoryProgress();

    document.getElementById('result-title').textContent = '🎉 关卡完成！';
    document.getElementById('result-message').textContent = '太棒了！你成功完成了关卡！';
    document.getElementById('reward-coins').textContent = `+${reward.coins}`;
    document.getElementById('reward-stars').textContent = `+${reward.stars}`;
    document.getElementById('modal-continue-btn').style.display = 'inline-block';
    document.getElementById('chapter-unlock').classList.add('hidden');

    this.showModal('result-modal');
  }

  updateDailyChallenges() {
    const progressData = {
      movesUsed: this.movesUsedThisLevel,
      completed: true,
      redCollected: this.redCollectedThisLevel,
      combo: this.comboCount,
      noItems: this.levelCompletedNoItems,
      decorationsPlaced: this.countDecorationsPlaced()
    };

    DAILY_CHALLENGES.forEach(challenge => {
      this.eventSystem.updateDailyChallenge(challenge.id, progressData);
    });
  }

  countDecorationsPlaced() {
    const state = this.store.getState();
    const grid = state.garden?.grid || [];
    let count = 0;
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell) count++;
      });
    });
    return count;
  }

  checkStoryProgress() {
    const result = this.storySystem.checkChapterUnlock();
    if (result.newCompletions.length > 0) {
      result.newCompletions.forEach(chapter => {
        this.showToast(`📖 章节完成：${chapter.title}！获得 ${chapter.reward.coins} 金币 + ${chapter.reward.stars} ⭐`, 'success');
      });
      document.getElementById('chapter-unlock').classList.remove('hidden');
    }
  }

  handleLose() {
    this.levelSystem.stopTimer();
    document.getElementById('result-title').textContent = '😢 关卡失败';
    document.getElementById('result-message').textContent = this.levelSystem.isTimeLimit ? '时间用完了，再试一次吧！' : '步数用完了，再试一次吧！';
    document.getElementById('reward-coins').textContent = '+0';
    document.getElementById('reward-stars').textContent = '+0';
    document.getElementById('modal-continue-btn').style.display = 'none';
    document.getElementById('chapter-unlock').classList.add('hidden');

    this.showModal('result-modal');
  }

  showModal(modalId) {
    document.getElementById(modalId).classList.add('show');
  }

  hideModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
  }

  showFriendsModal() {
    this.renderFriendsList();
    this.renderLeaderboard();
    this.renderCollabTasks();
    document.getElementById('friends-modal').classList.add('show');
  }

  renderFriendsList() {
    const container = document.getElementById('friends-list');
    container.innerHTML = '';

    this.socialSystem.getFriends().forEach(friend => {
      const canGift = this.socialSystem.canSendGift(friend.id);
      const friendEl = document.createElement('div');
      friendEl.className = 'friend-card';
      friendEl.innerHTML = `
        <div class="friend-info">
          <span class="friend-avatar">${friend.avatar}</span>
          <div class="friend-details">
            <div class="friend-name">${friend.name}</div>
            <div class="friend-status">
              <span class="${friend.online ? 'online-dot' : 'offline-dot'}"></span>
              ${friend.online ? '在线' : '离线'} · 关卡 ${friend.level} · 花园 ${friend.gardenLevel}
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn" data-action="visit" data-id="${friend.id}">参观</button>
          <button class="btn btn-secondary ${canGift ? '' : 'disabled'}" data-action="gift" data-id="${friend.id}" ${canGift ? '' : 'disabled'}>送礼物</button>
        </div>
      `;

      friendEl.querySelector('[data-action="visit"]').addEventListener('click', () => {
        this.visitFriend(friend.id);
      });

      friendEl.querySelector('[data-action="gift"]').addEventListener('click', (e) => {
        if (!e.target.disabled) {
          const result = this.socialSystem.sendGift(friend.id);
          this.showToast(result.message, result.success ? 'success' : 'error');
          this.renderFriendsList();
        }
      });

      container.appendChild(friendEl);
    });
  }

  renderLeaderboard() {
    const container = document.getElementById('friends-leaderboard');
    container.innerHTML = '';

    this.socialSystem.getLeaderboard().forEach(friend => {
      const rankClass = friend.rank === 1 ? 'gold' : friend.rank === 2 ? 'silver' : friend.rank === 3 ? 'bronze' : '';
      const friendEl = document.createElement('div');
      friendEl.className = 'leaderboard-item';
      friendEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="leaderboard-rank ${rankClass}">${friend.rank}</span>
          <span style="font-size: 1.5rem;">${friend.avatar}</span>
          <span>${friend.name}</span>
        </div>
        <div style="font-weight: bold; color: var(--primary-green-dark);">关卡 ${friend.level}</div>
      `;
      container.appendChild(friendEl);
    });
  }

  renderCollabTasks() {
    const container = document.getElementById('friends-collab');
    container.innerHTML = '';

    this.socialSystem.getCollaborativeTasks().forEach(task => {
      const progress = Math.min(100, Math.floor((task.progress / task.target) * 100));
      const taskEl = document.createElement('div');
      taskEl.className = `collab-card ${task.completed ? 'completed' : ''}`;
      taskEl.innerHTML = `
        <div class="event-title">${task.name}</div>
        <div class="event-description">${task.description}</div>
        <div class="event-reward">奖励: 💰${task.reward.coins} ⭐${task.reward.stars}</div>
        <div class="event-progress">
          <div class="event-progress-bar" style="width: ${progress}%"></div>
        </div>
        <div style="text-align: right; font-size: 0.8rem; color: var(--text-secondary);">${task.progress}/${task.target}</div>
      `;
      container.appendChild(taskEl);
    });
  }

  visitFriend(friendId) {
    const result = this.socialSystem.visitFriend(friendId);
    if (result.success) {
      this.hideModal('friends-modal');
      this.renderVisitGarden(result.friend);
    }
  }

  renderVisitGarden(friendData) {
    document.getElementById('visit-title').textContent = `🏡 ${friendData.name}的花园`;

    const container = document.getElementById('visit-garden');
    container.innerHTML = '';

    const grid = {};
    friendData.decorations.forEach(d => {
      grid[`${d.row},${d.col}`] = d.item;
    });

    for (let row = 0; row < friendData.gridSize; row++) {
      for (let col = 0; col < friendData.gridSize; col++) {
        const deco = grid[`${row},${col}`];
        const plotEl = document.createElement('div');
        plotEl.className = 'visit-plot';
        plotEl.textContent = deco?.emoji || '';
        container.appendChild(plotEl);
      }
    }

    document.getElementById('visit-modal').classList.add('show');
  }

  showEventsModal() {
    this.renderSeasonalEvents();
    this.renderDailyChallenges();
    this.renderLimitedTimeChallenges();
    this.renderCheckin();
    document.getElementById('events-modal').classList.add('show');
  }

  renderSeasonalEvents() {
    const container = document.getElementById('events-seasonal');
    container.innerHTML = '';

    const activeEvent = this.eventSystem.getCurrentActiveEvent();

    SEASONAL_EVENTS.forEach(event => {
      const isActive = activeEvent?.id === event.id;
      const eventEl = document.createElement('div');
      eventEl.className = `event-card ${isActive ? 'active' : ''}`;
      eventEl.innerHTML = `
        <div class="event-title">
          <span class="event-emoji">${event.emoji}</span>
          ${event.name}
          ${isActive ? '<span style="background: var(--secondary-gold); padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;">进行中</span>' : ''}
        </div>
        <div class="event-description">${event.description}</div>
        <div class="event-reward">奖励加成: ${Math.round((event.bonusMultiplier - 1) * 100)}%</div>
      `;
      container.appendChild(eventEl);
    });
  }

  renderDailyChallenges() {
    const container = document.getElementById('events-daily');
    container.innerHTML = '';

    const challenges = this.eventSystem.getTodayChallenges();
    challenges.forEach(challenge => {
      const challengeEl = document.createElement('div');
      challengeEl.className = `challenge-card ${challenge.completed ? 'completed' : ''}`;
      challengeEl.innerHTML = `
        <div class="event-title">${challenge.name}</div>
        <div class="event-description">${challenge.description}</div>
        <div class="event-reward">奖励: 💰${challenge.reward.coins} ⭐${challenge.reward.stars}</div>
        ${challenge.completed ? '<div style="color: var(--primary-green); font-weight: bold;">✓ 已完成</div>' : ''}
      `;
      container.appendChild(challengeEl);
    });
  }

  renderLimitedTimeChallenges() {
    const container = document.getElementById('events-limited');
    container.innerHTML = '';

    const challenges = this.eventSystem.getLimitedTimeChallenges();
    challenges.forEach(challenge => {
      const challengeEl = document.createElement('div');
      challengeEl.className = 'challenge-card';
      challengeEl.innerHTML = `
        <div class="event-title">${challenge.name}</div>
        <div class="event-description">${challenge.description}</div>
        <div class="event-reward">奖励: 💰${challenge.reward.coins} ⭐${challenge.reward.stars}</div>
        <div style="font-size: 0.8rem; color: var(--warning);">⏱ ${challenge.timeLimit}</div>
      `;
      container.appendChild(challengeEl);
    });
  }

  renderCheckin() {
    const container = document.getElementById('events-checkin');
    container.innerHTML = '';

    const canClaim = this.eventSystem.canClaimDailyReward();
    const state = this.store.getState();
    const lastDay = state.lastDailyRewardDay || 0;

    const checkinGrid = document.createElement('div');
    checkinGrid.className = 'checkin-grid';

    const rewards = [100, 150, 200, 250, 300, 400, 500];
    for (let i = 1; i <= 7; i++) {
      const isChecked = i <= lastDay;
      const isToday = canClaim && i === lastDay + 1;
      const dayEl = document.createElement('div');
      dayEl.className = `checkin-day ${isChecked ? 'checked' : ''} ${isToday ? 'today' : ''}`;
      dayEl.innerHTML = `
        <div class="checkin-day-num">第${i}天</div>
        <div class="checkin-reward">💰${rewards[i - 1]}</div>
      `;
      checkinGrid.appendChild(dayEl);
    }

    container.appendChild(checkinGrid);

    if (canClaim) {
      const claimBtn = document.createElement('button');
      claimBtn.className = 'btn';
      claimBtn.textContent = '🎁 领取今日奖励';
      claimBtn.addEventListener('click', () => {
        const result = this.eventSystem.claimDailyReward();
        this.showToast(result.message, result.success ? 'success' : 'error');
        this.renderCheckin();
        this.updateResourcesDisplay();
      });
      container.appendChild(claimBtn);
    }
  }

  showStoryModal() {
    const container = document.getElementById('story-content');
    container.innerHTML = '';

    STORY_CHAPTERS.forEach(chapter => {
      const isUnlocked = this.storySystem.isChapterUnlocked(chapter.id);
      const isCompleted = this.storySystem.isChapterCompleted(chapter.id);
      const progress = this.storySystem.getChapterProgress(chapter.id);

      const chapterEl = document.createElement('div');
      chapterEl.className = `story-chapter ${isUnlocked ? 'unlocked' : ''} ${isCompleted ? 'completed' : ''} ${!isUnlocked ? 'locked' : ''}`;

      if (!isUnlocked) {
        chapterEl.innerHTML = `
          <div class="story-chapter-title">
            <span class="locked-icon">🔒</span>
            ${chapter.title}
          </div>
          <div class="story-chapter-desc">需要完成更多关卡和装饰来解锁</div>
        `;
      } else {
        const storyText = this.storySystem.getChapterStory(chapter.id);
        chapterEl.innerHTML = `
          <div class="story-chapter-title">
            ${isCompleted ? '✅' : '📖'}
            ${chapter.title}
          </div>
          <div class="story-chapter-desc">${storyText}</div>
          <div class="story-chapter-progress">
            关卡进度: ${progress.levelsCompleted}/${progress.levelsRequired}
            装饰进度: ${progress.decorationsPlaced}/${progress.decorationsRequired}
            ${isCompleted ? ' · ✅ 已完成' : ''}
          </div>
          ${isCompleted ? `<div class="event-reward">奖励已领取: 💰${chapter.reward.coins} ⭐${chapter.reward.stars}</div>` : ''}
        `;
      }

      container.appendChild(chapterEl);
    });

    document.getElementById('story-modal').classList.add('show');
  }

  renderGarden() {
    const gridEl = document.getElementById('garden-grid');
    gridEl.innerHTML = '';

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const decoration = this.gardenSystem.getPlacedDecoration(row, col);
        const plotEl = document.createElement('div');
        plotEl.className = `garden-plot ${decoration ? '' : 'empty'}`;
        plotEl.dataset.row = row;
        plotEl.dataset.col = col;

        if (decoration) {
          plotEl.textContent = decoration.emoji;
          plotEl.title = decoration.name;
        }

        plotEl.addEventListener('click', () => this.handlePlotClick(row, col));
        gridEl.appendChild(plotEl);
      }
    }

    document.getElementById('decoration-count').textContent = this.gardenSystem.getDecorationCount();
  }

  handlePlotClick(row, col) {
    const selectedDeco = this.gardenSystem.getSelectedDecoration();

    if (selectedDeco) {
      this.gardenSystem.placeDecoration(row, col);
      this.gardenSystem.clearSelection();
      this.renderGarden();
      this.renderInventory();
      this.showToast('装饰放置成功！', 'success');
    } else {
      const existing = this.gardenSystem.getPlacedDecoration(row, col);
      if (existing) {
        this.gardenSystem.removeDecoration(row, col);
        this.renderGarden();
        this.renderInventory();
        this.showToast('装饰已移除', 'success');
      }
    }
  }

  renderInventory() {
    const container = document.getElementById('inventory-container');
    const ownedItems = this.shopSystem.getOwnedItems();

    if (ownedItems.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary);">暂无物品，去商店购买吧！</p>';
      return;
    }

    container.innerHTML = '';
    const selectedDeco = this.gardenSystem.getSelectedDecoration();

    ownedItems.forEach(item => {
      const available = this.gardenSystem.getAvailableQuantity(item.id);
      const itemEl = document.createElement('div');
      itemEl.className = `inventory-item ${selectedDeco === item.id ? 'selected' : ''} ${available <= 0 ? 'cant-afford' : ''}`;
      itemEl.innerHTML = `
        <span class="inventory-emoji">${item.emoji}</span>
        <span>${item.name}</span>
        <span style="font-size: 0.8rem; color: var(--text-secondary);">x${available}</span>
      `;

      itemEl.addEventListener('click', () => {
        if (available <= 0) {
          this.showToast('该装饰已全部放置，可在商店再次购买', 'error');
          return;
        }
        if (selectedDeco === item.id) {
          this.gardenSystem.clearSelection();
        } else {
          this.gardenSystem.selectDecoration(item.id);
        }
        this.renderInventory();
        this.renderGarden();
      });

      container.appendChild(itemEl);
    });
  }

  renderShop() {
    const container = document.getElementById('shop-container');
    container.innerHTML = '';

    this.shopSystem.getItems().slice(0, 8).forEach(item => {
      const canAfford = this.shopSystem.canAfford(item);

      const itemEl = document.createElement('div');
      itemEl.className = `shop-item ${!canAfford ? 'cant-afford' : ''}`;

      itemEl.innerHTML = `
        <div class="shop-emoji">${item.emoji}</div>
        <div class="shop-name">${item.name}</div>
        <div class="shop-price">
          ${item.price.coins > 0 ? `<span class="price-item">💰 ${item.price.coins}</span>` : ''}
          ${item.price.stars > 0 ? `<span class="price-item">⭐ ${item.price.stars}</span>` : ''}
        </div>
      `;

      itemEl.title = item.description;
      itemEl.addEventListener('click', () => this.handlePurchase(item.id));

      container.appendChild(itemEl);
    });
  }

  renderShopPage() {
    this.renderShopDecorations();
    this.renderShopItems();
    this.renderShopBuffs();
  }

  renderShopDecorations() {
    const container = document.getElementById('shop-decorations-container');
    container.innerHTML = '';

    let items = this.shopSystem.getItems();
    if (this.currentShopCategory !== 'all') {
      items = items.filter(item => item.category === this.currentShopCategory);
    }

    items.forEach(item => {
      const ownedQty = this.shopSystem.getQuantity(item.id);
      const canAfford = this.shopSystem.canAfford(item);

      const itemEl = document.createElement('div');
      itemEl.className = `shop-item ${!canAfford ? 'cant-afford' : ''}`;

      itemEl.innerHTML = `
        <div class="shop-emoji">${item.emoji}</div>
        <div class="shop-name">${item.name}</div>
        <div class="shop-price">
          ${item.price.coins > 0 ? `<span class="price-item">💰 ${item.price.coins}</span>` : ''}
          ${item.price.stars > 0 ? `<span class="price-item">⭐ ${item.price.stars}</span>` : ''}
        </div>
        ${ownedQty > 0 ? `<span class="owned-badge">已拥有 x${ownedQty}</span>` : ''}
      `;

      itemEl.title = item.description;
      itemEl.addEventListener('click', () => this.handlePurchase(item.id));

      container.appendChild(itemEl);
    });
  }

  renderShopItems() {
    const container = document.getElementById('shop-items-container');
    container.innerHTML = '';

    SPECIAL_ITEMS.forEach(item => {
      const ownedQty = this.itemSystem.getQuantity(item.id);
      const state = this.store.getState();
      const canAfford = state.coins >= item.price.coins && state.stars >= item.price.stars;

      const itemEl = document.createElement('div');
      itemEl.className = `shop-item ${!canAfford ? 'cant-afford' : ''}`;

      itemEl.innerHTML = `
        <div class="shop-emoji">${item.emoji}</div>
        <div class="shop-name">${item.name}</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px;">${item.description}</div>
        <div class="shop-price">
          ${item.price.coins > 0 ? `<span class="price-item">💰 ${item.price.coins}</span>` : ''}
          ${item.price.stars > 0 ? `<span class="price-item">⭐ ${item.price.stars}</span>` : ''}
        </div>
        ${ownedQty > 0 ? `<span class="owned-badge">拥有 x${ownedQty}</span>` : ''}
      `;

      itemEl.addEventListener('click', () => {
        const result = this.itemSystem.purchaseItem(item.id);
        this.showToast(result.message, result.success ? 'success' : 'error');
        if (result.success) {
          this.renderShopItems();
          this.renderItems();
        }
      });

      container.appendChild(itemEl);
    });
  }

  renderShopBuffs() {
    const container = document.getElementById('shop-buffs-container');
    container.innerHTML = '';

    START_BUFFS.forEach(buff => {
      const state = this.store.getState();
      const canAfford = state.coins >= buff.price.coins;

      const buffEl = document.createElement('div');
      buffEl.className = `shop-item ${!canAfford ? 'cant-afford' : ''}`;

      buffEl.innerHTML = `
        <div class="shop-emoji">${buff.emoji}</div>
        <div class="shop-name">${buff.name}</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 8px;">${buff.description}</div>
        <div class="shop-price">
          <span class="price-item">💰 ${buff.price.coins}</span>
        </div>
        <div style="font-size: 0.75rem; color: var(--warning); margin-top: 8px;">仅在开局前选择使用</div>
      `;

      container.appendChild(buffEl);
    });
  }

  handlePurchase(itemId) {
    const result = this.shopSystem.purchase(itemId);
    this.showToast(result.message, result.success ? 'success' : 'error');

    if (result.success) {
      this.renderShop();
      this.renderInventory();
      this.renderShopDecorations();
    }
  }

  renderLevelsPage() {
    const container = document.getElementById('levels-container');
    container.innerHTML = '';

    const state = this.store.getState();
    const levelsCompleted = state.levelsCompleted || 0;

    LEVELS.forEach(level => {
      const isCompleted = level.id <= levelsCompleted;
      const isCurrent = level.id === levelsCompleted + 1;
      const isLocked = level.id > levelsCompleted + 1;

      const levelEl = document.createElement('div');
      levelEl.className = `level-card ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}`;

      const goalTypeName = GOAL_TYPE_NAMES[level.goalType] || '收集方块';

      levelEl.innerHTML = `
        <div class="level-number">${level.id}</div>
        <div class="level-name">${level.name}</div>
        <div class="level-type">${goalTypeName}</div>
        <div class="level-stars">
          ${isCompleted ? '⭐'.repeat(Math.min(level.reward.stars, 3)) : isLocked ? '🔒' : '🎯'}
        </div>
      `;

      if (!isLocked) {
        levelEl.addEventListener('click', () => {
          this.switchTab('game');
          this.startLevel(level.id, [], true);
        });
      }

      container.appendChild(levelEl);
    });
  }

  updateEventBanner() {
    const banner = document.getElementById('event-banner');
    const event = this.eventSystem.getCurrentActiveEvent();

    if (event) {
      banner.classList.remove('hidden');
      document.getElementById('event-emoji').textContent = event.emoji;
      document.getElementById('event-name').textContent = event.name;
      banner.querySelector('.event-bonus').textContent = `奖励 +${Math.round((event.bonusMultiplier - 1) * 100)}%`;
    } else {
      banner.classList.add('hidden');
    }
  }

  showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new GardenMatch3Game();
});
