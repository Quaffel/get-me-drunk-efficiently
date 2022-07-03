import { TestContextHandler } from '@get-me-drunk/common';
import { setTestContextHandler } from '@get-me-drunk/common';
import * as os from 'os';
import * as process from 'process'

export async function runTests(paths: Array<string>) {
    const rootContexts: Array<{ contextName: string, run: () => void }> = [];
    let total = 0;
    let failures = 0;

    let currentDepth = 0;

    const testContextHandler: TestContextHandler = {
        onRootRegistration(contextName, run) {
            rootContexts.push({ contextName, run });
        },
        onContextEnter(contextName) {
            currentDepth++;
            writeNewLines(1);
            writeIndented(`==== Context "${contextName}" ====`, currentDepth);
        },
        onProbe(_, probeName) {
            total++;
            writeNewLines(1);
            writeIndented(`Probe "${probeName}"...`, currentDepth);
        },
        onProbeFailure(_, __, reason) {
            currentDepth++;
            failures++;
            process.stdout.write(` FAILED: "${reason}"`);
        },
        onContextLeave() {
            currentDepth--;
        }
    };

    setTestContextHandler(testContextHandler);

    try {
        for (let path of paths) {
            if (typeof path !== "string") {
                throw new Error("Path must be a string");
            } 

            await import(path);
        }
    } catch (e: any) {
        throw new Error("Error while executing tests", { cause: e });
    }

    console.log("found " + rootContexts.length + " contexts");
    rootContexts.forEach(it => it.run());
    
    setTestContextHandler(null);
    writeNewLines(2);
    console.log(`Completed tests.`);
    console.log(`${total - failures}/${total} tests completed successfully.`);
}

function writeNewLines(amount: number) {
    process.stdout.write(os.EOL.repeat(amount));
}
function writeIndented(message: string, depth: number) {
    process.stdout.write(" ".repeat((depth - 1) * 4) + message);
}