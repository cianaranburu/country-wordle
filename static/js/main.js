import { initGame, submitGuess, requestHelp, restartGame } from './game.js';
import { setupInputListeners } from './input.js';

const input = document.getElementById('guessInput');
const suggestEl = document.getElementById('suggest');
const counter = document.getElementById('counter');
const msg = document.getElementById('message');
const resultsDiv = document.getElementById('results');

// Bind global actions for HTML buttons
window.submitGuess = () => submitGuess(input.value, input, counter, resultsDiv);
window.requestHelp = requestHelp;
window.restartGame = () => restartGame(input, counter, resultsDiv);

// Handle suggestion click-to-guess corrections
msg.addEventListener('click', e => {
    const btn = e.target.closest('[data-suggestion]');
    if (btn) {
        input.value = btn.dataset.suggestion;
        submitGuess(input.value, input, counter, resultsDiv);
    }
});

// Help modal setup
document.getElementById('helpChips').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.getElementById('helpDialog').close();
    input.value = chip.dataset.name;
    input.focus();
});

document.getElementById('helpDialog').addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.close();
});

// Setup autocomplete & initialize game
setupInputListeners(input, suggestEl, (val) => submitGuess(val, input, counter, resultsDiv));
initGame();