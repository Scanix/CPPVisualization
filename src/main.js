import FileTree from "./file-tree.js";
const tempJson = require("../backend/demo-structure.json");

const fileTree = new FileTree(document.getElementById("file-tree-files"));
fileTree.update(tempJson);