// Unconsidered options: property configuration
export type DeepEqualityOptions = Partial<{
    // Whether +0 is considered unequal to -0 (default: false)
    strictNumberEquality?: boolean,
    // Until which depth the algorithm should recurse.  If the specified depth is reached,
    // equality will be determined by checking for shallow equality.
    maximumDepth: number,
    consideredKeys: 'enumerable' | 'all'
}>

export function deepEquals(
    first: any,
    second: any,
    options?: DeepEqualityOptions
): first is typeof second {
    // Stack containing all comparisons that have been performed so far. 
    const memoizedComparisons: Map<any, any> = new Map();

    function deepEquals0(
        // Comparison operands
        first: any, second: any,
        // Current comparison depth
        currentDepth: number
    ): boolean {
        if (typeof first !== typeof second) {
            return false;
        }
        if (currentDepth === (options?.maximumDepth ?? -1)) {
            return first === second;
        }

        switch (typeof first) {
            case "number":
                if (options?.strictNumberEquality ?? false) {
                    return Object.is(first, second);
                }
                if (Number.isNaN(first)) {
                    return Number.isNaN(second);
                }

            // Fall-through to strict equality check
            case "bigint":
            case "boolean":
            case "string":
            case "function":
            case "symbol":
                return first === second;
            case "undefined":
                return true;
            case "object":
                if (first === null) {
                    return second === null;
                }

                // Break down circular references.
                let memoizedComparison: any | undefined = memoizedComparisons.get(first);
                if (memoizedComparison && memoizedComparison === second) {
                    return true;
                }

                memoizedComparisons.set(first, second);

                if (Array.isArray(first)) {
                    if (!Array.isArray(second) || first.length !== second.length) {
                        return false;
                    }

                    for (let i = 0; i < first.length; i++) {
                        let firstEl = first[i];
                        let secondEl = second[i];

                        if (!deepEquals0(firstEl, secondEl, currentDepth + 1)) {
                            return false;
                        }
                    }

                    return true;
                }

                const keysMethod = (options?.consideredKeys ?? 'all') === 'all'
                    ? Object.getOwnPropertyNames
                    : Object.keys;
                const firstKeys = keysMethod(first);
                const secondKeys = keysMethod(second);

                if (firstKeys.length !== secondKeys.length) {
                    return false;
                }

                const sortedFirstKeys = firstKeys.sort();
                const sortedSecondKeys = secondKeys.sort();

                return (
                    !deepEquals0(
                        sortedFirstKeys, sortedSecondKeys, currentDepth /* don't increase for names */
                    ) ||
                    !deepEquals0(
                        firstKeys.sort().map(it => first[it]),
                        secondKeys.sort().map(it => second[it]),
                        currentDepth + 1
                    )
                );
        }

        throw new Error(`Unreachable but found "${typeof first}" (is type check non-exhaustive?)`);
    }

    return deepEquals0(first, second, 1);
}