let selectedWords = [];
let remainingTries = 4;
let gameActive = true;
let categoriesSolved = 0;

function initializeGame() {
    const gameGrid = document.getElementById('gameGrid');
    gameGrid.innerHTML = '';
    
    // Flatten all words and shuffle
    const allWords = [].concat(...Object.values(categories).map(c => c.words));
    shuffleArray(allWords);
    
    allWords.forEach(word => {
        const box = document.createElement('div');
        box.className = 'word-box';
        box.textContent = word;
        box.onclick = () => toggleWord(word, box);
        gameGrid.appendChild(box);
    });
    
    updateTriesDisplay();
}

function toggleWord(word, element) {
    if (!gameActive) return;
    
    const index = selectedWords.indexOf(word);
    if (index === -1) {
        if (selectedWords.length < 4) {
            selectedWords.push(word);
            element.classList.add('selected');
        }
    } else {
        selectedWords.splice(index, 1);
        element.classList.remove('selected');
    }
}

function submitGroup() {
    if (!gameActive || selectedWords.length !== 4) return;

    const correctCategory = Object.values(categories).find(cat =>
        selectedWords.every(word => cat.words.includes(word))
    );

    if (correctCategory) {
        handleCorrectCategory(correctCategory);
    } else {
        handleIncorrectSubmit();
    }

    selectedWords = [];
    deselectAll();
    checkGameEnd();
}

function handleCorrectCategory(category) {
    category.solved = true; // This marks the category as solved
    categoriesSolved++;

    // Move words to category display
    const categoryBox = document.createElement('div');
    categoryBox.className = `category-box ${category.color}`;
    categoryBox.innerHTML = `
        <div><strong>${category.name}</strong></div>
        <div>${category.words.join(', ')}</div>
    `;
    document.getElementById('categoriesContainer').appendChild(categoryBox);

    // Remove words from grid
    const gameGrid = document.getElementById('gameGrid');
    Array.from(gameGrid.children).forEach(box => {
        if (category.words.includes(box.textContent)) {
            box.remove();
        }
    });
}

function revealAnswers() {
    const unsolvedCategories = Object.values(categories)
        .filter(category => !category.solved)
        .sort((a, b) => categoryPriority.indexOf(a.color) - categoryPriority.indexOf(b.color));

    // Reveal answers one by one in priority order
    unsolvedCategories.forEach((category, index) => {
        setTimeout(() => {
            // Remove words from the grid
            const gameGrid = document.getElementById('gameGrid');
            Array.from(gameGrid.children).forEach(box => {
                if (category.words.includes(box.textContent)) {
                    box.remove();
                }
            });

            // Add the category to the categoriesContainer (like a correct guess)
            const categoryBox = document.createElement('div');
            categoryBox.className = `category-box ${category.color}`;
            categoryBox.innerHTML = `
                <div><strong>${category.name}</strong></div>
                <div>${category.words.join(', ')}</div>
            `;
            document.getElementById('categoriesContainer').appendChild(categoryBox);
        }, index * 1000); // 1-second delay between each category
    });
}

function handleIncorrectSubmit() {
    remainingTries--;
    updateTriesDisplay();
    
    if (remainingTries === 0) {
        gameActive = false;
        document.getElementById('message').textContent = "you were prob close lol..... or not";
        revealAnswers(); // Reveal answers in the grid
    }
}

function updateTriesDisplay() {
    const circles = document.querySelectorAll('#triesCircles .circle');
    circles.forEach((circle, index) => {
        // Turn circles white from right to left
        circle.classList.toggle('white', index >= remainingTries);
    });
}

function shuffleWords() {
    if (!gameActive) return;
    
    const gameGrid = document.getElementById('gameGrid');
    const boxes = Array.from(gameGrid.children);
    shuffleArray(boxes);
    gameGrid.innerHTML = '';
    boxes.forEach(box => gameGrid.appendChild(box));
}

function deselectAll() {
    selectedWords = [];
    document.querySelectorAll('.word-box').forEach(box => {
        box.classList.remove('selected');
    });
}

function checkGameEnd() {
    if (categoriesSolved === 4) {
        gameActive = false;
        document.getElementById('message').textContent = "YAY!!! u did it :D didn't think u could honestly";
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Initialize game on load
window.onload = initializeGame;
