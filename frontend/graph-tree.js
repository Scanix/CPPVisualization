const d3 = require("d3")

export default class GraphTree {
    width = 300
    height = 300

    constructor() { }

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

    _getRectangleWidth(d) {
        return d.name.length * 9;
    }


    _fade(svgClass, opacity) {
        return (event, d) => {
            const includes = this._buildIncludes(d.file, false);
            includes.push(d.id);

            d3.select(svgClass)
                .selectAll('g')
                .filter((d) => {
                    if (d && d.id) {
                        return !includes.includes(d.id);
                    }
                    else {
                        return false;
                    }
                })
                .transition().style("opacity", opacity)

            d3.select(svgClass)
                .selectAll('line')
                .filter((d) => {
                    if (d && d.source && d.target) {
                        return !includes.includes(d.source.id) || !includes.includes(d.target.id);
                    }
                    else {
                        return false;
                    }
                })
                .transition().style("opacity", opacity)
        };
    }

    _buildIncludes(file, recursive = true) {
        // Add all file includes
        let includes = [];

        if (recursive) {
            // Find includes of parents
            for (let i = 0; i < file.includes.length; i++) {
                const includedId = file.includes[i];
                includes.push(includedId);

                for (let j = 0; j < this._jsonData.length; j++) {
                    const fileData = this._jsonData[j];
                    if (fileData.id === includedId) {
                        includes = includes.concat(this._buildIncludes(fileData, true));
                    }
                }
            }
        }
        else {
            includes = file.includes;
        }

        return includes;
    }

    createGraph(svgClass, filteredFilesData, jsonData) {
        const nodes = [];
        const links = [];
        const fileIds = [];

        this._jsonData = jsonData;

        // Build nodes and links
        filteredFilesData.forEach((fileData) => {
            nodes.push({
                id: fileData.id,
                name: fileData.name,
                file: fileData
            });

            fileIds.push(fileData.id);

            fileData.includes.forEach((includeId) => {
                links.push({
                    source: includeId,
                    target: fileData.id
                });
            });
        });

        // Create nodes for external libraries
        links.forEach((link) => {
            // Node is not already created
            if (!fileIds.includes(link.source)) {
                fileIds.push(link.source);
                nodes.push({
                    id: link.source,
                    name: link.source,
                    file: {
                        type: "external",
                        includes: [],
                        external: true
                    }
                });
            }
        });

        const svg = d3.select(svgClass).attr("viewBox", [0, 0, this.width, this.height]);
        const zoomArea = svg.append("g");

        // https://observablehq.com/@harrylove/draw-an-arrowhead-marker-connected-to-a-line-in-d3
        const arrowSize = 10;
        const markerBoxWidth = arrowSize;
        const markerBoxHeight = arrowSize;
        const refX = 20;
        const refY = arrowSize / 2;

        const arrowPoints = [[0, 0], [0, arrowSize], [arrowSize, arrowSize / 2]];

        svg
            .append('defs')
            .append('marker')
            .attr('id', 'arrow')
            .attr('viewBox', [0, 0, markerBoxWidth, markerBoxHeight])
            .attr('refX', refX)
            .attr('refY', refY)
            .attr('markerWidth', markerBoxWidth)
            .attr('markerHeight', markerBoxHeight)
            .attr('orient', 'auto-start-reverse')
            .append('path')
            .attr('d', d3.line()(arrowPoints))
            .attr('fill', '#999');

        const zoom = d3.zoom().on("zoom", e => {
            zoomArea.attr("transform", (e.transform));
        })

        d3.select(svgClass).call(zoom);

        // Initialize the links
        const link = zoomArea.append("g")
            .attr("stroke", "#999")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr('marker-end', 'url(#arrow)')
            .attr("stroke-this.width", d => Math.sqrt(d.value))


        // Nodes
        const node = zoomArea
            .selectAll("circle")
            .data(nodes)
            .enter().append("g");

        node.append("circle")
            .attr("fill", (d) => this._getBackgroundColorFromType(d.file.type))
            .attr("r", 10)
            .attr("cx", 5)
            .on("mouseover", this._fade(svgClass, .1))
            .on("mouseout", this._fade(svgClass, 1))
            .attr("cy", 5)
            .on("click", (event, d) => {
                console.log(d);
            });

        node.append("text")
            .attr("fill", "black")
            .attr("y", 30)
            .attr("x", 5)
            .style("text-anchor", "middle")
            .text(d => d.name)

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink()
                .id(d => d.id)
                .links(links)
            )
            .force("charge", d3.forceManyBody().strength(-1000))
            .force("yPosition", d3.forceY((d) => { return { source: 200, header: -200, external: -400 }[d.file.type] || 0 }))
            .force("xPosition", d3.forceX((d) => { return { external: -100 }[d.file.type] || 0 }))
            //   .force("xPosition", d3.forceY((d) => 100))
            .force("center", d3.forceCenter(this.width / 2, this.height / 2))

        simulation.on("tick", () => {
            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y)

            node.attr("transform", d => `translate(${d.x - 5}, ${d.y - 5})`)
        });
    }
}