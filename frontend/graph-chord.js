const d3 = require("d3")

export default class ChordGraph {
    width = 500;
    height = 500;

    constructor(svgClass, filesData) {
        this.svgClass = svgClass

        // Convert our data to something d3 can understand (this depends on the graph used)
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
            .values());

        let sorter = require('path-sort').standalone('/');
        this.names = Array.from(new Set(this.data.flatMap(d => [d.source, d.target]))).sort(sorter);

        this.innerRadius = Math.min(this.width, this.height) * 0.5 - 90
        this.outerRadius = this.innerRadius + 10
        this.color = d3.scaleOrdinal(this.names, d3.quantize(d3.interpolateRainbow, this.names.length))

        // Setup graph
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
                of this.data) matrix[index.get(target)][index.get(source)] += value
            return matrix
        }

        this.chords = this.chord(this.matrix())
    }

    fade(svgClass, opacity) {
        return function(g, i) {
            let sources = [];

            d3.select(svgClass).selectAll('.chord path')
                .filter(function(d) {
                    let result = d.source.index != i.index && d.target.index != i.index;
                    if (!result) {
                        sources.push(d.source.index);
                        sources.push(d.target.index);
                    }
                    return result;
                })
                .transition()
                .style("opacity", opacity);

            d3.select(svgClass).selectAll('.group path')
                .filter(function(d) { return d.index != i.index && !sources.includes(d.index) })
                .select(function() { return this.parentNode; })
                .transition()
                .style("opacity", opacity);
        };
    }

    getFilename(path) {
        let arr = path.split('/');
        return arr[arr.length - 1];
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
            .attr("class", "group")
            .selectAll("g")
            .data(this.chords.groups)
            .join("g")
            .on("mouseover", this.fade(this.svgClass, .1))
            .on("mouseout", this.fade(this.svgClass, 1));

        group.append("path")
            .attr("fill", d => this.color(this.names[d.index]))
            .attr("d", this.arc);


        group.append("text")
            .each(d => (d.angle = (d.startAngle + d.endAngle) / 2))
            .attr("dy", "0.35em")
            .attr("transform", d => `
                  rotate(${(d.angle * 180 / Math.PI - 90)})
                  translate(${this.outerRadius + 5})
                  ${d.angle > Math.PI ? "rotate(180)" : ""}
                `)
            .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
            .text(d => this.getFilename(this.names[d.index]))

        group.append("title")
            .text(d => `${this.names[d.index]}
            included in ${d3.sum(this.chords, c => (c.source.index === d.index) * c.source.value)} →
            ${d3.sum(this.chords, c => (c.target.index === d.index) * c.source.value)} includes ←`)

        zoomPart.append("g")
            .attr("fill-opacity", 0.75)
            .attr("class", "chord")
            .selectAll("path")
            .data(this.chords)
            .join("path")
            .style("mix-blend-mode", "multiply")
            .attr("fill", d => this.color(this.names[d.source.index]))
            .attr("d", this.ribbon)
            .append("title")
            .text(d => `${this.names[d.source.index]} → ${this.names[d.target.index]} ${d.source.value}`)
    }
}