const { ipcRenderer } = require('electron');

// Note: this class could be swapped by something else if we just want to load another json
// Note: this class should be a singleton with the current way it works
export default class ProjectStructureLoader {
    /**
     * @param {function} onProjectLoaded Callback called every time project structure is updated
     */
    constructor(onProjectLoaded) {
        ipcRenderer.on("project-structure-updated", (event, arg) => {
            onProjectLoaded(JSON.parse(arg));
        });
    }

    /**
     * Open file picker
     */
    pickFile() {
        ipcRenderer.send("open-project-picker");
    }
}