const d3 = require("d3")
import Graph from "./graph.js"

export default class GraphTreeMap extends Graph {

    /**
     * 
     * @param {array} selectedFiles Contains all files and include that should be displayed
     * @param {object} projectStructure Contains all info of the project
     * @param {string} hoveredAction "highlight-selected" or "hide-others"
     */
    createOrUpdateGraph({ selectedFiles, projectStructure, hoveredAction }) {
        // TODO: Create graph here
        // To build includes you need to use includesForGraph and highlightsForGraph. "includes" should not be used here
        // Using that makes the graph automatically work with the file tree
        console.log(selectedFiles);

        // svg is already defined in parent:
        // this._svg.append(...);
    }
}