import FileTree from "./file-tree.js";
import ChordGraph from "./ChordGraph.js";
import GraphGraph from "./GraphGraph.js";
const tempJson = require("../backend/demo-structure.json");

const fileTree = new FileTree(document.getElementById("file-tree-files"));
fileTree.update(tempJson);

let chord = new ChordGraph('svg.d3-chord', tempJson.files);
let graph = new GraphGraph();

chord.createGraph();
graph.createGraph('svg.d3-graph', tempJson.files);