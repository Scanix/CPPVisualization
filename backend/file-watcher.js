const { ipcMain, dialog, BrowserWindow } = require("electron");
const projectParser = require("./project-parser.js");

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
    // TODO: This should watch and parse project
    // For now, it just sends the json once
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