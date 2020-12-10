import FileTree from "./file-tree.js";

import GraphChord from "./graphs/graph-chord.js";
import GraphTree from "./graphs/graph-tree.js";
import GraphTreeMap from "./graphs/graph-tree-map.js";

import ProjectStructureLoader from "./project-structure-loader.js";

// Include and add additional graphs here
// Don't forget to create the element in index.html
const graphs = [{ class: GraphChord, selector: "svg.d3-chord" }, { class: GraphTree, selector: "svg.d3-tree" }, { class: GraphTreeMap, selector: "svg.d3-code" }];

addGraphTabs();
loadProject();


/**
 * Add buttons to switch between graphs
 */
function addGraphTabs() {
    const graphContainer = document.getElementById("graphs-container");
    const graphListTarget = document.querySelector("body > nav > p");

    // Add buttons to display graphs
    graphContainer.childNodes.forEach(element => {
        if (element.nodeType !== Node.TEXT_NODE) {
            const button = document.createElement("button");
            button.textContent = element.dataset.graphName;
            graphListTarget.appendChild(button);

            button.addEventListener("click", () => {
                document.querySelectorAll(".graph-display").forEach((otherGraph) => {
                    otherGraph.classList.add("hidden");
                });

                element.classList.remove("hidden");
            });
        }
    });
}
let previousFileTree;
function buildFileTree(projectStructure) {
    // Build file tree on the left
    const fileTree = new FileTree(
        document.getElementById("file-tree-files"),
        document.getElementById("search-file"),
        {
            resetSearch: document.getElementById("preset-all"),
            headers: document.getElementById("preset-headers"),
            sources: document.getElementById("preset-sources"),
        },
        [
            document.getElementById("display-option"),
            document.getElementById("include-option"),
            document.getElementById("dependency-direction-option"),
            document.getElementById("highlight-option"),
            document.getElementById("show-external")
        ], previousFileTree);

    fileTree.update(projectStructure, previousFileTree);
    previousFileTree = fileTree;
    return fileTree;
}

function buildAllParents(files, allFilesById, recursive) {
    let fileCount = files.length;

    // For each selected file
    for (let i = 0; i < fileCount; i++) {
        const selectedFile = files[i];

        // For each included file of the selected file
        for (let j = 0; j < selectedFile.includes.length; j++) {
            const includedFileId = selectedFile.includes[j];
            const includedFile = allFilesById[includedFileId];

            if (includedFile) {
                if (!files.includes(includedFile)) {
                    files.push(includedFile);

                    // File count is "frozen" and so we do not go further than the original array
                    if (recursive) {
                        fileCount++;
                    }
                }
            } // else: this is a external file, they will be chcked later
        }
    }
}

function buildAllChildren(files, allFilesById, recursive) {
    let fileCount = files.length;

    // For each selected file
    for (let i = 0; i < fileCount; i++) {
        const selectedFile = files[i];
        for (const fileId in allFilesById) {
            const file = allFilesById[fileId];

            // If selected file is a parent of the file
            if (file.includes.includes(selectedFile.id) && !files.includes(file)) {
                files.push(file);

                // File count is "frozen" and so we do not go further than the original array
                if (recursive) {
                    fileCount++;
                }
            }
        }
    }
}

function addIncludedFiles(files, allFilesById, recursive, direction) {
    let resultFiles = [];
    const parents = Array.from(files);
    const children = Array.from(files);

    if (direction === "includes" || direction === "both-direction") {
        buildAllParents(parents, allFilesById, recursive);
    }

    if (direction === "included-by" || direction === "both-direction") {
        buildAllChildren(children, allFilesById, recursive);
    }

    resultFiles = parents;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (!resultFiles.includes(child)) {
            resultFiles.push(child);
        }
    }

    return { resultFiles, children, parents };
}

// Build everything needed to display graphs
// Good luck to anyone trying to understand something here, it's the worse code I've ever written
function getGraphParams(selectedFiles, projectStructure) {
    const includeOption = document.getElementById("include-option").value;
    const includeDirection = document.getElementById("dependency-direction-option").value;
    const displayOption = document.getElementById("display-option").value;
    const highlightOption = document.getElementById("highlight-option").value;
    const showExternalLibrary = document.getElementById("show-external").checked;

    let files = selectedFiles;
    let parents = [];

    const allFilesById = {};
    // Create a map for faster look up
    for (let i = 0; i < projectStructure.files.length; i++) {
        const file = projectStructure.files[i];
        allFilesById[file.id] = file;
    }

    // Once we have all "base" files, add all included files (children / parent)
    switch (includeOption) {
        case "recursively-included":
        case "directly-included":
            let includedFiles = addIncludedFiles(files, allFilesById, includeOption === "recursively-included", includeDirection);
            files = includedFiles.resultFiles;
            parents = includedFiles.parents;
            break;
        case "hide-included":
            // Not caring about included files => not adding them to the file list
            break;
    }

    // We also need to include external libraries as "fake" files
    // Includes will never be displayed when selecting children display
    // Because external libraries never includes our files
    if (showExternalLibrary && includeOption !== "hide-included" && includeDirection !== "included-by") {
        const processedExternals = []; // Avoid duplicates

        // Pick either only the selected files or all parents files depending on what was selected
        let filesToHandle = selectedFiles;
        if (includeOption === "recursively-included") {
            filesToHandle = parents;
        }

        for (let i = 0; i < filesToHandle.length; i++) {
            const file = filesToHandle[i];
            for (let j = 0; j < file.includes.length; j++) {
                const includedId = file.includes[j];
                if (projectStructure.externalIds.includes(includedId) && !processedExternals.includes(includedId)) {
                    processedExternals.push(includedId);
                    files.push({
                        id: includedId,
                        name: includedId,
                        external: true,
                        includesForGraph: [], // will stay empty
                        highlightsForGraph: [],
                        type: "external",
                        path: [],
                        includes: []
                    });
                }
            }
        }
    }

    // Compute includesForGraph and highlightsForGraph
    // One day we will think about what we want to do at the start and rewrite this
    // One day
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        file.includesForGraph = [];
        file.highlightsForGraph = [];

        // For each file included by this file
        for (let j = 0; j < file.includes.length; j++) {
            const includeId = file.includes[j];

            // If it's in the file list with add it
            for (let k = 0; k < files.length; k++) {
                const file2 = files[k];
                if (includeId === file2.id) {
                    file.includesForGraph.push(file2.id);
                }
            }
        }
    }

    // TODO: Do not force rebuilding graph to update this?
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (highlightOption === "includes" || highlightOption === "both-direction") {
            buildParentHighlight(file, files);
        }
        if (highlightOption === "included-by" || highlightOption === "both-direction") {
            buildChildrenHighlight(file, files);
        }
    }

    return {
        selectedFiles: files,
        projectStructure,
        hoveredAction: displayOption
    };
}

function buildParentHighlight(file, allFiles, exploredFiles = []) {
    if (exploredFiles.includes(file.id)) {
        return file.highlightsForGraph;
    }

    exploredFiles.push(file.id);

    // For each file included by the file
    for (let i = 0; i < file.includesForGraph.length; i++) {
        const includeId = file.includesForGraph[i];

        // Find the included file
        for (let j = 0; j < allFiles.length; j++) {
            const fileToHighlight = allFiles[j];
            if (fileToHighlight.id === includeId) {
                // Selected file exists, we add it to the list of files
                if (!file.highlightsForGraph.includes(fileToHighlight.id)) {
                    file.highlightsForGraph.push(fileToHighlight.id);
                }

                const parentHighlights = buildParentHighlight(fileToHighlight, allFiles, exploredFiles);
                for (let j = 0; j < parentHighlights.length; j++) {
                    if (!file.highlightsForGraph.includes(parentHighlights[j])) {
                        file.highlightsForGraph.push(parentHighlights[j]);
                    }
                }
            }
        }
    }

    // We also highlight the hovered file
    if (!file.highlightsForGraph.includes(file.id)) {
        file.highlightsForGraph.push(file.id);
    }

    return file.highlightsForGraph;
}

function buildChildrenHighlight(file, allFiles, exploredFiles = []) {
    if (exploredFiles.includes(file.id)) {
        return file.highlightsForGraph;
    }

    exploredFiles.push(file.id);

    for (let i = 0; i < allFiles.length; i++) {
        const childFile = allFiles[i];
        for (let j = 0; j < childFile.includesForGraph.length; j++) {
            const childIncludeId = childFile.includesForGraph[j];
            if (file.id === childIncludeId) {
                if (!file.highlightsForGraph.includes(childIncludeId)) {
                    file.highlightsForGraph.push(childIncludeId);
                }

                const childrenHighlight = buildChildrenHighlight(childFile, allFiles, exploredFiles);
                for (let j = 0; j < childrenHighlight.length; j++) {
                    if (!file.highlightsForGraph.includes(childrenHighlight[j])) {
                        file.highlightsForGraph.push(childrenHighlight[j]);
                    }
                }
            }
        }

    }
    // We also highlight the hovered file
    file.highlightsForGraph.push(file.id);

    return file.highlightsForGraph;
}

let previousEvent;

function loadProject() {
    // Load project structure
    const projectStructureLoader = new ProjectStructureLoader((projectStructure) => {
        if (previousEvent) {
            removeEventListener(previousEvent);
        }

        // When file tree is updated, rebuild graph
        previousEvent = addEventListener("treeSelectionEvent", (e) => {
            let selectedFiles = [];
            if (e.detail && e.detail.files.length > 0) {
                selectedFiles = e.detail.files;
            } else {
                selectedFiles = projectStructure.files;
            }

            rebuildGraphs(selectedFiles, projectStructure);
        });

        // This emits a treeSelectionEvent
        buildFileTree(projectStructure);
    });

    // Open folder query as soon as app start
    projectStructureLoader.pickFile();
    // Comment the line above and uncomment the line below to instantly open project on start
    // projectStructureLoader.openDirectory("demo-cpp-project");
}

function rebuildGraphs(selectedFiles, projectStructure) {
    let graphParams = getGraphParams(selectedFiles, projectStructure);
    // Remove old graphs
    for (let i = 0; i < graphs.length; i++) {
        const graph = graphs[i];
        document.querySelector(graph.selector).innerHTML = "";
        const graphInstance = new graph.class(graph.selector);
        graphInstance.createOrUpdateGraph(graphParams);
    }
}