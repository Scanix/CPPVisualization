import ProjectStructureLoader from './project-structure-loader.js';

const projectStructureLoader = new ProjectStructureLoader((json) => {
    // Do whatever with json file
    console.log(json);
});

// Add events
document.getElementById("browse-project").addEventListener("click", projectStructureLoader.pickFile);
