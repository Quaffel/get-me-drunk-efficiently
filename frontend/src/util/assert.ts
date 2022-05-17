export function isDebug(): boolean {
    return process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
}

export function runInDebug(block: () => void) {
    if (isDebug()) {
        block();
    } 
}
