const rawData = require('../backend/demo-structure.json');
const ChordGraph = require('./ChordGraph');
const GraphGraph = require('./GraphGraph');

let chord = new ChordGraph();
let graph = new GraphGraph();

chord.createGraph('svg.d3-chord', rawData.files);
graph.createGraph('svg.d3-graph', rawData.files);