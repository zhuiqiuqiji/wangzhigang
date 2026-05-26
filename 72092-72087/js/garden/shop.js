class ShopSystem {
  constructor(store) {
    this.store = store;
  }

  getItems() {
    return SHOP_ITEMS;
  }

  getItemById(id) {
    return SHOP_ITEMS.find(item => item.id === id);
  }

  canAfford(item) {
    const state = this.store.getState();
    return state.coins >= item.price.coins && state.stars >= item.price.stars;
  }

  getQuantity(itemId) {
    const state = this.store.getState();
    return state.garden.decorations[itemId] || 0;
  }

  isOwned(itemId) {
    return this.getQuantity(itemId) > 0;
  }

  purchase(itemId) {
    const item = this.getItemById(itemId);
    if (!item) return { success: false, message: '物品不存在' };
    if (!this.canAfford(item)) return { success: false, message: '资源不足' };

    const state = this.store.getState();
    const currentQty = state.garden.decorations[itemId] || 0;
    
    this.store.setState({
      coins: state.coins - item.price.coins,
      stars: state.stars - item.price.stars,
      garden: {
        ...state.garden,
        decorations: {
          ...state.garden.decorations,
          [itemId]: currentQty + 1
        }
      }
    });

    return { success: true, message: '购买成功！' };
  }

  getOwnedItems() {
    const state = this.store.getState();
    const items = [];
    Object.entries(state.garden.decorations).forEach(([id, qty]) => {
      if (qty > 0) {
        const item = this.getItemById(id);
        if (item) {
          items.push({ ...item, quantity: qty });
        }
      }
    });
    return items;
  }

  getAffordableItems() {
    return SHOP_ITEMS.filter(item => this.canAfford(item));
  }
}
