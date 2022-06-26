import { PathLike } from 'fs'
import * as process from 'process';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * @param root The directory from which to start searching.  Supports both relative and absolute paths, whereby
 *             relative paths are relative to the process' current working directory.
 * @returns An array containing all test files that have been found recursively in the specified directory
 *          or 'null' if the specified path does not exist.  If the specified path refers to a file, it is
 *          treated as if the directory only contained a single folder.
 */
export async function discoverTestScripts(root: string): Promise<Array<string> | null> {
    try {
        const fileStats = await fs.lstat(root);
        if (fileStats.isFile()) {
            return root.toString().endsWith(".test.js") ? [root] : [];
        }
        if (fileStats.isSymbolicLink()) {
            // 'realpath' resolves symbolic links recursively, i.e., a chain of multiple symbolic links
            // is resolved in a single call.  For the node implementation, the maximum recursion depth
            // is even higher than the limit of the system library.
            return discoverTestScripts(await fs.realpath(root));
        }
        if (!fileStats.isDirectory()) {
            // Unsupported entity on file system.
            return null;
        }

        const pathNames = (await fs.readdir(root))
            .filter(it => {
                if (typeof it !== 'string') {
                    console.error("[test] Encountered unexpected type for path");
                    return false;
                }

                return true;
            })
            .map(it => path.join(root, it))
            .map(discoverTestScripts);

        return ((await Promise.all(pathNames))
            .filter(it => it !== null && it.length > 0) as Array<Array<string>>)
            .flat(1);
    } catch (e: any) {
        const cause: { errno: number, code: string } = e;

        // The only expected error occurs when the requested file does not exist.  In the absence of concurrent
        // modifications of the file system, this can only happen for the root directory.
        if (cause.code === 'ENOENT') {
            return null;
        }

        throw e;
    }
}
