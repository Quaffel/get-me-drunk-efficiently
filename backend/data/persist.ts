import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';

import * as process from 'process';
import * as os from 'os';

export interface PersistenceStrategy {
    storeData: (domain: string, obj: any) => Promise<
        | { type: 'success' }
        | { type: 'store-error', error: any }
        | { type: 'serialize-error', error: any }
    >;
    retrieveData: (domain: string) => Promise<
        | { type: 'success', data: any }
        | { type: 'not-found' }
        | { type: 'retrieve-error', error: any }
        | { type: 'parse-error', error: any }
    >;
}

class FileSystemStrategy<T> implements PersistenceStrategy {
    #basePath: string;

    constructor(basePath: string) {
        // Remove the trailing path separator at the end of the specified if present.
        // Always checks for forward slashes as they are processed by node's fs library, even on Windows.
        // (e.g., 'test/path/' => 'test/path')
        this.#basePath = basePath.endsWith("/") || basePath.endsWith(path.sep)
            ? basePath.substring(0, basePath.length - 1)
            : basePath;

        // Ensure that the specified directory exists.
        try {
            const uppermostCreatedDirectory: string | undefined = fsSync.mkdirSync(this.#basePath, { recursive: true });
            if (uppermostCreatedDirectory !== undefined) {
                console.log(`[persist] Created persistence base directory at ${uppermostCreatedDirectory}`);
            }
        } catch (e: any) {
            throw new Error(`Cannot create persist base directory ${this.#basePath}`, { cause: e });
        }
    }

    async storeData(domain: string, obj: T) {
        let serializedObj: string;
        try {
            // May throw, e.g., when trying to serialize cyclic references or bigints
            serializedObj = JSON.stringify(obj);
        } catch (e: any) {
            return { type: 'serialize-error' as const, error: e };
        }

        try {
            await fs.writeFile(this.#basePath + path.sep + domain + ".json", serializedObj, { encoding: 'utf-8' });
            return { type: 'success' as const };
        } catch (e: unknown) {
            return { type: 'store-error' as const, error: e };
        }
    }

    async retrieveData(domain: string) {
        let fileContent: string;
        try {
            fileContent = await fs.readFile(this.#basePath + path.sep + domain + ".json", 'utf-8');
        } catch (e: any) {
            const cause: { errno: number, code: string } = e;
            if (cause.code === "ENOENT") {
                // Requested file does not exist
                return { type: 'not-found' as const };
            }
            if (cause.code === "EISDIR") {
                // Requested file is a directory.  Albeit supported on all major platforms, the behavior on reading
                // a directory is platform-dependent. FreeBSD, for instance, returns the directory's contents.
                // For simplicity's sake, we ignore this edge case for now.
                return { type: 'retrieve-error' as const, error: new Error("path must not refer to a directory") };
            }
            return { type: 'retrieve-error' as const, error: e };
        }

        let parsedFileContent: any;
        try {
            parsedFileContent = JSON.parse(fileContent);
            return { type: 'success' as const, data: parsedFileContent };
        } catch (e: any) {
            return { type: 'parse-error' as const, error: e };
        }
    }
}

export interface CacheDomain<T> {
    cached: (block: () => PromiseLike<T>) => PromiseLike<T>,
    invalidate: () => void
}

/**
 * For a single cache domain, it is guaranteed that there is at most one execution context executing a 'block'
 * (parameter of the returned 'cached' function) at any time.  If another execution context has already entered
 * that block, any further invocations of the 'cached' function will simply await the first context's result,
 * unless the cache has been invalidated.  Cache invalidation does not change the result of any invocations
 * prior to the cache invalidation.
 * 
 * @param initialValue The cache's initial content.  No 'block' will be executed before manual cache invalidation.
 */
function buildCache<T>(initialValue?: T): CacheDomain<T> {
    let valid = false;
    let cachedValue: PromiseLike<T>;

    if (initialValue !== undefined) {
        valid = true;
        cachedValue = Promise.resolve(initialValue);
    }

    function cached(block: () => PromiseLike<T>): PromiseLike<T> {
        return {
            async then<R1, R2>(
                onfulfilled: (value: T) => (PromiseLike<R1> | R1),
                onrejected?: (reason: any) => (PromiseLike<R2> | R2)
            ): Promise<R1 | R2> {
                try {
                    if (!valid) {
                        valid = true;
                        cachedValue = block();
                    }

                    return onfulfilled?.(await cachedValue);
                } catch (error: any) {
                    return onrejected?.(error) ?? Promise.reject(error);
                }
            },
        }
    }

    function invalidate() {
        valid = false;
    }

    return { cached, invalidate };
}

let defaultStrategy: PersistenceStrategy = new FileSystemStrategy("./cache");
export function setDefaultStrategy(strategy: PersistenceStrategy) {
    defaultStrategy = strategy;
}

export interface PersistenceDomain<T> {
    persisted: (block: () => PromiseLike<T>) => PromiseLike<T>,
    invalidate: () => void
}

const persistenceDomains = new Map<string, PersistenceDomain<any>>();

export function buildPersisted<T>(domainName: string, strategy?: PersistenceStrategy): PersistenceDomain<T> {
    // Ensure that only one persistence domain exists for any domain name.  Without this guarantee,
    // race conditions may occur.
    if (persistenceDomains.has(domainName)) {
        return persistenceDomains.get(domainName) as PersistenceDomain<T>;
    }

    let state: 'persisted-valid' | 'persisted-invalid' | 'new' = 'new';
    let { cached, invalidate: invalidateCache } = buildCache<T>();

    function persisted(block: () => PromiseLike<T>): PromiseLike<T> {
        // Using 'cached' ensures that only a single execution context is within the block at a time.
        // This way, we avoid redundant calculations and impede race conditions.
        return cached(async () => {
            if (state === 'persisted-valid' || state === 'new') {
                const readResult = await (strategy ?? defaultStrategy).retrieveData(domainName);

                process.stdout.write(`[persist] Reading persisted data for domain "${domainName}"... `);
                switch (readResult.type) {
                    case 'success':
                        process.stdout.write(`SUCCESS${os.EOL}`);
                        return readResult.data;
                    case 'not-found':
                        process.stdout.write(`NOT FOUND${os.EOL}`);
                        break;
                    case 'parse-error':
                        process.stdout.write(`PARSE ERROR. Discarding. Reason: ${readResult.error}${os.EOL}`);
                        break;
                    case 'retrieve-error':
                        process.stdout.write(`READ ERROR. Discarding. Reason: ${readResult.error}${os.EOL}`);
                        break;
                }
            }

            console.log(`[persist] Recalculate data for domain "${domainName}"`);
            const value = await block();

            // Under the premise that the data to be stored is rather small, the store operation is expected
            // to be rather cheap.  We thus delay the promise's resolution until the write operation completed
            // in favor of an implementation that is easier to reason about.
            const writeResult = await (strategy ?? defaultStrategy).storeData(domainName, value);
            
            process.stdout.write(`[persist] Persist data for domain "${domainName}"... `);
            switch (writeResult.type) {
                case 'success':
                    state = 'persisted-valid';
                    process.stdout.write(`SUCCESS${os.EOL}`);
                    break;
                case 'serialize-error':
                    state = 'persisted-invalid';
                    throw new Error("Cannot serialize data to be persisted", { cause: writeResult.error });
                case 'store-error':
                    state = 'persisted-invalid';
                    process.stdout.write(`STORE ERROR. Reason: ${writeResult.error}`);
                    break;
            }

            return value;
        });
    }

    function invalidate() {
        state = 'persisted-invalid';
        invalidateCache();
    }

    const persistenceDomain: PersistenceDomain<T> = { persisted, invalidate };
    persistenceDomains.set(domainName, persistenceDomain);

    return persistenceDomain;
}

export function persistedWithDomainArg<T>(
    retrieve: (domainName: string) => PromiseLike<T>,
    domainNameTransformer?: (domainName: string) => string,
    strategy?: PersistenceStrategy
): (domainName: string) => PromiseLike<T> {
    return (domainName) => {
        const persistenceDomainName = domainNameTransformer?.(domainName) ?? domainName;
        return buildPersisted<T>(persistenceDomainName, strategy).persisted(() => retrieve(domainName));
    }
}

export function persisted<T>(
    domainName: string,
    retrieve: (() => PromiseLike<T>),
    strategy?: PersistenceStrategy
): () => PromiseLike<T> {
    const persistenceDomain = buildPersisted<T>(domainName, strategy);
    return () => persistenceDomain.persisted(retrieve);
}
