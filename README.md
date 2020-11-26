# CPPVisualization
Project to visualize dependencies inside a cpp project.

## Install/Launch
```
npm install
```
```
npm start
```

## Header / Footer loading

We use iframe to load them.

<iframe src="header.html" onload="this.before((this.contentDocument.body||this.contentDocument).children[0]);this.remove()"></iframe>

sources :
    * https://css-tricks.com/the-simplest-ways-to-handle-html-includes/
    * https://www.filamentgroup.com/lab/html-includes/
