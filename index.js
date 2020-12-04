/**
 * @author Alexandre Bianchi, Loïck Jeanneret
 */
const { app, BrowserWindow } = require('electron')
const fileWatcher = require("./backend/file-watcher.js");

let mainWindow;

fileWatcher.addEvents();

function createMainWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: true
        }
    })

    win.loadFile('frontend/index.html')
        // win.webContents.openDevTools()

    return win
}

app.on("ready", () => {
    mainWindow = createMainWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (!mainWindow) {
        mainWindow = createMainWindow()
    }
})