export default class FileTree {
    constructor(targetElement) {
        console.log(targetElement);
        this._targetElement = targetElement;
    }

    _displayFolder(folder, root = false) {
        const folderDiv = document.createElement("div");
        if (!root) {
            folderDiv.className = "tree-folder";
        }

        for (const folderName in folder.folders) {
            const folderNameDiv = document.createElement("div");
            folderNameDiv.className = "tree-folder-name";
            folderNameDiv.textContent = "📁 " + folderName;

            folderDiv.appendChild(folderNameDiv);

            const childFolder = folder.folders[folderName];
            folderDiv.appendChild(this._displayFolder(childFolder));
        }

        for (const fileName in folder.files) {
            const fileNameDiv = document.createElement("div");
            fileNameDiv.className = "tree-folder-item";
            fileNameDiv.textContent = fileName;
            folderDiv.appendChild(fileNameDiv);
        }

        return folderDiv;
    }

    update(projectStructure) {
        const fileTree = { files: {}, folders: {} };

        for (let i = 0; i < projectStructure.files.length; i++) {
            const file = projectStructure.files[i];

            const folderPath = file.path; // Remove file name from path

            // Build file tree	
            if (folderPath.length === 0) {
                // root	
                fileTree.files[file.filename] = file.id;
            }
            else {
                // children of root
                if (!fileTree.folders[folderPath[0]]) {
                    fileTree.folders[folderPath[0]] = { files: {}, folders: {} };
                }

                let currentFolder = fileTree.folders[folderPath[0]];

                // Create folder structure	
                for (let j = 1; j < folderPath.length; j++) {
                    const folderName = folderPath[j];
                    if (!currentFolder.folders[folderName]) {
                        currentFolder.folders[folderName] = { files: {}, folders: {} };
                    }

                    currentFolder = currentFolder.folders[folderName];
                }

                // Found last folder, "append" file	
                currentFolder.files[file.filename] = file.id;
            }
        }

        this._targetElement.innerHTML = "";
        this._targetElement.appendChild(
            this._displayFolder(fileTree, true)
        );
    }
}