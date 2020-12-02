const { ipcMain, dialog, BrowserWindow } = require("electron");
const projectParser = require("./project-parser.js");
const chokidar = require("chokidar");

module.exports.addEvents = function () {
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
    chokidar.watch(path, { ignoreInitial: true }).on("all", (_event, _changedPath) => {
        parseAndSendProject(path);
    });
}

function parseAndSendProject(path) {
    projectParser.parseProject(path).then((projectStructure) => {
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