const { ipcMain, dialog, BrowserWindow } = require("electron");
const tempJson = require("./demo-structure.json");
const projectParser = require("./project-parser.js");

module.exports.addEvents = function () {
    ipcMain.on("open-project-picker", (event, arg) => {
        dialog.showOpenDialog({
            properties: ["openDirectory"]
        }).then((files) => {
            if (files !== undefined) {
                watchProject(files);
            }
        });
    })
}

/**
 * Watch folder structure and parse cpp files
 * @param {string} path 
 */
function watchProject(path) {
    // TODO: This should watch and parse project, for now it just sends dummy data
    sendProjectStructure(tempJson);
    projectParser.parseProject(path).then((projectStructure) => {
        // TODO: Send to front
        console.log(projectStructure);
    });
}

/**
 * Send object to frontend
 * @param {object} obj 
 */
function sendProjectStructure(obj) {
    BrowserWindow.getAllWindows()[0].webContents.send("project-structure-updated", JSON.stringify(obj));
}