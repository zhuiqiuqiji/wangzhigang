const CommunityStorage = {
    PUZZLES_KEY: 'crossword_community_puzzles',
    LEADERBOARD_KEY: 'crossword_leaderboard',
    DAILY_KEY: 'crossword_daily_records',
    CUSTOM_PUZZLES_KEY: 'crossword_custom_puzzles',

    getCommunityPuzzles() {
        const data = localStorage.getItem(this.PUZZLES_KEY);
        return data ? JSON.parse(data) : this.getSamplePuzzles();
    },

    saveCommunityPuzzle(puzzle) {
        const puzzles = this.getCommunityPuzzles();
        const newPuzzle = {
            ...puzzle,
            id: Date.now(),
            author: puzzle.author || '匿名用户',
            ratings: [],
            rating: 0,
            plays: 0,
            createdAt: new Date().toISOString()
        };
        puzzles.unshift(newPuzzle);
        localStorage.setItem(this.PUZZLES_KEY, JSON.stringify(puzzles));
        return newPuzzle;
    },

    ratePuzzle(puzzleId, rating) {
        const puzzles = this.getCommunityPuzzles();
        const puzzle = puzzles.find(p => p.id === puzzleId);
        if (puzzle) {
            puzzle.ratings.push(rating);
            puzzle.rating = puzzle.ratings.reduce((a, b) => a + b, 0) / puzzle.ratings.length;
            localStorage.setItem(this.PUZZLES_KEY, JSON.stringify(puzzles));
        }
        return puzzle;
    },

    incrementPlays(puzzleId) {
        const puzzles = this.getCommunityPuzzles();
        const puzzle = puzzles.find(p => p.id === puzzleId);
        if (puzzle) {
            puzzle.plays = (puzzle.plays || 0) + 1;
            localStorage.setItem(this.PUZZLES_KEY, JSON.stringify(puzzles));
        }
    },

    getLeaderboard() {
        const data = localStorage.getItem(this.LEADERBOARD_KEY);
        return data ? JSON.parse(data) : [];
    },

    addToLeaderboard(name, time, puzzleId, difficulty = 'normal') {
        const leaderboard = this.getLeaderboard();
        const entry = {
            name,
            time,
            puzzleId,
            difficulty,
            date: new Date().toISOString()
        };
        leaderboard.push(entry);
        leaderboard.sort((a, b) => a.time - b.time);
        const top100 = leaderboard.slice(0, 100);
        localStorage.setItem(this.LEADERBOARD_KEY, JSON.stringify(top100));
        return top100.findIndex(e => e === entry) + 1;
    },

    getDailyRecords() {
        const data = localStorage.getItem(this.DAILY_KEY);
        return data ? JSON.parse(data) : {};
    },

    saveDailyRecord(time, name) {
        const records = this.getDailyRecords();
        const today = new Date().toISOString().split('T')[0];
        if (!records[today]) {
            records[today] = [];
        }
        records[today].push({ name, time, date: new Date().toISOString() });
        records[today].sort((a, b) => a.time - b.time);
        localStorage.setItem(this.DAILY_KEY, JSON.stringify(records));
        return records[today].findIndex(r => r.time === time && r.name === name) + 1;
    },

    hasCompletedDaily() {
        const records = this.getDailyRecords();
        const today = new Date().toISOString().split('T')[0];
        return records[today] && records[today].length > 0;
    },

    getCustomPuzzles() {
        const data = localStorage.getItem(this.CUSTOM_PUZZLES_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveCustomPuzzle(puzzle) {
        const puzzles = this.getCustomPuzzles();
        const newPuzzle = {
            ...puzzle,
            id: Date.now(),
            createdAt: new Date().toISOString()
        };
        puzzles.unshift(newPuzzle);
        localStorage.setItem(this.CUSTOM_PUZZLES_KEY, JSON.stringify(puzzles));
        return newPuzzle;
    },

    deleteCustomPuzzle(puzzleId) {
        const puzzles = this.getCustomPuzzles();
        const filtered = puzzles.filter(p => p.id !== puzzleId);
        localStorage.setItem(this.CUSTOM_PUZZLES_KEY, JSON.stringify(filtered));
    },

    getSamplePuzzles() {
        return [
            {
                id: 1,
                name: '编程入门',
                author: '系统',
                description: '适合编程初学者的谜题',
                difficulty: 'easy',
                gridSize: 10,
                words: [
                    { word: 'CODE', clue: '程序员写的东西', direction: 'across', row: 1, col: 1, number: 1 },
                    { word: 'BUG', clue: '程序中的错误', direction: 'down', row: 1, col: 3, number: 2 },
                    { word: 'LOOP', clue: '重复执行的代码', direction: 'across', row: 3, col: 2, number: 3 },
                    { word: 'DATA', clue: '信息的载体', direction: 'down', row: 3, col: 4, number: 4 }
                ],
                ratings: [5, 4, 5, 4],
                rating: 4.5,
                plays: 128,
                createdAt: '2026-01-01T00:00:00.000Z'
            },
            {
                id: 2,
                name: '动物世界',
                author: '动物爱好者',
                description: '关于各种动物的谜题',
                difficulty: 'medium',
                gridSize: 11,
                words: [
                    { word: 'PANDA', clue: '中国国宝', direction: 'across', row: 2, col: 1, number: 1 },
                    { word: 'TIGER', clue: '森林之王', direction: 'down', row: 2, col: 3, number: 2 },
                    { word: 'EAGLE', clue: '天空之王', direction: 'across', row: 4, col: 2, number: 3 },
                    { word: 'DOLPHIN', clue: '聪明的海洋动物', direction: 'down', row: 1, col: 5, number: 4 }
                ],
                ratings: [5, 5, 4],
                rating: 4.7,
                plays: 256,
                createdAt: '2026-01-15T00:00:00.000Z'
            }
        ];
    }
};

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function renderCommunityPuzzles(container, onSelect) {
    const puzzles = CommunityStorage.getCommunityPuzzles();
    
    container.innerHTML = `
        <div class="community-header">
            <h3>🏆 谜题社区</h3>
            <button class="btn btn-small" id="uploadPuzzleBtn">上传谜题</button>
        </div>
        <div class="puzzle-list">
            ${puzzles.map(puzzle => `
                <div class="puzzle-card" data-id="${puzzle.id}">
                    <div class="puzzle-card-header">
                        <h4>${puzzle.name}</h4>
                        <span class="difficulty-badge ${puzzle.difficulty}">${getDifficultyText(puzzle.difficulty)}</span>
                    </div>
                    <p class="puzzle-desc">${puzzle.description}</p>
                    <div class="puzzle-meta">
                        <span>👤 ${puzzle.author}</span>
                        <span>⭐ ${puzzle.rating.toFixed(1)}</span>
                        <span>🎮 ${puzzle.plays} 次游玩</span>
                    </div>
                    <button class="btn btn-play" data-id="${puzzle.id}">开始游戏</button>
                </div>
            `).join('')}
        </div>
    `;

    container.querySelectorAll('.btn-play').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const puzzleId = parseInt(e.target.dataset.id);
            const puzzle = puzzles.find(p => p.id === puzzleId);
            if (puzzle) {
                CommunityStorage.incrementPlays(puzzleId);
                onSelect(puzzle);
            }
        });
    });

    const uploadBtn = document.getElementById('uploadPuzzleBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => showUploadModal(onSelect));
    }
}

function renderLeaderboard(container, dailyOnly = false) {
    let records;
    if (dailyOnly) {
        const dailyRecords = CommunityStorage.getDailyRecords();
        const today = new Date().toISOString().split('T')[0];
        records = (dailyRecords[today] || []).slice(0, 10);
    } else {
        records = CommunityStorage.getLeaderboard().slice(0, 10);
    }

    container.innerHTML = `
        <h3>🏆 ${dailyOnly ? '今日排行' : '总排行榜'}</h3>
        <div class="leaderboard-list">
            ${records.length === 0 ? 
                '<p class="empty-state">暂无记录，成为第一个上榜的人吧！</p>' :
                records.map((record, index) => `
                    <div class="leaderboard-item ${index < 3 ? 'top' : ''}">
                        <span class="rank">${index + 1}</span>
                        <span class="name">${record.name}</span>
                        <span class="time">${formatTime(record.time)}</span>
                    </div>
                `).join('')
            }
        </div>
    `;
}

function getDifficultyText(difficulty) {
    const map = {
        easy: '简单',
        medium: '中等',
        hard: '困难'
    };
    return map[difficulty] || difficulty;
}

function showUploadModal(onSelect) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>上传自定义谜题</h2>
            <form id="uploadForm">
                <div class="form-group">
                    <label>谜题名称</label>
                    <input type="text" id="puzzleName" required>
                </div>
                <div class="form-group">
                    <label>作者名称</label>
                    <input type="text" id="puzzleAuthor" placeholder="匿名用户">
                </div>
                <div class="form-group">
                    <label>描述</label>
                    <textarea id="puzzleDesc" rows="2"></textarea>
                </div>
                <div class="form-group">
                    <label>难度</label>
                    <select id="puzzleDifficulty">
                        <option value="easy">简单</option>
                        <option value="medium" selected>中等</option>
                        <option value="hard">困难</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>词库 (每行: 单词,提示)</label>
                    <textarea id="puzzleWords" rows="6" placeholder="HELLO,问候语&#10;WORLD,世界&#10;..." required></textarea>
                </div>
                <div class="form-buttons">
                    <button type="button" class="btn btn-cancel" id="cancelUpload">取消</button>
                    <button type="submit" class="btn">生成并上传</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('cancelUpload').addEventListener('click', () => {
        modal.remove();
    });

    document.getElementById('uploadForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('puzzleName').value;
        const author = document.getElementById('puzzleAuthor').value || '匿名用户';
        const description = document.getElementById('puzzleDesc').value;
        const difficulty = document.getElementById('puzzleDifficulty').value;
        const wordsText = document.getElementById('puzzleWords').value;
        
        const words = wordsText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                const [word, ...clueParts] = line.split(',');
                return {
                    word: word.toUpperCase().trim(),
                    clue: clueParts.join(',').trim()
                };
            })
            .filter(w => w.word.length >= 2 && w.clue.length > 0);

        if (words.length < 3) {
            alert('请至少输入3个有效单词');
            return;
        }

        const puzzle = generateCrossword(words);
        puzzle.name = name;
        puzzle.author = author;
        puzzle.description = description;
        puzzle.difficulty = difficulty;

        const saved = CommunityStorage.saveCommunityPuzzle(puzzle);
        CommunityStorage.saveCustomPuzzle(puzzle);
        
        modal.remove();
        alert(`谜题"${name}"上传成功！`);
        
        if (onSelect) {
            onSelect(saved);
        }
    });
}

function showRatingModal(puzzleId, onRated) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>为这个谜题评分</h2>
            <div class="rating-stars">
                ${[1, 2, 3, 4, 5].map(star => `
                    <span class="star" data-rating="${star}">☆</span>
                `).join('')}
            </div>
            <div class="form-buttons">
                <button class="btn btn-cancel" id="cancelRating">跳过</button>
                <button class="btn" id="submitRating" disabled>提交评分</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    let selectedRating = 0;
    const stars = modal.querySelectorAll('.star');
    
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.rating);
            stars.forEach((s, i) => {
                s.textContent = i < selectedRating ? '★' : '☆';
                s.classList.toggle('active', i < selectedRating);
            });
            document.getElementById('submitRating').disabled = false;
        });

        star.addEventListener('mouseover', () => {
            const rating = parseInt(star.dataset.rating);
            stars.forEach((s, i) => {
                s.textContent = i < rating ? '★' : '☆';
            });
        });

        star.addEventListener('mouseout', () => {
            stars.forEach((s, i) => {
                s.textContent = i < selectedRating ? '★' : '☆';
            });
        });
    });

    document.getElementById('cancelRating').addEventListener('click', () => {
        modal.remove();
        if (onRated) onRated(null);
    });

    document.getElementById('submitRating').addEventListener('click', () => {
        if (selectedRating > 0) {
            CommunityStorage.ratePuzzle(puzzleId, selectedRating);
            modal.remove();
            if (onRated) onRated(selectedRating);
        }
    });
}
