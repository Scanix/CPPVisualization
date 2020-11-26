const d3 = require("d3")
const data = require('../backend/demo-structure.json')
const testData = [5, 10, 12]
const scaleFactor = 10
const barHeight = 20

const test = d3.mean(data.files, f => f.stats.lineCount)
console.log(test)

let svg = d3.select('svg.d3')

let bar = svg.selectAll('g')
    .data(testData)
    .enter()
    .append('g')
    .attr("transform", function (d, i) {
        return "translate(0," + i * barHeight + ")";
    });

bar.append("rect")
    .attr("width", function (d) {
        return d * scaleFactor;
    })
    .attr("height", barHeight - 1);

bar.append("text")
    .attr("x", function (d) { return (d * scaleFactor); })
    .attr("y", barHeight / 2)
    .attr("dy", ".35em")
    .text(function (d) { return d; });