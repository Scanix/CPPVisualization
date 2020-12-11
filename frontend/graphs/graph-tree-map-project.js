const d3 = require("d3")
import Graph from "./graph.js"
import DOMuid from "./uid.js"

export default class GraphTreeMap extends Graph {
    _hrefFromId(id) {
        let href = new URL(`#${id}`, location) + "";
        return "url(" + href + ")";
    }

    /**
     * 
     * @param {array} selectedFiles Contains all files and include that should be displayed
     * @param {object} projectStructure Contains all info of the project
     * @param {string} hoveredAction "highlight-selected" or "hide-others"
     */
    createOrUpdateGraph({ selectedFiles, projectStructure, hoveredAction, fileTree }) {
        const data = { name: "Project Root", children: [] };
        this._totalLineCount = 0;
        this._maxLineCount = 0;
        this._buildData(fileTree, data, selectedFiles);

        let treemap = data => d3.treemap()
            .size([this.width, this.height])
            .round(true)
            (d3.hierarchy(data)
                .sum(d => d.value)
                .sort((a, b) => b.value - a.value))

        let format = d3.format(",d")
        let color = d3.scaleSequential([8, 0], d3.interpolateMagma)

        const root = treemap(data);

        this._svg.style("font", "10px sans-serif");

        const shadow = DOMuid("shadow");

        this._svg.append("filter")
            .attr("id", shadow.id)
            .append("feDropShadow")
            .attr("flood-opacity", 0.3)
            .attr("dx", 0)
            .attr("stdDeviation", 3);

        const node = this._svg.selectAll("g")
            .data(d3.group(root, d => d.width))
            .join("g")
            .attr("filter", shadow)
            .selectAll("g")
            .data(d => d[1])
            .join("g")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        node.append("title")
            .text(d => `${d.ancestors().reverse().map(d => d.data.name).join("/")}\n${format(d.value)}`);

        node.append("rect")
            .attr("id", d => (d.nodeUid = DOMuid("node")).id)
            .attr("fill", d => {
                if (!d.children) {
                    return d3.interpolateOrRd(d.value / (this._maxLineCount * 1.2));
                }
                else {
                    return d3.interpolateOrRd(d.value / (this._totalLineCount * 1.2));
                }
            }
            )
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0);

        node.append("clipPath")
            .attr("id", d => (d.clipUid = DOMuid("clip")).id)
            .append("use")
            .attr("xlink:href", d => d.nodeUid.href);

        node.append("text")
            .attr("clip-path", d => d.clipUid)
            .selectAll("tspan")
            .data(d => d.data.name.split(/\s/g).concat(format(d.value)))
            .join("tspan")
            .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
            .text(d => d);

        node.filter(d => d.children).selectAll("tspan")
            .attr("dx", 3)
            .attr("y", 13);

        node.filter(d => !d.children).selectAll("tspan")
            .attr("x", 3)
            .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`);
    }

    _buildData(currentFolder, resultData, selectedFiles, depth = 0) {
        for (const fileName in currentFolder.files) {
            const file = currentFolder.files[fileName];

            // Do not add files that are not selected
            for (let i = 0; i < selectedFiles.length; i++) {
                const selectedFile = selectedFiles[i];
                if (file.id === selectedFile.id) {
                    resultData.children.push({ name: fileName, value: file.stats.lineCount });
                    this._totalLineCount += file.stats.lineCount;
                    if (file.stats.lineCount > this._maxLineCount) {
                        this._maxLineCount = file.stats.lineCount;
                    }
                    break;
                }
            }
        }

        for (const folderName in currentFolder.folders) {
            const folder = currentFolder.folders[folderName];
            const newChild = { name: folderName, children: []};
            resultData.children.push(newChild);
            this._buildData(folder, newChild, selectedFiles, depth + 1);
        }
    }
}