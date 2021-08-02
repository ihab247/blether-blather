const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

var WORD_NOTES = new Map();
var CURRENT_WORD_CONF_PATH = "";

var DEFAULT_CONFIG_FILE_JSON = {
  original: "",
  translation: "",
  words: []
}

var DEFAULT_CONFIG_FILE_STRING = JSON.stringify(DEFAULT_CONFIG_FILE_JSON, null, 2);

if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow;

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 1000,
    minWidth: 600,
    minHeight: 800,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "favicon.ico"),

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "main", "index.html"));
}

function createFlashWindow() {
  childWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    modal: true,
    show: false,
    autoHideMenuBar: true,
    parent: mainWindow,
    icon: path.join(__dirname, "flash", "favicon.ico"),

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  childWindow.loadFile(path.join(__dirname, "flash", "flash.html"));

  childWindow.once("ready-to-show", () => {
    childWindow.show();
  });
}

app.on("ready", createMainWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// flash window
ipcMain.on("open-flash-window", (event, arg) => {
  createFlashWindow();
});

// notes
ipcMain.on("get-notes", (event, arg) => {
  event.returnValue = WORD_NOTES;
});

ipcMain.on("add-word-to-notes", (event, arg) => {
  if (WORD_NOTES.has(arg.word)) {
    event.returnValue = false;
  }
  else {
    WORD_NOTES.set(arg.word, {
      word_type: arg.word_type,
      translation: arg.translation
    });
    event.returnValue = true;
  }
});

ipcMain.on("remove-word-from-notes", (event, arg) => {
  WORD_NOTES.delete(arg);
});

ipcMain.on("update-note", (event, arg) => {
  WORD_NOTES.get(arg.word).word_type = arg.word_type;
  WORD_NOTES.get(arg.word).translation = arg.translation;
});

ipcMain.on("change-flash-card-position", (event, arg) => {

});


// config
ipcMain.on("get-config-file", (event, arg) => {
  let path = dialog.showOpenDialogSync(
    {
      properties: [
        "openFile"
      ],
      filters: [
        { name: "Config Files", extensions: ["json"] }
      ]
    }
  )
  if (path) {
    let obj = JSON.parse(fs.readFileSync(path[0]));

    // if (obj.translation == undefined || obj.original == undefined || obj.words != undefined) {
    //   dialog.showErrorBox("Error", "Had trouble digesting that config!");
    // }

    CURRENT_WORD_CONF_PATH = path[0];
    WORD_NOTES = new Map();
    for (var word_obj of obj.words) {
      WORD_NOTES.set(word_obj.word, {
        word_type: word_obj.word_type,
        translation: word_obj.translation
      });
    }
    event.returnValue = obj;
  }
  else {
    event.returnValue = false;
  }
});

ipcMain.on("create-new-config-file", (event, arg) => {
  let path = dialog.showSaveDialogSync(
    {
      defaultPath: `*/${Date.now()}-newconfig`,
      properties: [
        "openFile"
      ],
      filters: [
        { name: "Config Files", extensions: ["json"] }
      ]
    }
  )

  if (path == undefined) {
    event.returnValue = false;
  }
  else {
    event.returnValue = path;
    CURRENT_WORD_CONF_PATH = path;
    fs.writeFileSync(path, DEFAULT_CONFIG_FILE_STRING);
    WORD_NOTES = new Map();
  }
});

ipcMain.on("update-config-file", (event, arg) => {
  if (CURRENT_WORD_CONF_PATH.length > 0) {
    let data = JSON.parse(fs.readFileSync(CURRENT_WORD_CONF_PATH));
    data.words = [];

    for (const [key, value] of WORD_NOTES.entries())
      data.words.push({ word: key, translation: value.translation, word_type: value.word_type });

    if (arg.newOriginal) {
      data.original = arg.newOriginal;
    }
    if (arg.newTranslation) {
      data.translation = arg.newTranslation;
    }
    fs.writeFileSync(CURRENT_WORD_CONF_PATH, JSON.stringify(data, null, 2));
  }
});

ipcMain.on("error-message", (event, title, description) => {
  dialog.showErrorBox(title, description);
});