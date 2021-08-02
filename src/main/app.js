const { ipcRenderer } = require("electron")

const notesList = document.getElementById("notes-list");
const originalContainer = document.getElementById("text-language");
const manualContainer = document.getElementById("manual-language");

const DEFAULT_CONFIG_FILE_JSON = {
    original: "",
    translation: "",
    words: []
}

var NUM_NOTES = -1;

//https://stackoverflow.com/questions/42126652/javascript-case-insensitive-string-replace/42126742

// NOTES HANDLING

function resetNotes() {
    NUM_NOTES = -1;
    notesList.innerHTML = "";
}

function addHTMLNote(word = "Insert", type = "Text", definition = "No Definition Set😪") {
    notesList.insertAdjacentHTML("beforeend",
        `<div class="single-note">
            <h class="word">${word}</h>
            <!-- <h class="word-type" contenteditable="true">${type}</h> -->
            <button class="remove-button" hidden="true" style="float: right">💥</button>
            <p class="definition" spellcheck="false" contenteditable="true">${definition}</p>
        </div>`
    );

    NUM_NOTES += 1;

    // ON NOTE UPDATE

    let note = document.getElementsByClassName("single-note").item(NUM_NOTES)

    note.getElementsByClassName("definition").item(0).addEventListener("input", function (e) {
        let c_word = this.parentElement.getElementsByClassName("word").item(0).textContent;
        let c_translation = this.parentElement.getElementsByClassName("definition").item(0).textContent;
        // let c_word_type = this.parentElement.getElementsByClassName("word-type").item(0).textContent;

        ipcRenderer.send("update-note", {
            word: c_word,
            word_type: "Text",
            translation: c_translation
        })
    })

    note.getElementsByClassName("remove-button").item(0).addEventListener("click", function (e) {
        let word = this.parentElement.getElementsByClassName("word").item(0).textContent;
        ipcRenderer.send("remove-word-from-notes", word);
        this.parentElement.remove();
        unhighlightText(word);
        NUM_NOTES--;
    })

    note.addEventListener("mouseover", function (e) {
        this.getElementsByClassName("remove-button").item(0).hidden = false;
    })

    note.addEventListener("mouseout", function (e) {
        this.getElementsByClassName("remove-button").item(0).hidden = true;
    })

}

function createNewNoteServer(note) {
    let obj = {
        word: note.word,
        word_type: note.word_type,
        translation: note.translation
    };
    return ipcRenderer.sendSync("add-word-to-notes", obj)
}

// ------------------------------------------------- \\ 

function setStateFromConfig(json) {
    originalContainer.textContent = json.original;
    manualContainer.textContent = json.translation;
    resetNotes();

    for (var word_obj of json.words) {
        addHTMLNote(word_obj.word, word_obj.word_type, word_obj.translation);
        highlightText(word_obj.word);
    }
}

function createNewConfig() {
    let check = ipcRenderer.sendSync("create-new-config-file");
    if (check) {
        setStateFromConfig(DEFAULT_CONFIG_FILE_JSON);
    }
}

function highlightText(word) {
    originalContainer.innerHTML = originalContainer.innerHTML.replaceAll(word,
        `<span class="highlighted">${word}</span>`
    );
}

function unhighlightText(word) {
    originalContainer.innerHTML = originalContainer.innerHTML.replaceAll(`<span class="highlighted">${word}</span>`,
        word
    );
}

function saveToFile() {
    let pack = {
        newOriginal: originalContainer.textContent,
        newTranslation: manualContainer.textContent
    };
    ipcRenderer.send("update-config-file", pack);
}

// EVENT FUNCTIONS

function onCreateNewNote() {
    let selected = document.getSelection().toString();
    for (var checkWord of selected.split(" ")) {
        if (checkWord.length > 0) {
            let obj = {
                word: checkWord,
                type: "Text",
                definition: "No Definition Set😪"
            }
            let check = createNewNoteServer(obj);
            if (check) {
                addHTMLNote(obj.word, obj.type, obj.definition);
                highlightText(checkWord)
            }
        }
    }
    if (selected.length > 0) {
        return false;
    }
    return true;
}

function onImportButtonPressed() {
    let config = ipcRenderer.sendSync("get-config-file");
    if (config) {
        setStateFromConfig(config);
    }
}

function onCreateButtonPressed() {
    createNewConfig();
}

function onFlashButtonPressed() {
    let notes = ipcRenderer.sendSync("get-notes");
    if (notes.size > 2) {
        ipcRenderer.send("open-flash-window");
    }
    else {
        ipcRenderer.send("error-message", "Can't you even memorize 1 or 2 words?", "You can only use the Flash Feature once you've added at least 3 cards.");
    }
}

function onSaveButtonPressed() {
    saveToFile();
}

// CALL EVENTS

document.onkeydown = function (e) {
    if (e.key == " " && document.activeElement.id == "text-language") {
        return onCreateNewNote();
    }
}

function defosdfjioljasdhfo(e) {
    // asdojfhlasjdikfh
}


