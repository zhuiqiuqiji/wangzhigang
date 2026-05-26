class StorySystem {
  constructor(store) {
    this.store = store;
  }

  getChapters() {
    return STORY_CHAPTERS;
  }

  getUnlockedChapters() {
    const state = this.store.getState();
    return state.unlockedChapters || [1];
  }

  getCompletedChapters() {
    const state = this.store.getState();
    return state.completedChapters || [];
  }

  isChapterUnlocked(chapterId) {
    return this.getUnlockedChapters().includes(chapterId);
  }

  isChapterCompleted(chapterId) {
    return this.getCompletedChapters().includes(chapterId);
  }

  checkChapterUnlock() {
    const state = this.store.getState();
    const unlocked = [...this.getUnlockedChapters()];
    const completed = [...this.getCompletedChapters()];

    const newUnlocks = [];
    const newCompletions = [];

    STORY_CHAPTERS.forEach(chapter => {
      if (!unlocked.includes(chapter.id)) {
        const condition = chapter.unlockCondition;
        let canUnlock = true;

        if (condition.levelsCompleted && state.levelsCompleted < condition.levelsCompleted) {
          canUnlock = false;
        }
        if (condition.decorationsPlaced) {
          const decCount = this.countDecorationsPlaced();
          if (decCount < condition.decorationsPlaced) {
            canUnlock = false;
          }
        }

        if (canUnlock) {
          unlocked.push(chapter.id);
          newUnlocks.push(chapter);
        }
      }

      if (!completed.includes(chapter.id) && unlocked.includes(chapter.id)) {
        const condition = chapter.unlockCondition;
        let isComplete = true;

        if (condition.levelsCompleted && state.levelsCompleted < condition.levelsCompleted) {
          isComplete = false;
        }
        if (condition.decorationsPlaced) {
          const decCount = this.countDecorationsPlaced();
          if (decCount < condition.decorationsPlaced) {
            isComplete = false;
          }
        }

        if (isComplete && !completed.includes(chapter.id)) {
          completed.push(chapter.id);
          newCompletions.push(chapter);
        }
      }
    });

    if (newUnlocks.length > 0 || newCompletions.length > 0) {
      let rewardCoins = 0;
      let rewardStars = 0;

      newCompletions.forEach(chapter => {
        rewardCoins += chapter.reward.coins;
        rewardStars += chapter.reward.stars;
      });

      const currentState = this.store.getState();
      this.store.setState({
        unlockedChapters: unlocked,
        completedChapters: completed,
        coins: currentState.coins + rewardCoins,
        stars: currentState.stars + rewardStars
      });
    }

    return { newUnlocks, newCompletions };
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

  getChapterProgress(chapterId) {
    const chapter = STORY_CHAPTERS.find(c => c.id === chapterId);
    if (!chapter) return null;

    const state = this.store.getState();
    const condition = chapter.unlockCondition;

    return {
      levelsCompleted: state.levelsCompleted || 0,
      levelsRequired: condition.levelsCompleted || 0,
      decorationsPlaced: this.countDecorationsPlaced(),
      decorationsRequired: condition.decorationsPlaced || 0
    };
  }

  getCurrentChapter() {
    const unlocked = this.getUnlockedChapters();
    const maxUnlocked = Math.max(...unlocked);
    return STORY_CHAPTERS.find(c => c.id === maxUnlocked);
  }

  getChapterStory(chapterId) {
    const chapters = {
      1: '你继承了一片荒废的土地，这里曾经是一座美丽的花园。虽然现在杂草丛生，但你看到了它的潜力。你决定从最基础的事情开始——清除杂草，翻整土地。',
      2: '春天如约而至！你的花园里开始冒出嫩绿的新芽。各种鲜花竞相开放，蝴蝶和蜜蜂被吸引而来。花园的生机正在苏醒。',
      3: '夏日的阳光洒满花园，温度渐高。你需要更多的装饰物来打造一个舒适的夏日天堂。池塘、喷泉和凉亭都是不错的选择！',
      4: '秋天是收获的季节。你的花园已经硕果累累，各种秋季装饰让花园更加温馨。是时候展示你的园艺成果了！',
      5: '恭喜你！经过不懈的努力，你的花园已经从一片荒地变成了远近闻名的梦幻花园。邻居们都来参观，朋友们赞不绝口。你是真正的花园大师！'
    };
    return chapters[chapterId] || '';
  }
}
