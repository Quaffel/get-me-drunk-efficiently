import { isVolumetricUnit, Unit } from "../../types.js";


export function normalize(ingredientAmount: number, unit: Unit): number {
    if (!isVolumetricUnit(unit)) {
        return 0;
    }

    // Convert every known unit to ml
    switch(unit) {
        case 'ml':                return ingredientAmount;
        case 'ounce':             return ingredientAmount * 29.5735;
        case 'fluid ounce':       return ingredientAmount * 29.5735;
        case 'centilitre':        return ingredientAmount * 10;
        case 'millilitre':        return ingredientAmount;
        case 'splash':            return ingredientAmount * 3.7;
        case 'dash':              return ingredientAmount * 0.9;
        case 'teaspoon':          return ingredientAmount * 3.7;
        case 'teaspoon (metric)': return ingredientAmount * 3.7;
        case 'bar spoon':         return ingredientAmount * 2.5;
        case 'tablespoon':        return ingredientAmount * 11.1;
        case 'Stemware':          return ingredientAmount * 150;
    }
}

export function cached<T>(retrieve: (id: string) => Promise<T>) {
  const cache = new Map<string, Promise<T>>();

  return function cached(id: string): Promise<T> {
    if(cache.has(id))
        return cache.get(id)!;
        
    const result = retrieve(id);
    cache.set(id, result);

    return result;
  }
}

export function once<T>(retrieve: () => T) {
    let cached: T | null = null;

    return function get() {
        if(cached === null)
            cached = retrieve();
        
        return cached;
    }
}

export type NonEmptyArray<T> = [T, ...T[]];

export type DeepPartial<T> = T extends object ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : T;

export type DeepNonNullable<T> = T extends object ? {
    [K in keyof T]-?: DeepNonNullable<T[K]>;  
} : NonNullable<T>;

export function isDeepNonNullable<T extends { [name: PropertyKey]: any }>(obj: T): obj is DeepNonNullable<T> {
    for (let entry of Object.entries(obj)) {
        const value = entry[1];
        if (value === null || value === undefined) {
            return false;
        }
        if (typeof value === 'object' && !isDeepNonNullable(value)) {
            return false;
        } 
    }

    return true;
}

export function discerpInBatches<T>(data: Array<T>, maxBatchSize: number): Array<NonEmptyArray<T>> {
    let result: Array<NonEmptyArray<T>> = [];
    let batchStartIndex = 0;
    while (batchStartIndex < data.length) {
        const batchSize = Math.min(data.length - batchStartIndex, maxBatchSize);
        const batchEndIndex = batchStartIndex + batchSize;

        result.push(data.slice(batchStartIndex, batchEndIndex) as NonEmptyArray<T>);
        batchStartIndex = batchEndIndex;
    }

    return result;
}
