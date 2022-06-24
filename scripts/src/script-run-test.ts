import { discoverTestScripts } from "./test-discovery.js";
import { runTests } from "./test-runner.js";
import * as process from 'process';
import * as path from 'path';

// Paths to the build directories of the projects to be tested.  The paths are relative to this file.
const buildDirectories = {
    common: "../../../common/lib",
    backend: "../../../backend/dist",
    frontend: "../frontend/dist"
};

(async () => {
    if (process.argv.length !== 3) {
        printSyntaxError();
        return;
    }

    const testTarget = process.argv[2];
    if (!(testTarget in buildDirectories)) {
        printSyntaxError();
        return;
    }

    if (import.meta.url === undefined) {
        // The meta property 'import.meta' must be made available by the host as mandated by the
        // ECMAScript specification (13.3.12.1, ES2022).  In the default implementation, however, 
        // the host simply returns an empty list.  If the host does not provide the property (should
        // not occur in modern browsers and node), terminate with an error.
        throw new Error("[test] The absolute path of the script's main ECMA module cannot be determined dynamically");
    }

    const buildDirectory = buildDirectories[testTarget as keyof typeof buildDirectories];
    const absoluteBuildDirectory = path.resolve(new URL(import.meta.url).pathname, buildDirectory);
    
    const testFiles = await discoverTestScripts(absoluteBuildDirectory);

    if (testFiles === null) {
        console.error(`Path "${buildDirectory}" does not exist. Please ensure that...`);
        console.error("... the project has already been built");
        console.error("... the build output directory has not been changed (cf. tsconfig.json)");
        return;
    }

    await runTests(testFiles!);
})();

function printSyntaxError() {
    console.error("Invalid arguments");
    console.error("npm run test <target>");
    console.error("Valid targets are: 'backend', 'frontend");
}
