const { ipcRenderer} = require('electron')

const flash_word_queue = document.getElementById("flash-word-queue");
const flash_word_def = document.getElementById("flash-word-def");

var WORD_NOTES = ipcRenderer.sendSync('get-notes')
var USE_WORD_NOTES = new Map(WORD_NOTES);

console.log(WORD_NOTES);

let isDefRevealed = true;

function changePracticeQueue(word) {
    flash_word_queue.textContent = word;
    isDefRevealed = false;
}

function getRandomKey(collection) {
    let keys = Array.from(collection.keys());
    return keys[Math.floor(Math.random() * keys.length)];
}

document.onkeydown = function (e) {
    if (e.key == ' ') {
        if (isDefRevealed) {
            flash_word_def.hidden = true;
            let k = getRandomKey(USE_WORD_NOTES);
            flash_word_queue.textContent = k;
            flash_word_def.textContent = USE_WORD_NOTES.get(k).translation;
            USE_WORD_NOTES.delete(k);
            isDefRevealed = false;

            if (USE_WORD_NOTES.size == 0) {// reset to entire vocab when we iterated through all of them.
                USE_WORD_NOTES = new Map(WORD_NOTES);
                USE_WORD_NOTES.delete(k);
            }

        }
        else {
            isDefRevealed = true;
            flash_word_def.hidden = false;
        }
    }
}
