// Debugging: Log when the script loads
console.log("game.js loaded!");

// Game State Variables
let selectedWords = [];
let remainingTries = 4;
let gameActive = false; // Game is inactive until started
let categoriesSolved = 0;
let timerInterval;
let startTime;

// Start the game when the start screen is clicked
document.getElementById('startScreen').addEventListener('click', function () {
    console.log("Start screen clicked!");

    // Hide the start screen
    document.getElementById('startScreen').style.display = 'none';

    // Show the loading screen
    document.getElementById('loadingScreen').classList.remove('hidden');

    // Play portal-enter sound
    const portalEnterAudio = document.getElementById('portal-enter');
    portalEnterAudio.play().catch(error => {
        console.error('Error playing portal-enter.mp3:', error);
    });

    // Simulate loading for 4 seconds
    setTimeout(() => {
        // Hide the loading screen
        document.getElementById('loadingScreen').classList.add('hidden');

        // Play portal-exit sound after a short delay
        setTimeout(() => {
            const portalExitSound = document.getElementById('portal-exit');
            portalExitSound.play().catch(error => {
                console.error('Error playing portal-exit.mp3:', error);
            });

            // Play fire sound on loop
            const fireSound = document.getElementById('fireSound');
            fireSound.loop = true;
            fireSound.play().catch(error => {
                console.error('Error playing fire.mp3:', error);
            });
        }, 200);

        // Show the game content and start the game
        document.getElementById('gameContent').classList.remove('hidden');
        initializeGame();
        startTimer();
        document.getElementById('timer').style.display = 'block';
        gameActive = true; // Activate the game
    }, 4000);
});

// Initialize the game grid
function initializeGame() {
    const gameGrid = document.getElementById('gameGrid');
    gameGrid.innerHTML = '';

    // Flatten all words from categories and shuffle them
    const allWords = [].concat(...Object.values(categories).map(c => c.words));
    shuffleArray(allWords);

    // Create word boxes for each word
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

    updateTriesDisplay();
}

// Toggle word selection
function toggleWord(word, element) {
    if (!gameActive) return;

    const index = selectedWords.indexOf(word);
    if (index === -1) {
        if (selectedWords.length < 4) {
            selectedWords.push(word);
            element.classList.add('selected');
            playSound('selectSound');
        }
    } else {
        selectedWords.splice(index, 1);
        element.classList.remove('selected');
        playSound('deselectSound');
    }
}

// Submit a group of selected words
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
}

// Handle correct category submission
function handleCorrectCategory(category) {
    category.solved = true;
    categoriesSolved++;

    const categoryBox = document.createElement('div');
    categoryBox.className = `category-box ${category.color}`;
    categoryBox.innerHTML = `
        <div><strong>${category.name}</strong></div>
        <div>${category.words.join(', ')}</div>
    `;
    document.getElementById('categoriesContainer').appendChild(categoryBox);
    playSound(`${category.color}-categ`);

    // Remove solved words from the grid
    const gameGrid = document.getElementById('gameGrid');
    Array.from(gameGrid.children).forEach(box => {
        if (category.words.includes(box.textContent)) {
            box.remove();
        }
    });

    checkGameEnd();
}

// Handle incorrect submission
function handleIncorrectSubmit() {
    remainingTries--;
    updateTriesDisplay();

    if (remainingTries === 0) {
        gameActive = false;
        document.getElementById('message').textContent = "You were probably close... or not.";
        revealAnswers();
    }
}

// Update the tries display
function updateTriesDisplay() {
    const circles = document.querySelectorAll('#triesCircles .circle');
    circles.forEach((circle, index) => {
        circle.classList.toggle('white', index >= remainingTries);
    });
}

// Check if the game is over
function checkGameEnd() {
    if (categoriesSolved === 4) {
        gameActive = false;
        document.getElementById('message').textContent = "YAY!!! You did it!";
        stopTimer();
    }
}

// Shuffle the words in the grid
function shuffleWords() {
    if (!gameActive) return;

    const gameGrid = document.getElementById('gameGrid');
    const boxes = Array.from(gameGrid.children);
    shuffleArray(boxes);
    gameGrid.innerHTML = '';
    boxes.forEach(box => gameGrid.appendChild(box));
}

// Deselect all selected words
function deselectAll() {
    selectedWords = [];
    document.querySelectorAll('.word-box').forEach(box => {
        box.classList.remove('selected');
    });
}

// Utility function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Play a sound by ID
function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(error => console.error(`Error playing sound: ${error}`));
    }
}
