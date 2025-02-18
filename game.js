// Debugging: Log when the script loads
console.log("game.js loaded!");

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
        formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
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
    console.log("Start screen clicked!"); // Debugging line

    // Hide the start screen
    document.getElementById('startScreen').style.display = 'none';

    // Show the loading screen
    document.getElementById('loadingScreen').classList.remove('hidden');

    // Play portal-enter.mp3
    const portalEnterAudio = document.getElementById('portal-enter');
    portalEnterAudio.play().catch(error => {
        console.error('Error playing portal-enter.mp3:', error); // Debugging line
    });

    // Wait for 4 seconds (duration of the loading screen and audio)
    setTimeout(() => {
        // Hide the loading screen
        document.getElementById('loadingScreen').classList.add('hidden');

        // Play portal-exit.mp3 after 0.2 seconds
        setTimeout(() => {
            const portalExitSound = document.getElementById('portal-exit');
            const fireSound = document.getElementById('fireSound');

            // Play portal-exit.mp3
            portalExitSound.play().catch(error => {
                console.error('Error playing portal-exit.mp3:', error); // Debugging line
            });

            // Play fire.mp3 on loop
            fireSound.loop = true; // Enable looping
            fireSound.play().catch(error => {
                console.error('Error playing fire.mp3:', error);
            });
        }, 200);

        // Show the game content and start the game
        document.getElementById('gameContent').classList.remove('hidden');
        initializeGame();
        startTimer();
        document.getElementById('timer').style.display = 'block';
    }, 4000);
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
        // Check if the player is one away (3 out of 4 words correct)
        const partialMatches = Object.values(categories).filter(cat =>
            selectedWords.filter(word => cat.words.includes(word)).length === 3
        );

        if (partialMatches.length > 0) {
            // If the player is one away, deduct a try and show the One Way Box
            handleIncorrectSubmit(); // Deduct a try
            showOneAwayBox(); // Show the One Way Box
        } else {
            // If the player is not one away, handle as a regular mistake
            handleIncorrectSubmit();
        }
    }

    // Reset selected words and check if the game is over
    selectedWords = [];
    deselectAll();
    checkGameEnd();
}

function showOneAwayBox() {
    const oneAwayBox = document.getElementById('oneAwayBox');
    oneAwayBox.classList.remove('hidden');
    oneAwayBox.classList.add('fade-in');

    // Play the nether-button.mp3 sound effect
    const buttonSound = document.getElementById('buttonSound');
    if (buttonSound) {
        buttonSound.currentTime = 0; // Reset the sound to the start
        buttonSound.play().catch(error => {
            console.error('Error playing nether-button.mp3:', error);
        });
    } else {
        console.error('Sound element not found');
    }

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

    // Play the hurt sound effect
    const hurtSound = playNextSound(); // Play the hurt sound and get the sound element

    // After blink duration, update display
    setTimeout(() => {
        circles.forEach(circle => circle.classList.remove('blink'));
        updateTriesDisplay();

        // Calculate the delay for nether-button.mp3 and the box
        const hurtSoundDuration = hurtSound.duration * 1000; // Convert to milliseconds
        const delayAfterHurtSound = 1000; // 1 second after the hurt sound ends

        // Show the "One Away" box and play nether-button.mp3 after the delay
        setTimeout(() => {
            showOneAwayBox(); // Show the box and play nether-button.mp3
        }, hurtSoundDuration + delayAfterHurtSound);
    }, 200);

    if (remainingTries === 0) {
        gameActive = false;
        document.getElementById('message').textContent = "you were prob close lol..... or not";
        revealAnswers();
    }
}

function playNextSound() {
    const sound = soundFiles[currentSoundIndex];
    sound.currentTime = 0;
    sound.play();
    currentSoundIndex = (currentSoundIndex + 1) % soundFiles.length;
    return sound; // Return the sound element to access its duration
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

