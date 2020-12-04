import FileTree from "./file-tree.js";
import ChordGraph from "./ChordGraph.js";
import GraphGraph from "./GraphGraph.js";
import ProjectStructureLoader from "./project-structure-loader.js";
const tempJson = require("../backend/demo-structure.json");

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

    let chord = new ChordGraph('svg.d3-chord', json.files);
    let graph = new GraphGraph();

    chord.createGraph();
    graph.createGraph('svg.d3-graph', json.files);

    addEventListener("treeSelectionEvent", (e) => {
        let files = [];
        if (e.detail) {
            files = e.detail.files;
        } else {
            files = json.files;
        }

        document.querySelector('svg.d3-chord').innerHTML = "";
        document.querySelector('svg.d3-graph').innerHTML = "";

        chord = new ChordGraph('svg.d3-chord', files);
        graph = new GraphGraph();

        chord.createGraph();
        graph.createGraph('svg.d3-graph', files);
    });
});

// Open folder query as soon as app start
projectStructureLoader.pickFile();