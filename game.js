let selectedWords = [];
let remainingTries = 4;
let gameActive = true;
let categoriesSolved = 0;
let timerInterval;
let startTime;

// Function to start the timer
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

// Function to update the timer display
function updateTimer() {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000); // Time in seconds
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;

    let formattedTime;
    if (hours > 0) {
        // Format as HH:MM:SS if over an hour
        formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
        // Format as MM:SS if under an hour
        formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    document.getElementById('timer').textContent = formattedTime;
}

// Function to stop the timer
function stopTimer() {
    clearInterval(timerInterval);
}

// Start the game when the start screen is clicked
document.getElementById('startScreen').addEventListener('click', function() {

    // Hide the start screen
    document.getElementById('startScreen').style.display = 'none';

    // Show the loading screen
    document.getElementById('loadingScreen').classList.remove('hidden');

    // Play portal-enter.mp3
    const portalEnterAudio = document.getElementById('portal-enter');
    portalEnterAudio.play();

    // Wait for 4 seconds (duration of the loading screen and audio)
    setTimeout(() => {
        // Hide the loading screen
        document.getElementById('loadingScreen').classList.add('hidden');

        // Play portal-exit.mp3 after 0.2 seconds
        setTimeout(() => {
            const portalExitSound = document.getElementById('portal-exit');
            const fireSound = document.getElementById('fireSound');

            // Play portal-exit.mp3
            portalExitSound.play();

            // Play fire.mp3 on loop
            fireSound.loop = true; // Ensure looping is enabled
            fireSound.play().catch(error => {
                console.error('Error playing fire.mp3:', error);
            });
        }, 200);

        // Show the game content and start the game
        document.getElementById('gameContent').classList.remove('hidden');
        initializeGame();
        startTimer(); // Start the timer when the game starts
        
        document.getElementById('timer').style.display = 'block';
    }, 4000); // 4 seconds
});

// Array of sound files
const soundFiles = [
    document.getElementById('hurtSound1'),
    document.getElementById('hurtSound2'),
    document.getElementById('hurtSound3')
];

// Set animation delays on hearts initially
document.querySelectorAll('#triesCircles .circle').forEach((circle, index) => {
    circle.style.setProperty('--delay', `${index * 0.1}s`);
});

let currentSoundIndex = 0;

// Function to play the next sound effect for mistakes
function playNextSound() {
    const sound = soundFiles[currentSoundIndex];
    sound.currentTime = 0;
    sound.play();
    currentSoundIndex = (currentSoundIndex + 1) % soundFiles.length;
}

function handleMistake() {
    playNextSound();
}

function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(error => console.error(`Error playing sound: ${error}`));
    }
}

document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
        playSound('clickSound');
    });
});

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
    if (!categories || Object.keys(categories).length === 0) {
        console.error('Categories are not defined or empty.');
        return;
    }

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

function submitGroup() {
    if (!gameActive || selectedWords.length !== 4) return;

    const correctCategory = Object.values(categories).find(cat =>
        selectedWords.every(word => cat.words.includes(word))
    );

    if (correctCategory) {
        handleCorrectCategory(correctCategory);
    } else {
        // Check if three out of four words are correct
        const partialMatches = Object.values(categories).filter(cat =>
            selectedWords.filter(word => cat.words.includes(word)).length === 3
        );

        if (partialMatches.length > 0) {
            showOneWayBox();
        } else {
            handleIncorrectSubmit();
        }
    }

    selectedWords = [];
    deselectAll();
    checkGameEnd();
}

function showOneWayBox() {
    const oneWayBox = document.getElementById('oneWayBox');
    oneWayBox.classList.remove('hidden');
    oneWayBox.classList.add('fade-in');

    // Play the sound effect
    const clickSound = document.getElementById('clickSound');
    if (clickSound) {
        clickSound.currentTime = 0; // Reset the sound to the start
        clickSound.play().catch(error => {
            console.error('Error playing sound:', error);
        });
    } else {
        console.error('Sound element not found');
    }

    setTimeout(() => {
        oneWayBox.classList.remove('fade-in');
        oneWayBox.classList.add('fade-out');

        setTimeout(() => {
            oneWayBox.classList.add('hidden');
            oneWayBox.classList.remove('fade-out');
        }, 500); // Fade-out duration
    }, 1000000); // Display duration (2 seconds)
}

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

    const gameGrid = document.getElementById('gameGrid');
    Array.from(gameGrid.children).forEach(box => {
        if (category.words.includes(box.textContent)) {
            box.remove();
        }
    });
}

function handleIncorrectSubmit() {
    const previousTries = remainingTries;
    remainingTries--;
    
    // Add blink to all hearts first
    const circles = document.querySelectorAll('#triesCircles .circle');
    circles.forEach(circle => circle.classList.add('blink'));
    
    // After blink duration, update display
    setTimeout(() => {
        circles.forEach(circle => circle.classList.remove('blink'));
        updateTriesDisplay();
        handleMistake();

        if (remainingTries === 0) {
            gameActive = false;
            document.getElementById('message').textContent = "you were prob close lol..... or not";
            revealAnswers();
        }
    }, 200);
}

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

function updateTriesDisplay() {
    const circles = document.querySelectorAll('#triesCircles .circle');
    const shouldShake = remainingTries === 1;
    
    circles.forEach((circle, index) => {
        const isLost = index >= remainingTries;
        circle.classList.toggle('white', isLost);
        circle.classList.toggle('shake', shouldShake);
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
        stopTimer(); // Stop the timer when the game ends
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Starts game as soon as window loads
window.onload = function() {
    initializeGame();
};
