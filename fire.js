let audioContext;
let fireSoundBuffer;
let fireSoundSource;

// Initialize the Web Audio API
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Load the fire.mp3 file
function loadFireSound() {
    return fetch('audio/fire.mp3')
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            fireSoundBuffer = audioBuffer;
        })
        .catch(error => console.error('Error loading fire.mp3:', error));
}

// Play the fire sound with seamless looping
function playFireSound() {
    if (!fireSoundBuffer || !audioContext) return;

    fireSoundSource = audioContext.createBufferSource();
    fireSoundSource.buffer = fireSoundBuffer;
    fireSoundSource.loop = true;
    fireSoundSource.connect(audioContext.destination);
    fireSoundSource.start(0);
}

// Stop the fire sound
function stopFireSound() {
    if (fireSoundSource) {
        fireSoundSource.stop();
        fireSoundSource.disconnect();
    }
}

// Ensure the audio context is resumed on user interaction
document.addEventListener('click', function() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log('Audio context resumed');
        });
    }
});

// Export functions for use in game.js
export { initAudioContext, loadFireSound, playFireSound, stopFireSound };
