class SocialSystem {
  constructor(store) {
    this.store = store;
    this.friends = MOCK_FRIENDS;
    this.visitedFriend = null;
  }

  getFriends() {
    return this.friends;
  }

  getOnlineFriends() {
    return this.friends.filter(f => f.online);
  }

  getFriendById(id) {
    return this.friends.find(f => f.id === id);
  }

  visitFriend(friendId) {
    const friend = this.getFriendById(friendId);
    if (!friend) return { success: false, message: '好友不存在' };

    this.visitedFriend = friend;
    return {
      success: true,
      message: `正在参观${friend.name}的花园`,
      friend: this.generateFriendGarden(friend)
    };
  }

  generateFriendGarden(friend) {
    const decorations = [];
    const gridSize = 5;
    const placedCount = Math.min(friend.gardenLevel, gridSize * gridSize);

    const availableItems = [...EXTENDED_SHOP_ITEMS];
    for (let i = 0; i < placedCount; i++) {
      const item = availableItems[Math.floor(Math.random() * availableItems.length)];
      decorations.push({
        row: Math.floor(i / gridSize),
        col: i % gridSize,
        item: item
      });
    }

    return {
      name: friend.name,
      level: friend.level,
      gardenLevel: friend.gardenLevel,
      decorations: decorations,
      gridSize: gridSize
    };
  }

  leaveFriendGarden() {
    this.visitedFriend = null;
  }

  getVisitedFriend() {
    return this.visitedFriend;
  }

  sendGift(friendId, giftType = 'energy') {
    const friend = this.getFriendById(friendId);
    if (!friend) return { success: false, message: '好友不存在' };

    const state = this.store.getState();
    const giftsSent = state.giftsSent || {};
    const today = new Date().toDateString();

    if (giftsSent[friendId] === today) {
      return { success: false, message: '今天已经赠送过了' };
    }

    giftsSent[friendId] = today;

    const giftRewards = {
      energy: { coins: 50, stars: 0 },
      heart: { coins: 30, stars: 1 },
      flower: { coins: 40, stars: 0 }
    };

    const reward = giftRewards[giftType] || giftRewards.energy;

    this.store.setState({
      giftsSent: giftsSent,
      coins: state.coins + reward.coins,
      stars: state.stars + reward.stars
    });

    return {
      success: true,
      message: `成功赠送${giftType === 'energy' ? '体力' : giftType === 'heart' ? '爱心' : '鲜花'}给${friend.name}！获得${reward.coins}金币`,
      reward: reward
    };
  }

  getGiftsSentToday() {
    const state = this.store.getState();
    const giftsSent = state.giftsSent || {};
    const today = new Date().toDateString();

    return Object.entries(giftsSent)
      .filter(([_, date]) => date === today)
      .map(([id]) => parseInt(id));
  }

  canSendGift(friendId) {
    return !this.getGiftsSentToday().includes(friendId);
  }

  getLeaderboard() {
    return [...this.friends]
      .sort((a, b) => b.level - a.level)
      .map((f, index) => ({ ...f, rank: index + 1 }));
  }

  getCollaborativeTasks() {
    return [
      {
        id: 'collab_1',
        name: '花园建设者',
        description: '和好友一起完成5个关卡',
        target: 5,
        progress: 0,
        reward: { coins: 500, stars: 5 },
        completed: false
      },
      {
        id: 'collab_2',
        name: '装饰大师',
        description: '在花园中放置50个装饰',
        target: 50,
        progress: this.countDecorations(),
        reward: { coins: 800, stars: 8 },
        completed: this.countDecorations() >= 50
      }
    ];
  }

  countDecorations() {
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
}
