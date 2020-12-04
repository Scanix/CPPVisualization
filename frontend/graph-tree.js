const d3 = require("d3")

export default class ChordGraph {
    width = 300
    height = 300
    svg

    constructor() {}

    createGraph(svgClass, filesData) {
        const nameList = [] // Really bad but flemme
        const nodes = []
        const links = []

        filesData.forEach((e) => {
            nodes.push({
                id: e.id,
                group: e.id.includes('.cpp') ? 1 : 2,
            })

            nameList.push(e.id)
        })

        filesData.forEach((e) => {
            e.includes.forEach((i) => {
                links.push({
                    source: e.id,
                    target: i,
                    value: e.includes.length + 1,
                })

                if (!nameList.includes(i)) {
                    nameList.push(i)
                    nodes.push({
                        id: i,
                        group: 1,
                    })
                }
            })
        })

        let svg = d3.select(svgClass)
            .attr("viewBox", [0, 0, this.width, this.height])

        let zoomPart = svg.append("g")

        const zoom = d3.zoom().on("zoom", e => {
            zoomPart.attr("transform", (e.transform));
        })

        d3.select(svgClass)
            .call(zoom)

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(this.width / 2, this.height / 2))

        const link = zoomPart.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-this.width", d => Math.sqrt(d.value))

        const node = zoomPart.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-this.width", 1.5)
            .selectAll("rect")
            .data(nodes)
            .join("rect")
            .attr("width", 5)
            .attr("height", 5)
            .attr("stroke", (d) => {
                return d.group === 1 ? 'red' : 'blue'
            })
            .attr("fill", (d) => {
                return d.group === 1 ? 'red' : 'blue'
            })
            .call((simulation) => {
                function dragstarted(event) {
                    if (!event.active) simulation.alphaTarget(0.3).restart()
                    event.subject.fx = event.subject.x
                    event.subject.fy = event.subject.y
                }

                function dragged(event) {
                    event.subject.fx = event.x
                    event.subject.fy = event.y
                }

                function dragended(event) {
                    if (!event.active) simulation.alphaTarget(0)
                    event.subject.fx = null
                    event.subject.fy = null
                }

                return d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended)
            })

        node.append("title")
            .text(d => d.id)

        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y)

            node
                .attr("x", d => d.x - 2.5)
                .attr("y", d => d.y - 2.5)
        })
    }
}