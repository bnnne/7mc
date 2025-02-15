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
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    document.getElementById('timer').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Function to stop the timer
function stopTimer() {
    clearInterval(timerInterval);
}

// Start the game when the start screen is clicked
document.getElementById('startScreen').addEventListener('click', function() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('loadingScreen').classList.remove('hidden');
    document.getElementById('portal-enter').play();

    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
        setTimeout(() => {
            document.getElementById('portal-exit').play();
            document.getElementById('fireSound').play().catch(error => console.error('Error playing fire.mp3:', error));
        }, 200);
        document.getElementById('gameContent').classList.remove('hidden');
        initializeGame();
        startTimer();
        document.getElementById('timer').style.display = 'block';
    }, 4000);
});

const soundFiles = [
    document.getElementById('hurtSound1'),
    document.getElementById('hurtSound2'),
    document.getElementById('hurtSound3')
];
let currentSoundIndex = 0;

function playNextSound() {
    soundFiles[currentSoundIndex].currentTime = 0;
    soundFiles[currentSoundIndex].play();
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
        box.onclick = () => toggleWord(word, box);
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
        handleIncorrectSubmit();
    }
    selectedWords = [];
    deselectAll();
    checkGameEnd();
}

function handleCorrectCategory(category) {
    category.solved = true;
    categoriesSolved++;
    const categoryBox = document.createElement('div');
    categoryBox.className = `category-box ${category.color}`;
    categoryBox.innerHTML = `<div><strong>${category.name}</strong></div><div>${category.words.join(', ')}</div>`;
    document.getElementById('categoriesContainer').appendChild(categoryBox);
    playSound(`${category.color}-categ`);
    document.querySelectorAll('.word-box').forEach(box => {
        if (category.words.includes(box.textContent)) {
            box.remove();
        }
    });
}

function handleIncorrectSubmit() {
    remainingTries--;
    updateTriesDisplay();
    handleMistake();
    if (remainingTries === 0) {
        gameActive = false;
        document.getElementById('message').textContent = "you were prob close lol..... or not";
        revealAnswers();
    }
}

function revealAnswers() {
    Object.values(categories).forEach((category, index) => {
        if (!category.solved) {
            setTimeout(() => {
                document.querySelectorAll('.word-box').forEach(box => {
                    if (category.words.includes(box.textContent)) {
                        box.remove();
                    }
                });
                const categoryBox = document.createElement('div');
                categoryBox.className = `category-box ${category.color}`;
                categoryBox.innerHTML = `<div><strong>${category.name}</strong></div><div>${category.words.join(', ')}</div>`;
                document.getElementById('categoriesContainer').appendChild(categoryBox);
                playSound(`${category.color}-categ`);
            }, index * 1000);
        }
    });
}

function updateTriesDisplay() {
    document.querySelectorAll('#triesCircles .circle').forEach((circle, index) => {
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
        stopTimer();
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
