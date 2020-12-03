const d3 = require("d3")
const rawData = require('../backend/demo-structure.json')
const width = 1080
const height = width

// Data works
const data = Array.from(d3.rollup(rawData.files
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

const names = Array.from(new Set(data.flatMap(d => [d.source, d.target]))).sort(d3.ascending)

const innerRadius = Math.min(width, height) * 0.5 - 90
const outerRadius = innerRadius + 10
const color = d3.scaleOrdinal(names, d3.quantize(d3.interpolateViridis, names.length))
const ribbon = d3.ribbonArrow()
    .radius(innerRadius - 1)
    .padAngle(1 / innerRadius)
const arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
const chord = d3.chordDirected()
    .padAngle(10 / innerRadius)
    .sortSubgroups(d3.descending)
    .sortChords(d3.descending)
const matrix = () => {
    const index = new Map(names.map((name, i) => [name, i]))
    const matrix = Array.from(index, () => new Array(names.length).fill(0))
    for (const { source, target, value }
        of data) matrix[index.get(source)][index.get(target)] += value
    return matrix
}

let svg = d3.select('svg.d3-chord')
    .attr("viewBox", [-width / 2, -height / 2, width, height])

let zoomPart = svg.append("g")

const zoom = d3.zoom().on("zoom", e => {
    zoomPart.attr("transform", (transform = e.transform));
})

d3.select('svg.d3-chord')
    .call(zoom)

const chords = chord(matrix())

const group = zoomPart.append("g")
    .attr("font-size", 10)
    .attr("font-family", "sans-serif")
    .selectAll("g")
    .data(chords.groups)
    .join("g")

group.append("path")
    .attr("fill", d => color(names[d.index]))
    .attr("d", arc)

group.append("text")
    .each(d => (d.angle = (d.startAngle + d.endAngle) / 2))
    .attr("dy", "0.35em")
    .attr("transform", d => `
      rotate(${(d.angle * 180 / Math.PI - 90)})
      translate(${outerRadius + 5})
      ${d.angle > Math.PI ? "rotate(180)" : ""}
    `)
    .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
    .text(d => names[d.index])

group.append("title")
    .text(d => `${names[d.index]}
${d3.sum(chords, c => (c.source.index === d.index) * c.source.value)} outgoing →
${d3.sum(chords, c => (c.target.index === d.index) * c.source.value)} incoming ←`)

zoomPart.append("g")
    .attr("fill-opacity", 0.75)
    .selectAll("path")
    .data(chords)
    .join("path")
    .style("mix-blend-mode", "multiply")
    .attr("fill", d => color(names[d.target.index]))
    .attr("d", ribbon)
    .append("title")
    .text(d => `${names[d.source.index]} → ${names[d.target.index]} ${d.source.value}`)