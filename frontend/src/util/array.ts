export function arrayEquals(
    arr: Array<any> | null | undefined, 
    other: Array<any> | null | undefined
): boolean {
    if (arr === other) { return true; }
    if (!arr || !other) { return false; }
    if (arr.length !== other.length) { return false; }
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] !== other[i]) { return false; }
    }

    return true;
}