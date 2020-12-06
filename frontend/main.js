import FileTree from "./file-tree.js";
import GraphChord from "./graph-chord.js";
import GraphTree from "./graph-tree.js";
import ProjectStructureLoader from "./project-structure-loader.js";
const tempJson = require("../backend/demo-structure.json");

const graphContainer = document.getElementById("graphs-container");
const graphListTarget = document.querySelector("body > nav > p");

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

        console.log(element.dataset.graphName);
    }
});

const projectStructureLoader = new ProjectStructureLoader((json) => {
    const fileTree = new FileTree(
        document.getElementById("file-tree-files"),
        document.getElementById("search-file"), {
            resetSearch: document.getElementById("preset-all"),
            headers: document.getElementById("preset-headers"),
            sources: document.getElementById("preset-sources"),
        }
    );
    fileTree.update(json);

    let chord = new GraphChord('svg.d3-chord', json.files);
    let graph = new GraphTree();

    chord.createGraph();
    graph.createGraph('svg.d3-tree', json.files);

    addEventListener("treeSelectionEvent", (e) => {
        let files = [];
        if (e.detail) {
            files = e.detail.files;
        } else {
            files = json.files;
        }

        document.querySelector('svg.d3-chord').innerHTML = "";
        document.querySelector('svg.d3-tree').innerHTML = "";

        chord = new GraphChord('svg.d3-chord', files);
        graph = new GraphTree();

        chord.createGraph();
        graph.createGraph('svg.d3-tree', files);
    });
});

// Open folder query as soon as app start
projectStructureLoader.pickFile();
// Comment the line above and uncomment the line below to instantly open project on start
// projectStructureLoader.openDirectory("demo-cpp-project");