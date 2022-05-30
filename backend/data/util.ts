export type NormalizedUnit = 'ml' | 'whole'; 

interface UnitInformation {
    // Unit can be measured and is meaningful (i.e., significant for the alcohol concentration calculation) to measure.
    // Positive examples: 'ml', 'tablespoon'
    // Negative examples: '1' (not measurable), 'drop' (even though it is measurable, it is insignificant)
    volumetric: boolean,

    // Meaning of unit is well-known and can thus be displayed directly to the user.
    // Positive examples: 'ml', 'tablespoon'
    // Negative example: 'fluid ounce' (not contemporary)
    trivial: boolean
}

type FilterUnits<P extends Partial<UnitInformation>> = keyof {
    [K in keyof typeof UNITS as typeof UNITS[K] extends P ? K : never]: never
}

export type Unit = keyof typeof UNITS;
export function isUnit(str: string): str is Unit {
    return str in UNITS;
}

export type VolumetricUnit = FilterUnits<{ volumetric: true }>;
export function isVolumetricUnit(unit: Unit): unit is VolumetricUnit {
    return UNITS[unit].volumetric;
}

export type TrivialUnit = FilterUnits<{ trivial: true }>;
export function isTrivialUnit(unit: Unit): unit is TrivialUnit {
    return UNITS[unit].trivial;
}

const UNITS = {
    '1':                    { volumetric: false,    trivial: true   },
    'ml':                   { volumetric: true,     trivial: true   },
    'ounce':                { volumetric: true,     trivial: true   },
    'fluid ounce':          { volumetric: true,     trivial: true   },
    'centilitre':           { volumetric: true,     trivial: true   },
    'millilitre':           { volumetric: true,     trivial: true   },
    'splash':               { volumetric: true,     trivial: true   },
    'dash':                 { volumetric: true,     trivial: true   },
    'teaspoon':             { volumetric: true,     trivial: true   },
    'teaspoon (metric)':    { volumetric: true,     trivial: true   },
    'bar spoon':            { volumetric: true,     trivial: true   },
    'tablespoon':           { volumetric: true,     trivial: true   },
    'Stemware':             { volumetric: true,     trivial: true   },
    'drop':                 { volumetric: false,    trivial: false  },
    'pinch':                { volumetric: false,    trivial: false  }
} as const;

export function normalize(ingredientAmount: number, unit: Unit): { val: number, unit: NormalizedUnit } {
    if (!isVolumetricUnit(unit)) {
        return { val: 0, unit: 'ml' };
    }

    // Convert every known unit to ml
    switch(unit) {
        case 'ml':                return { val: ingredientAmount,           unit: 'ml'    };
        case 'ounce':             return { val: ingredientAmount * 29.5735, unit: 'ml'    };
        case 'fluid ounce':       return { val: ingredientAmount * 29.5735, unit: 'ml'    };
        case 'centilitre':        return { val: ingredientAmount * 10,      unit: 'ml'    };
        case 'millilitre':        return { val: ingredientAmount,           unit: 'ml'    };
        case 'splash':            return { val: ingredientAmount * 3.7,     unit: 'ml'    };
        case 'dash':              return { val: ingredientAmount * 0.9,     unit: 'ml'    };
        case 'teaspoon':          return { val: ingredientAmount * 3.7,     unit: 'ml'    };
        case 'teaspoon (metric)': return { val: ingredientAmount * 3.7,     unit: 'ml'    };
        case 'bar spoon':         return { val: ingredientAmount * 2.5,     unit: 'ml'    };
        case 'tablespoon':        return { val: ingredientAmount * 11.1,    unit: 'ml'    };
        case 'Stemware':          return { val: ingredientAmount * 150,     unit: 'ml'    };
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
