const songs = [
    {
        id: 1,
        name: '小星星',
        difficulty: '⭐ 入门',
        notes: [
            { note: 'C4', duration: 500 },
            { note: 'C4', duration: 500 },
            { note: 'G4', duration: 500 },
            { note: 'G4', duration: 500 },
            { note: 'A4', duration: 500 },
            { note: 'A4', duration: 500 },
            { note: 'G4', duration: 1000 },
            { note: 'F4', duration: 500 },
            { note: 'F4', duration: 500 },
            { note: 'E4', duration: 500 },
            { note: 'E4', duration: 500 },
            { note: 'D4', duration: 500 },
            { note: 'D4', duration: 500 },
            { note: 'C4', duration: 1000 }
        ]
    },
    {
        id: 2,
        name: '欢乐颂',
        difficulty: '⭐ 简单',
        notes: [
            { note: 'E4', duration: 500 },
            { note: 'E4', duration: 500 },
            { note: 'F4', duration: 500 },
            { note: 'G4', duration: 500 },
            { note: 'G4', duration: 500 },
            { note: 'F4', duration: 500 },
            { note: 'E4', duration: 500 },
            { note: 'D4', duration: 500 },
            { note: 'C4', duration: 500 },
            { note: 'C4', duration: 500 },
            { note: 'D4', duration: 500 },
            { note: 'E4', duration: 500 },
            { note: 'E4', duration: 750 },
            { note: 'D4', duration: 250 },
            { note: 'D4', duration: 1000 }
        ]
    },
    {
        id: 3,
        name: '两只老虎',
        difficulty: '⭐ 入门',
        notes: [
            { note: 'C4', duration: 400 },
            { note: 'D4', duration: 400 },
            { note: 'E4', duration: 400 },
            { note: 'C4', duration: 400 },
            { note: 'C4', duration: 400 },
            { note: 'D4', duration: 400 },
            { note: 'E4', duration: 400 },
            { note: 'C4', duration: 400 },
            { note: 'E4', duration: 400 },
            { note: 'F4', duration: 400 },
            { note: 'G4', duration: 800 },
            { note: 'E4', duration: 400 },
            { note: 'F4', duration: 400 },
            { note: 'G4', duration: 800 }
        ]
    },
    {
        id: 4,
        name: '生日快乐',
        difficulty: '⭐⭐ 中等',
        notes: [
            { note: 'C4', duration: 300 },
            { note: 'C4', duration: 300 },
            { note: 'D4', duration: 600 },
            { note: 'C4', duration: 600 },
            { note: 'F4', duration: 600 },
            { note: 'E4', duration: 1200 },
            { note: 'C4', duration: 300 },
            { note: 'C4', duration: 300 },
            { note: 'D4', duration: 600 },
            { note: 'C4', duration: 600 },
            { note: 'G4', duration: 600 },
            { note: 'F4', duration: 1200 }
        ]
    },
    {
        id: 5,
        name: '铃儿响叮当',
        difficulty: '⭐⭐ 中等',
        notes: [
            { note: 'E4', duration: 400 },
            { note: 'E4', duration: 400 },
            { note: 'E4', duration: 800 },
            { note: 'E4', duration: 400 },
            { note: 'E4', duration: 400 },
            { note: 'E4', duration: 800 },
            { note: 'E4', duration: 400 },
            { note: 'G4', duration: 400 },
            { note: 'C4', duration: 400 },
            { note: 'D4', duration: 400 },
            { note: 'E4', duration: 1600 }
        ]
    },
    {
        id: 6,
        name: '卡农 (片段)',
        difficulty: '⭐⭐⭐ 进阶',
        notes: [
            { note: 'C4', duration: 400 },
            { note: 'E4', duration: 400 },
            { note: 'G4', duration: 400 },
            { note: 'E4', duration: 400 },
            { note: 'A4', duration: 400 },
            { note: 'G4', duration: 400 },
            { note: 'F4', duration: 400 },
            { note: 'D4', duration: 400 },
            { note: 'C4', duration: 400 },
            { note: 'E4', duration: 400 },
            { note: 'D4', duration: 400 },
            { note: 'C4', duration: 800 }
        ]
    }
];

function getSongList() {
    return songs.map(song => ({
        id: song.id,
        name: song.name,
        difficulty: song.difficulty
    }));
}

function getSongById(id) {
    return songs.find(song => song.id === id);
}
