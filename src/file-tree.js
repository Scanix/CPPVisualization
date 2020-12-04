export default class FileTree {
    constructor(targetElement, searchBar, buttons) {
        this._targetElement = targetElement;
        this._selectedItems = [];

        // Track both tree and as list to make it easier to work with
        // TODO: Some place should use the list instead of the tree to make code easier to read
        this._fileTree = {};
        this._fileList = [];

        buttons.resetSearch.addEventListener("click", () => {
            this._resetSelection();
            dispatchEvent(new CustomEvent('treeSelectionEvent'))
        });
        buttons.headers.addEventListener("click", () => {
            this._selectType("header");
            dispatchEvent(new CustomEvent('treeSelectionEvent', { detail: { files: this._selectedItems } }))
        });
        buttons.sources.addEventListener("click", () => {
            this._selectType("source");
            dispatchEvent(new CustomEvent('treeSelectionEvent', { detail: { files: this._selectedItems } }))
        });

        searchBar.addEventListener("keyup", (event) => {
            this._handleSearchBar(searchBar.value, this._fileTree);
        });
    }

    _selectType(type) {
        this._resetSelection();

        for (let i = 0; i < this._fileList.length; i++) {
            const file = this._fileList[i];
            console.log(file);
            if (file.type === type) {
                file.div.classList.add("highlighted");
                this._selectedItems.push(file);
            }
        }
    }

    _resetSelection() {
        this._selectedItems = [];
        document.querySelectorAll(".highlighted").forEach((element) => {
            element.classList.remove("highlighted");
        });
    }

    _showFolderParents(parent) {
        parent.nameDiv.classList.remove("file-not-found");
        parent.nameDiv.classList.remove("icon-folder-closed");
        parent.nameDiv.classList.add("icon-folder-open");
        parent.folderDiv.classList.remove("collapsed");

        if (parent.parent) {
            this._showFolderParents(parent.parent);
        }
    }

    _handleSearchBar(search, folder) {
        for (const folderName in folder.folders) {
            // Hide all folders
            folder.folders[folderName].nameDiv.classList.add("file-not-found");
            this._handleSearchBar(search, folder.folders[folderName]);
        }

        // Find file
        for (const fileName in folder.files) {
            const file = folder.files[fileName];
            if (fileName.toLocaleLowerCase().includes(search.toLocaleLowerCase())) {
                file.div.classList.remove("file-not-found");
                this._showFolderParents(folder);
            } else {
                file.div.classList.add("file-not-found");
            }
        }
    }

    _getFileIcon(type) {
        const types = {
            "source": "icon-source",
            "header": "icon-header"
        };

        type = types[type] || "icon-file";
        return type;
    }

    _highlightAllChildren(folder, highlight) {
        if (highlight) {
            folder.nameDiv.classList.add("highlighted");
        } else {
            folder.nameDiv.classList.remove("highlighted");
        }

        for (const fileName in folder.files) {
            const file = folder.files[fileName];
            if (highlight) {
                if (!file.div.classList.contains("highlighted")) {
                    file.div.classList.add("highlighted");
                    this._selectedItems.push(file);
                }
            } else {
                if (file.div.classList.contains("highlighted")) {
                    file.div.classList.remove("highlighted");
                    this._selectedItems.splice(this._selectedItems.indexOf(file), 1);
                }
            }
        }

        for (const folderName in folder.folders) {
            const childFolder = folder.folders[folderName];
            this._highlightAllChildren(childFolder, highlight);
        }
    }

    _displayFolder(folder, root = false) {
        const folderDiv = document.createElement("div");
        folder.folderDiv = folderDiv;

        if (!root) {
            folderDiv.className = "tree-folder";
        }

        for (const folderName in folder.folders) {
            const folderNameDiv = document.createElement("div");
            folder.folders[folderName].nameDiv = folderNameDiv;
            folderNameDiv.className = "tree-folder-name has-icon icon-folder-open";
            folderNameDiv.textContent = folderName;

            const children = this._displayFolder(folder.folders[folderName]);

            folderNameDiv.addEventListener("click", (event) => {
                if (event.ctrlKey) {
                    this._highlightAllChildren(folder.folders[folderName], !folderNameDiv.classList.contains("highlighted"));
                } else {
                    folderNameDiv.classList.toggle("icon-folder-closed");
                    folderNameDiv.classList.toggle("icon-folder-open");
                    children.classList.toggle("collapsed");
                }
                dispatchEvent(new CustomEvent('treeSelectionEvent', { detail: { files: this._selectedItems } }))
            });

            folderDiv.appendChild(folderNameDiv);
            folderDiv.appendChild(children);
        }

        for (const fileName in folder.files) {
            const fileNameDiv = document.createElement("div");
            folder.files[fileName].div = fileNameDiv;

            fileNameDiv.className = "tree-folder-item has-icon " + this._getFileIcon(folder.files[fileName].type);
            fileNameDiv.textContent = fileName;

            fileNameDiv.addEventListener("click", (event) => {
                if (!event.ctrlKey) {
                    // TODO: Make sure highlighted is not used for something else
                    this._resetSelection();
                    fileNameDiv.classList.add("highlighted");
                } else {
                    fileNameDiv.classList.toggle("highlighted");
                }

                if (fileNameDiv.classList.contains("highlighted")) {
                    this._selectedItems.push(folder.files[fileName]);
                } else {
                    this._selectedItems.splice(this._selectedItems.indexOf(folder.files[fileName]), 1);
                }
                dispatchEvent(new CustomEvent('treeSelectionEvent', { detail: { files: this._selectedItems } }))
            });

            folderDiv.appendChild(fileNameDiv);
        }

        return folderDiv;
    }

    update(projectStructure) {
        const fileTreeRoot = { files: {}, folders: { "Project folder": { files: {}, folders: {} } } };
        const fileTree = fileTreeRoot.folders["Project folder"];

        this._fileList = [];

        for (let i = 0; i < projectStructure.files.length; i++) {
            const file = projectStructure.files[i];

            const folderPath = file.path; // Remove file name from path

            // Build file tree	
            if (folderPath.length === 0) {
                // root	
                fileTree.files[file.name] = file;
            } else {
                // children of root
                if (!fileTree.folders[folderPath[0]]) {
                    fileTree.folders[folderPath[0]] = { files: {}, folders: {} };
                }

                let currentFolder = fileTree.folders[folderPath[0]];

                // Create folder structure	
                for (let j = 1; j < folderPath.length; j++) {
                    const folderName = folderPath[j];
                    if (!currentFolder.folders[folderName]) {
                        currentFolder.folders[folderName] = { files: {}, folders: {}, parent: currentFolder };
                    }

                    currentFolder = currentFolder.folders[folderName];
                }

                // Found last folder, "append" file	
                currentFolder.files[file.name] = file;
                this._fileList.push(file);
            }
        }

        this._fileTree = fileTree;

        this._targetElement.innerHTML = "";
        this._targetElement.appendChild(
            this._displayFolder(fileTreeRoot, true)
        );
    }
}