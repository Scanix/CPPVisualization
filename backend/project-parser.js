// TODO: Parse project files
const fs = require("fs");
const path = require("path");
const recurseReaddir = require("recursive-readdir");

function parseProject(projectPath, changedPath) {
    const jsonOutput = {
        meta: {},
        filesChanged: [],
        files: [],
        externalIds: []
    };

    return new Promise((resolve, reject) => {
        const parentFolderCount = projectPath.split(path.sep).length;

        recurseReaddir(projectPath, (err, files) => {
            // We do 2 passes, one that create basic information and one that parses details
            // This is done so we can search file names as order of files is not predictable
            for (let i = 0; i < files.length; i++) {
                const fullFilePathSplitted = files[i].split(path.sep); // Convert string path to array
                const filePath = fullFilePathSplitted.slice(parentFolderCount); // Remove entries which are parent of the project folder
                const folderPath = filePath.slice(0, filePath.length - 1); // Remove file name from path

                const fileName = fullFilePathSplitted.slice(-1)[0];
                const id = filePath.join("/");
                const type = getFileType(fileName);
                const stats = {};
                const calls = [];

                // Was this file changed?
                if (changedPath && files[i].includes(changedPath)) {
                    jsonOutput.filesChanged.push(id);
                }

                jsonOutput.files.push({
                    id,
                    type,
                    path: folderPath,
                    stats,
                    name: fileName,
                    calls
                });
            }

            for (let i = 0; i < files.length; i++) {
                const jsonFile = jsonOutput.files[i];
                const fileContent = fs.readFileSync(files[i], "utf8");
                const parsedFile = parseFile(fileContent, jsonOutput.files);

                jsonFile.stats.lineCount = parsedFile.stats.lineCount;
                jsonFile.includes = parsedFile.includes;
                jsonFile.externalIncludes = parsedFile.externals;
                jsonOutput.externalIds = jsonOutput.externalIds.concat(parsedFile.externals);
            }

            jsonOutput.externalIds = [... new Set(jsonOutput.externalIds)];

            resolve(jsonOutput);
        });
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
            return "";
        default:
            return extension;
    }
}

function parseFile(fileContent, files) {
    const lines = fileContent.replace(/\r/g, "").split("\n");
    const { includes, externals } = parseIncludes(fileContent, files);

    // Function parsing requires more than regex as we can't count parenthesis, this could be done in a better way someday
    // The following regex could be used to identify function position and then use basic state machine to find matching parenthesis
    // const functionRegex = /([a-zA-Z_][a-zA-Z_0-9.->]+)(\.|->)([a-zA-Z_][a-zA-Z_0-9]+)\(/gm;

    return {
        stats: {
            lineCount: lines.length
        },
        includes,
        externals
    };
}

function parseIncludes(fileContent, files) {
    // Very rough line parsing, could be improved by doing actual parsing and using a syntax tree but it would take a lot of time
    const includeRegex = /^\s*#\s*include\s*[<"](.+)[>"]\s*/gm;
    const matches = fileContent.matchAll(includeRegex);
    const includes = [];
    const externals = [];

    for (const match of matches) {
        let matchFound = false;

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
            // TODO: Add a flag to tell that the library is not set?
            includes.push(match[1]);
            externals.push(match[1]);
        }
    }

    return { includes, externals };
}

module.exports.parseProject = parseProject;