const d3 = require("d3")

module.exports = class ChordGraph {
    width = 500;
    height = 500;

    constructor(svgClass, filesData) {
        this.svgClass = svgClass
        this.data = Array.from(d3.rollup(filesData
                .flatMap(({
                    id: source,
                    includes
                }) => includes.map(target => [source, target])),
                ({
                    0: [source, target],
                    length: value
                }) => ({
                    source,
                    target,
                    value
                }), link => link.join())
            .values())

        this.names = Array.from(new Set(this.data.flatMap(d => [d.source, d.target]))).sort(d3.ascending)

        this.innerRadius = Math.min(this.width, this.height) * 0.5 - 90
        this.outerRadius = this.innerRadius + 10
        this.color = d3.scaleOrdinal(this.names, d3.quantize(d3.interpolateViridis, this.names.length))
        this.ribbon = d3.ribbonArrow()
            .radius(this.innerRadius - 1)
            .padAngle(1 / this.innerRadius)
        this.arc = d3.arc()
            .innerRadius(this.innerRadius)
            .outerRadius(this.outerRadius)
        this.chord = d3.chordDirected()
            .padAngle(10 / this.innerRadius)
            .sortSubgroups(d3.descending)
            .sortChords(d3.descending)
        this.matrix = () => {
            const index = new Map(this.names.map((name, i) => [name, i]))
            const matrix = Array.from(index, () => new Array(this.names.length).fill(0))
            for (const { source, target, value }
                of this.data) matrix[index.get(source)][index.get(target)] += value
            return matrix
        }

        this.chords = this.chord(this.matrix())
    }

    overedArc(event, d) {
        d3.select(this).attr("fill", "red");
        d3.selectAll(this.chords)
    }

    outedArc(event, d) {

    }

    fade(svgClass, opacity) {
        return function(g, i) {
            d3.select(svgClass).selectAll('.chord path')
                .filter(function(d) { return d.source.index != i.index && d.target.index != i.index; })
                .transition()
                .style("opacity", opacity);
        };
    }

    createGraph() {

        let svg = d3.select(this.svgClass)
            .attr("viewBox", [-this.width / 2, -this.height / 2, this.width, this.height])

        let zoomPart = svg.append("g")

        const zoom = d3.zoom().on("zoom", e => {
            zoomPart.attr("transform", (e.transform));
        })

        d3.select(this.svgClass)
            .call(zoom)

        const group = zoomPart.append("g")
            .attr("font-size", 10)
            .attr("font-family", "sans-serif")
            .selectAll("g")
            .data(this.chords.groups)
            .join("g")

        group.append("path")
            .attr("fill", d => this.color(this.names[d.index]))
            .attr("d", this.arc)
            .on("mouseover", this.fade(this.svgClass, .1))
            .on("mouseout", this.fade(this.svgClass, 1));


        group.append("text")
            .each(d => (d.angle = (d.startAngle + d.endAngle) / 2))
            .attr("dy", "0.35em")
            .attr("transform", d => `
                  rotate(${(d.angle * 180 / Math.PI - 90)})
                  translate(${this.outerRadius + 5})
                  ${d.angle > Math.PI ? "rotate(180)" : ""}
                `)
            .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
            .text(d => this.names[d.index])

        group.append("title")
            .text(d => `${this.names[d.index]}
            ${d3.sum(this.chords, c => (c.source.index === d.index) * c.source.value)} outgoing →
            ${d3.sum(this.chords, c => (c.target.index === d.index) * c.source.value)} incoming ←`)

        zoomPart.append("g")
            .attr("fill-opacity", 0.75)
            .attr("class", "chord")
            .selectAll("path")
            .data(this.chords)
            .join("path")
            .style("mix-blend-mode", "multiply")
            .attr("fill", d => this.color(this.names[d.target.index]))
            .attr("d", this.ribbon)
            .append("title")
            .text(d => `${this.names[d.source.index]} → ${this.names[d.target.index]} ${d.source.value}`)
    }
}