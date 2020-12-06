const { ipcMain, dialog, BrowserWindow } = require("electron");
const projectParser = require("./project-parser.js");
const chokidar = require("chokidar");

module.exports.addEvents = function () {
    ipcMain.on("set-project-directory", (evt, arg) => {
        watchProject(arg);
    });

    ipcMain.on("open-project-picker", (event, arg) => {
        dialog.showOpenDialog({
            properties: ["openDirectory"]
        }).then((files) => {
            if (files !== undefined) {
                watchProject(files.filePaths[0]);
            }
        });
    })
}

/**
 * Watch folder structure and parse cpp files
 * @param {string} path 
 */
function watchProject(path) {
    // Parse and send project the first time
    parseAndSendProject(path);

    // Watch for any changes in the directory
    chokidar.watch(path, { ignoreInitial: true }).on("all", (_event, changedPath) => {
        // TODO: In the future if we have more time, when a folder change only parse the project once and group changed files
        parseAndSendProject(path, changedPath);
    });
}

function parseAndSendProject(path, changedPath) {
    projectParser.parseProject(path, changedPath).then((projectStructure) => {
        sendProjectStructure(projectStructure);
    });
}

/**
 * Send object to frontend
 * @param {object} obj 
 */
function sendProjectStructure(obj) {
    BrowserWindow.getAllWindows()[0].webContents.send("project-structure-updated", JSON.stringify(obj));
}