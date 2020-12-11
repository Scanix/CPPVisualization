const d3 = require("d3")
import Graph from "./graph.js"

export default class GraphTree extends Graph {
    _fade(svgClass, opacity) {
        return (event, d) => {
            const hoveredFile = d.file;
            d3.select(svgClass)
                .selectAll('g')
                .filter((d) => {
                    if (d && d.id) {
                        return !hoveredFile.highlightsForGraph.includes(d.id);
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
                        return !hoveredFile.highlightsForGraph.includes(d.source.id) || !hoveredFile.highlightsForGraph.includes(d.target.id);
                    }
                    else {
                        return false;
                    }
                })
                .transition().style("opacity", opacity)
        };
    }


    createOrUpdateGraph({ selectedFiles, projectStructure, hoveredAction, hoveredLinkDirection }) {
        const nodes = [];
        const links = [];
        const fileIds = [];

        this._jsonData = projectStructure;

        // Build nodes and links
        selectedFiles.forEach((fileData) => {
            nodes.push({
                id: fileData.id,
                name: fileData.name,
                file: fileData
            });

            fileIds.push(fileData.id);

            fileData.includesForGraph.forEach((includeId) => {
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

        const zoomArea = this._svg.append("g");

        // https://observablehq.com/@harrylove/draw-an-arrowhead-marker-connected-to-a-line-in-d3
        const arrowSize = 10;
        const markerBoxWidth = arrowSize;
        const markerBoxHeight = arrowSize;
        const refX = 20;
        const refY = arrowSize / 2;

        const arrowPoints = [[0, 0], [0, arrowSize], [arrowSize, arrowSize / 2]];

        this._svg
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
            .attr('fill', '#555');

        const zoom = d3.zoom().on("zoom", e => {
            zoomArea.attr("transform", (e.transform));
        })

        d3.select(this._svgClass).call(zoom);
        d3.select(this._svgClass).call(zoom.transform, d3.zoomIdentity.scale(1));

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
            .on("mouseover", this._fade(this._svgClass, .1))
            .on("mouseout", this._fade(this._svgClass, 1))
            .attr("cy", 5)
            .call(d3.drag().container(zoomArea).on("start", (e) => {
                // if (!e.active) simulation.alphaTarget(0.1).restart();
            }).on("drag", (e, d) => {
                d.fx = e.x;
                d.fy = e.y;
                simulation.restart();
            }).on("end", (e, d) => {
                // if (!e.active) simulation.alphaTarget(0.0);
            }))

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
            .force("charge", d3.forceManyBody().strength((d) => {
                return Math.min(-500, d.file.name.length * -70);
            }))
            .force("yPosition", d3.forceY((d) => { return { source: 300, header: -300, external: -300 }[d.file.type] || 0 }))
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