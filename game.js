// Debugging: Log when the script loads
console.log("game.js loaded!");

// Game State Variables
let selectedWords = [];
let remainingTries = 4;
let gameActive = true;
let categoriesSolved = 0;
let timerInterval;
let startTime;

// Web Audio API Setup
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let fireSource;

// Preload Audio Files
async function preloadAudio() {
    const audioFiles = {
        portalEnter: 'audio/portal-enter.mp3',
        portalExit: 'audio/portal-exit.mp3',
        fire: 'audio/fire.mp3',
        button: 'audio/button.mp3',
        click: 'audio/button-click.mp3',
        select: 'audio/button-click.mp3',
        deselect: 'audio/button-click.mp3',
        hurt1: 'audio/hurt-fire1.mp3',
        hurt2: 'audio/hurt-fire2.mp3',
        hurt3: 'audio/hurt-fire3.mp3',
        purple: 'audio/purple-categ.mp3',
        blue: 'audio/blue-categ.mp3',
        green: 'audio/green-categ.mp3',
        yellow: 'audio/yellow-categ.mp3'
    };

    const buffers = {};
    for (const [key, url] of Object.entries(audioFiles)) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        buffers[key] = await audioContext.decodeAudioData(arrayBuffer);
    }
    return buffers;
}

// Play Audio with Web Audio API
function playAudio(buffer, loop = false) {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    source.connect(audioContext.destination);
    source.start();
    return source;
}

// Start the Timer
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

// Update the Timer Display
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

// Stop the Timer
function stopTimer() {
    clearInterval(timerInterval);
}

// Start the Game
async function startGame() {
    console.log("Start screen clicked!");

    // Hide the start screen
    document.getElementById('startScreen').style.display = 'none';

    // Show the loading screen
    document.getElementById('loadingScreen').classList.remove('hidden');

    // Preload audio files
    const buffers = await preloadAudio();

    // Play portal-enter.mp3
    playAudio(buffers.portalEnter);

    // After portal-enter.mp3 finishes, play portal-exit.mp3
    setTimeout(() => {
        playAudio(buffers.portalExit);

        // Hide the loading screen and show the game content
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('gameContent').classList.remove('hidden');

        // Start the fire.mp3 loop after portal-exit.mp3 finishes
        setTimeout(() => {
            fireSource = playAudio(buffers.fire, true); // Loop fire.mp3
        }, 200); // Adjust this delay to match the duration of portal-exit.mp3
    }, 4000); // Adjust this delay to match the duration of portal-enter.mp3

    // Initialize the game and start the timer
    initializeGame();
    startTimer();
    document.getElementById('timer').style.display = 'block';
}

// Toggle Word Selection
function toggleWord(word, element) {
    if (!gameActive) return;

    const index = selectedWords.indexOf(word);
    if (index === -1) {
        if (selectedWords.length < 4) {
            selectedWords.push(word);
            element.classList.add('selected');
            playAudio(buffers.select);
        }
    } else {
        selectedWords.splice(index, 1);
        element.classList.remove('selected');
        playAudio(buffers.deselect);
    }
}

// Initialize the Game Grid
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

// Submit a Group of Words
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
            handleIncorrectSubmit();
            showOneWayBox();
        } else {
            handleIncorrectSubmit();
        }
    }

    // Reset selected words and check if the game is over
    selectedWords = [];
    deselectAll();
    checkGameEnd();
}

// Show "One Way" Box
function showOneWayBox() {
    const oneWayBox = document.getElementById('oneWayBox');
    oneWayBox.classList.remove('hidden');
    oneWayBox.classList.add('fade-in');

    playAudio(buffers.button);

    setTimeout(() => {
        oneWayBox.classList.remove('fade-in');
        oneWayBox.classList.add('fade-out');

        setTimeout(() => {
            oneWayBox.classList.add('hidden');
            oneWayBox.classList.remove('fade-out');
        }, 1000);
    }, 2000);
}

// Handle Correct Category
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
    playAudio(buffers[category.color]);

    const gameGrid = document.getElementById('gameGrid');
    Array.from(gameGrid.children).forEach(box => {
        if (category.words.includes(box.textContent)) {
            box.remove();
        }
    });
}

// Handle Incorrect Submission
function handleIncorrectSubmit() {
    remainingTries--;

    const circles = document.querySelectorAll('#triesCircles .circle');
    circles.forEach(circle => circle.classList.add('blink'));

    setTimeout(() => {
        circles.forEach(circle => circle.classList.remove('blink'));
        updateTriesDisplay();
        playAudio(buffers[`hurt${Math.floor(Math.random() * 3) + 1}`]);

        if (remainingTries === 0) {
            gameActive = false;
            document.getElementById('message').textContent = "you were prob close lol..... or not";
            revealAnswers();
        }
    }, 200);
}

// Update Tries Display
function updateTriesDisplay() {
    const circles = document.querySelectorAll('#triesCircles .circle');
    const shouldShake = remainingTries === 1;

    circles.forEach((circle, index) => {
        const isLost = index >= remainingTries;
        circle.classList.toggle('white', isLost);
        circle.classList.toggle('shake', shouldShake);
    });
}

// Shuffle Words
function shuffleWords() {
    if (!gameActive) return;

    const gameGrid = document.getElementById('gameGrid');
    const boxes = Array.from(gameGrid.children);
    shuffleArray(boxes);
    gameGrid.innerHTML = '';
    boxes.forEach(box => gameGrid.appendChild(box));
}

// Deselect All Words
function deselectAll() {
    selectedWords = [];
    document.querySelectorAll('.word-box').forEach(box => {
        box.classList.remove('selected');
    });
}

// Check if the Game is Over
function checkGameEnd() {
    if (categoriesSolved === 4) {
        gameActive = false;
        document.getElementById('message').textContent = "YAY!!! u did it :D didn't think u could honestly";
        stopTimer();
    }
}

// Shuffle Array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Initialize Event Listeners
document.getElementById('startScreen').addEventListener('click', startGame);
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => playAudio(buffers.click));
});

// Preload Audio Files on Page Load
preloadAudio();
