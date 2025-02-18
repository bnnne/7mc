// Debugging: Log when the script loads
console.log("game.js loaded!");

// Game state variables
let selectedWords = [];
let remainingTries = 4;
let gameActive = true;
let categoriesSolved = 0;
let timerInterval;
let startTime;

// Array of sound files for mistakes
const mistakeSounds = [
    document.getElementById('hurtSound1'),
    document.getElementById('hurtSound2'),
    document.getElementById('hurtSound3')
];
let currentSoundIndex = 0;

// Timer functions
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000); // Time in seconds
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;

    const formattedTime = hours > 0
        ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    document.getElementById('timer').textContent = formattedTime;
}

function stopTimer() {
    clearInterval(timerInterval);
}

// Start the game when the start screen is clicked
document.getElementById('startScreen').addEventListener('click', () => {
    console.log("Start screen clicked!");

    // Hide the start screen and show the loading screen
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('loadingScreen').classList.remove('hidden');

    // Play portal-enter sound
    const portalEnterAudio = document.getElementById('portal-enter');
    portalEnterAudio.play().catch(error => console.error('Error playing portal-enter.mp3:', error));

    // Wait for 4 seconds (loading screen duration)
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');

        // Play portal-exit sound and start fire sound
        setTimeout(() => {
            const portalExitSound = document.getElementById('portal-exit');
            const fireSound = document.getElementById('fireSound');

            portalExitSound.play().catch(error => console.error('Error playing portal-exit.mp3:', error));
            fireSound.loop = true;
            fireSound.play().catch(error => console.error('Error playing fire.mp3:', error));
        }, 200);

        // Show the game content and start the game
        document.getElementById('gameContent').classList.remove('hidden');
        initializeGame();
        startTimer();
        document.getElementById('timer').style.display = 'block';
    }, 4000);
});

// Play sound effects
function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(error => console.error(`Error playing sound: ${error}`));
    }
}

// Play the next mistake sound
function playNextMistakeSound() {
    const sound = mistakeSounds[currentSoundIndex];
    sound.currentTime = 0;
    sound.play();
    currentSoundIndex = (currentSoundIndex + 1) % mistakeSounds.length;
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

// Initialize the game grid
function initializeGame() {
    const gameGrid = document.getElementById('gameGrid');
    gameGrid.innerHTML = '';

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

    updateTriesDisplay();
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
        // Check if the player is one away (3 out of 4 words correct)
        const partialMatches = Object.values(categories).filter(cat =>
            selectedWords.filter(word => cat.words.includes(word)).length === 3
        );

        if (partialMatches.length > 0) {
            handleIncorrectSubmit(); // Deduct a try
            setTimeout(() => showOneAwayBox(), 500); // Show "One Away" box after mistake sound
        } else {
            handleIncorrectSubmit(); // Regular mistake
        }
    }

    // Reset selected words and check if the game is over
    selectedWords = [];
    deselectAll();
    checkGameEnd();
}

// Show the "One Away" box
function showOneAwayBox() {
    const oneAwayBox = document.getElementById('oneWayBox');
    oneAwayBox.classList.remove('hidden');
    oneAwayBox.classList.add('fade-in');

    // Play the button sound effect
    playSound('buttonSound');

    // Hide the box after 2 seconds
    setTimeout(() => {
        oneAwayBox.classList.remove('fade-in');
        oneAwayBox.classList.add('fade-out');

        // Remove the box from the DOM after the fade-out animation
        setTimeout(() => {
            oneAwayBox.classList.add('hidden');
            oneAwayBox.classList.remove('fade-out');
        }, 1000); // Fade-out duration
    }, 2000); // Display duration (2 seconds)
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

    // Remove solved words from the game grid
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

    // Add blink to all hearts
    const circles = document.querySelectorAll('#triesCircles .circle');
    circles.forEach(circle => circle.classList.add('blink'));

    // Update display after blink duration
    setTimeout(() => {
        circles.forEach(circle => circle.classList.remove('blink'));
        updateTriesDisplay();
        playNextMistakeSound();

        if (remainingTries === 0) {
            gameActive = false;
            document.getElementById('message').textContent = "you were prob close lol..... or not";
            revealAnswers();
        }
    }, 200);
}

// Reveal unsolved categories at the end of the game
function revealAnswers() {
    const unsolvedCategories = Object.values(categories)
        .filter(category => !category.solved)
        .sort((a, b) => categoryPriority.indexOf(a.color) - categoryPriority.indexOf(b.color));

    unsolvedCategories.forEach((category, index) => {
        setTimeout(() => {
            const gameGrid = document.getElementById('gameGrid');
            Array.from(gameGrid.children).forEach(box => {
                if (category.words.includes(box.textContent)) {
                    box.remove();
                }
            });

            const categoryBox = document.createElement('div');
            categoryBox.className = `category-box ${category.color}`;
            categoryBox.innerHTML = `
                <div><strong>${category.name}</strong></div>
                <div>${category.words.join(', ')}</div>
            `;
            document.getElementById('categoriesContainer').appendChild(categoryBox);
            playSound(`${category.color}-categ`);
        }, index * 1000);
    });
}

// Update the tries display
function updateTriesDisplay() {
    const circles = document.querySelectorAll('#triesCircles .circle');
    const shouldShake = remainingTries === 1;

    circles.forEach((circle, index) => {
        const isLost = index >= remainingTries;
        circle.classList.toggle('white', isLost);
        circle.classList.toggle('shake', shouldShake);
    });
}

// Shuffle words in the game grid
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

// Check if the game has ended
function checkGameEnd() {
    if (categoriesSolved === 4) {
        gameActive = false;
        document.getElementById('message').textContent = "YAY!!! u did it :D didn't think u could honestly";
        stopTimer();
    }
}

// Shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
