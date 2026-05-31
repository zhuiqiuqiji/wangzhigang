const WORD_LISTS = {
    easy: [
        'cat', 'dog', 'sun', 'moon', 'star', 'tree', 'fish', 'bird', 'book', 'pen',
        'cup', 'hat', 'ball', 'door', 'key', 'map', 'bag', 'box', 'car', 'bus',
        'red', 'blue', 'green', 'yellow', 'white', 'black', 'pink', 'brown', 'gray', 'orange',
        'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
        'run', 'jump', 'swim', 'read', 'write', 'sing', 'dance', 'play', 'eat', 'sleep'
    ],
    medium: [
        'apple', 'banana', 'orange', 'grape', 'mango', 'lemon', 'peach', 'melon', 'berry', 'cherry',
        'computer', 'keyboard', 'monitor', 'mouse', 'printer', 'speaker', 'headphone', 'charger', 'cable', 'battery',
        'morning', 'evening', 'afternoon', 'midnight', 'sunrise', 'sunset', 'weekend', 'holiday', 'vacation', 'journey',
        'program', 'function', 'variable', 'constant', 'element', 'component', 'module', 'package', 'library', 'framework',
        'beautiful', 'wonderful', 'excellent', 'amazing', 'fantastic', 'brilliant', 'gorgeous', 'stunning', 'remarkable', 'incredible'
    ],
    hard: [
        'algorithm', 'application', 'architecture', 'authentication', 'authorization',
        'configuration', 'development', 'environment', 'implementation', 'infrastructure',
        'optimization', 'performance', 'programming', 'specification', 'synchronization',
        'asynchronous', 'encapsulation', 'inheritance', 'polymorphism', 'abstraction',
        'accomplishment', 'extraordinary', 'revolutionary', 'comprehensive', 'sophisticated',
        'unprecedented', 'groundbreaking', 'state-of-the-art', 'cutting-edge', 'world-class'
    ],
    boss: [
        'electromagnetic', 'entrepreneurship', 'industrialization', 'internationalization',
        'telecommunications', 'thermodynamics', 'electrocardiogram', 'neuropsychology',
        'pharmacokinetics', 'immunohistochemistry', 'spectrophotometry', 'crystallography',
        'otorhinolaryngology', 'encephalomyelopathy', 'pancreaticoduodenectomy',
        'acetylcholinesterase', 'deoxyribonucleic-acid', 'ribonucleic-acid',
        'polymerase-chain-reaction', 'magnetic-resonance-imaging',
        'positron-emission-tomography', 'computerized-axial-tomography'
    ]
};

const SENTENCE_LISTS = {
    easy: [
        'Hello world',
        'Good morning',
        'I love coding',
        'Practice makes perfect',
        'Time is money',
        'No pain no gain',
        'Keep it simple',
        'Think different',
        'Just do it',
        'Stay hungry',
        'Stay foolish',
        'Carpe diem',
        'Seize the day',
        'Follow your heart',
        'The early bird catches the worm'
    ],
    medium: [
        'The quick brown fox jumps over the lazy dog',
        'Programming is the art of telling a computer what to do',
        'A journey of a thousand miles begins with a single step',
        'To be or not to be that is the question',
        'The only way to do great work is to love what you do',
        'Innovation distinguishes between a leader and a follower',
        'Stay hungry stay foolish is my favorite quote',
        'Code is like humor when you have to explain it it is bad',
        'First solve the problem then write the code',
        'Experience is the name everyone gives to their mistakes',
        'The best error message is the one that never shows up',
        'Simplicity is the soul of efficiency'
    ],
    hard: [
        'In software engineering the primary problem is not technology but communication',
        'The function of good software is to make the complex appear to be simple',
        'Any fool can write code that a computer can understand but it takes skill to write code humans understand',
        'The most disastrous thing that you can ever learn is your first programming language',
        'Sometimes it pays to stay in bed on Monday rather than spending the rest of the week debugging Monday code',
        'Measuring programming progress by lines of code is like measuring aircraft building progress by weight',
        'The best programmers are not marginally better than merely good ones they are an order of magnitude better',
        'Debugging is twice as hard as writing the code in the first place so if you write the code as cleverly as possible you are by definition not smart enough to debug it'
    ]
};

if (typeof window !== 'undefined') {
    window.WORD_LISTS = WORD_LISTS;
    window.SENTENCE_LISTS = SENTENCE_LISTS;
}
