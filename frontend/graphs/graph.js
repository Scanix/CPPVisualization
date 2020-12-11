const d3 = require("d3")

export default class Graph {
    width = 650
    height = 650

    constructor(svgClass) {
        this._svgClass = svgClass;
        this._svg = d3.select(svgClass).attr("viewBox", [0, 0, this.width, this.height]);
    }

    /**
     * 
     * @param {array} selectedFiles Contains all files and include that should be displayed
     * @param {object} projectStructure Contains all info of the project
     * @param {string} hoveredAction "highlight-selected" or "hide-others"
     */
    createOrUpdateGraph({ selectedFiles, projectStructure, hoveredAction }) {
        console.log("override createOrUpdateGraph to generate graph");
    }

    _getColorFromType(type) {
        const colors = {
            "source": "white",
            "header": "white",
        };

        return colors[type] || "#000000";
    }

    _getBackgroundColorFromType(type) {
        const colors = {
            "header": "#4080CE",
            "source": "#EE6020",
        };

        return colors[type] || "#AAAAAA";
    }
}