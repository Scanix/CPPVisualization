import ProjectStructureLoader from './project-structure-loader.js';

export default function selectFile() {
	
	var projectStructureLoader = new ProjectStructureLoader((json) => {
   
	// Do whatever with json file
    console.log(json);});
	
	projectStructureLoader.pickFile();
}