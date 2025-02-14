let selectedWords = [];
let remainingTries = 4;
let gameActive = true;
let categoriesSolved = 0;

// Array of sound files
const soundFiles = [
    document.getElementById('hurtSound1'),
    document.getElementById('hurtSound2'),
    document.getElementById('hurtSound3')
];

let currentSoundIndex = 0; // Track the current sound index

// Function to play the next sound effect for mistakes
function playNextSound() {
    const sound = soundFiles[currentSoundIndex];
    sound.currentTime = 0; // Reset the sound to the start
    sound.play(); // Play the sound

    // Update the index for the next sound
    currentSoundIndex = (currentSoundIndex + 1) % soundFiles.length;
}

// Trigger on mistake
function handleMistake() {
    playNextSound(); // Play the next sound effect
}

// Function to play a sound by ID
function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(error => console.error(`Error playing sound: ${error}`));
    }
}

// Initialize button click sounds
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
        playSound('clickSound'); // Play sound when clicking any button
    });
});

// Toggle word selection
function toggleWord(word, element) {
    if (!gameActive) return;

    const index = selectedWords.indexOf(word);
    if (index === -1) {
        if (selectedWords.length < 4) {
            selectedWords.push(word);
            element.classList.add('selected');
            playSound('selectSound'); // Play sound when selecting a word
        }
    } else {
        selectedWords.splice(index, 1);
        element.classList.remove('selected');
        playSound('deselectSound'); // Play sound when deselecting a word
    }
}

// Initialize the game grid
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
        box.setAttribute('role', 'button');
        box.setAttribute('tabindex', '0');
        box.onclick = () => toggleWord(word, box);
        box.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                toggleWord(word, box);
            }
        });
        gameGrid.appendChild(box);
    });

    updateTriesDisplay(); // Initialize tries display
}

// Submit selected words
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
    checkGameEnd(); // Check if the game is over
}

// Handle correct category submission
function handleCorrectCategory(category) {
    category.solved = true; // Mark the category as solved
    categoriesSolved++;

    // Move words to category display
    const categoryBox = document.createElement('div');
    categoryBox.className = `category-box ${category.color}`;
    categoryBox.innerHTML = `
        <div><strong>${category.name}</strong></div>
        <div>${category.words.join(', ')}</div>
    `;
    document.getElementById('categoriesContainer').appendChild(categoryBox);
    playSound(`${category.color}-categ`); // Play category sound

    // Remove words from grid
    const gameGrid = document.getElementById('gameGrid');
    Array.from(gameGrid.children).forEach(box => {
        if (category.words.includes(box.textContent)) {
            box.remove();
        }
    });
}

// Handle incorrect submission
function handleIncorrectSubmit() {
    remainingTries--;
    updateTriesDisplay();
    handleMistake(); // Play mistake sound

    if (remainingTries === 0) {
        gameActive = false;
        document.getElementById('message').textContent = "you were prob close lol..... or not";
        revealAnswers(); // Reveal answers in the grid
    }
}

// Reveal unsolved categories
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

            // Add the category to the categoriesContainer
            const categoryBox = document.createElement('div');
            categoryBox.className = `category-box ${category.color}`;
            categoryBox.innerHTML = `
                <div><strong>${category.name}</strong></div>
                <div>${category.words.join(', ')}</div>
            `;
            document.getElementById('categoriesContainer').appendChild(categoryBox);
            playSound(`${category.color}-categ`);
        }, index * 1000); // 1-second delay between each category
    });
}

// Update tries display
function updateTriesDisplay() {
    const circles = document.querySelectorAll('#triesCircles .circle');
    circles.forEach((circle, index) => {
        circle.classList.toggle('white', index >= remainingTries);
    });
}

// Shuffle words in the grid
function shuffleWords() {
    if (!gameActive) return;

    const gameGrid = document.getElementById('gameGrid');
    const boxes = Array.from(gameGrid.children);
    shuffleArray(boxes);
    gameGrid.innerHTML = '';
    boxes.forEach(box => gameGrid.appendChild(box));
}

// Deselect all words
function deselectAll() {
    selectedWords = [];
    document.querySelectorAll('.word-box').forEach(box => {
        box.classList.remove('selected');
    });
}

// Check if the game is over
function checkGameEnd() {
    if (categoriesSolved === 4) {
        gameActive = false;
        document.getElementById('message').textContent = "YAY!!! u did it :D didn't think u could honestly";
    }
}

// Shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Initialize game on load
window.onload = initializeGame;
