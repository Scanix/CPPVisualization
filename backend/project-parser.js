// TODO: Parse project files
const fs = require("fs");
const path = require("path");
const { exit } = require("process");
const recurseReaddir = require("recursive-readdir");

function parseProject() {
    const jsonOutput = {
        meta: {},
        filesChanged: [],
        files: []
    };

    // Save tree of files to access it faster. Files is an object and we have its id as a value for easy lookup
    // NOTE: Code related to file tree is currently not used at is it not required
    const fileTree = { files: {} };

    recurseReaddir("demo-cpp-project", (err, files) => {
        // We do 2 passes, one that create basic information and one that parses details
        // This is done so we can search file names as order of files is not predictable
        for (let i = 0; i < files.length; i++) {
            const fullFilePathSplitted = files[i].split(path.sep); // Convert string path to array
            const filePath = fullFilePathSplitted.slice(1); // Remove first entry which is the name of the folder of the project
            const folderPath = filePath.slice(0, filePath.length - 1); // Remove file name from path

            const fileName = fullFilePathSplitted.slice(-1)[0];
            const id = filePath.join("/");
            const type = getFileType(fileName);
            const stats = {};
            const variables = [];

            // Build file tree
            if (folderPath.length === 0) {
                // root
                fileTree.files[fileName] = id;
            }
            else {
                if (!fileTree[folderPath[0]]) {
                    fileTree[folderPath[0]] = { files: {} };
                }

                let currentFolder = fileTree[folderPath[0]];

                // Create folder structure
                for (let j = 1; j < folderPath.length; j++) {
                    const folderName = folderPath[j];
                    if (!currentFolder[folderName]) {
                        currentFolder[folderName] = { files: {} };
                    }

                    currentFolder = currentFolder[folderName];
                }

                // Found last folder, "append" file
                currentFolder.files[fileName] = id;
            }

            jsonOutput.files.push({
                id,
                type,
                path: folderPath,
                stats,
                fileName,
                variables
            });
        }

        for (let i = 0; i < files.length; i++) {
            const jsonFile = jsonOutput.files[i];
            const fileContent = fs.readFileSync(files[i], "utf8");
            const parsedFile = parseFile(fileContent, jsonOutput.files);

            jsonFile.stats.lineCount = parsedFile.stats.lineCount;
            jsonFile.includes = parsedFile.includes;
        }


        console.log(jsonOutput.files);
    });

}

function getFileType(fileName) {
    const extension = fileName.split(".")[1];
    switch (extension) {
        case "cpp":
            return "source";
        case "h":
            return "header";
        case undefined:
            return null;
        default:
            return extension;
    }
}

function parseFile(fileContent, files) {
    const lines = fileContent.replace(/\r/g, "").split("\n");
    const includes = parseIncludes(fileContent, files);

    // Function parsing requires more than regex as we can't count parenthesis, this could be done in a better way someday
    // const functionRegex = /([a-zA-Z_][a-zA-Z_0-9.->]+)(\.|->)([a-zA-Z_][a-zA-Z_0-9]+)\(/gm;

    return {
        stats: {
            lineCount: lines.length
        },
        includes
    };
}

function parseIncludes(fileContent, files) {
    // Very rough line parsing, could be improved by doing actual parsing and using a syntax tree but it would take a lot of time
    const includeRegex = /#include\s[<"](.+)[>"]/gm;
    const matches = fileContent.matchAll(includeRegex);
    const includes = [];

    for (const match of matches) {
        let matchFound = false;

        // console.log(match[1]);
        for (let i = 0; i < files.length; i++) {
            const fileId = files[i].id;
            if (fileId.includes(match[1])) {
                matchFound = true;
                includes.push(fileId);
                break;
            }
        }

        if (!matchFound) {
            // External library / cannot find match
            includes.push(match[1]);
        }
    }

    return includes;
}

parseProject();