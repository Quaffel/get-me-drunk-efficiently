export interface IIngredient {
    name: string;
    category?: string;
    alcoholConcentration: number;
}

export interface IIngredientAmount {
    ingredient: IIngredient;
    amount: number;
    unit: Unit;
}

export interface IDrink {
    name: string;
    image?: string;
    description?: string;
    instructions?: string[];
    ingredients: IIngredientAmount[];
    alcoholVolume: number; /* in ml*/
}

export interface IDrinkAmount {
    drink: IDrink;
    amount: number;
}

// Unit system

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
    'drop':                 { volumetric: false,    trivial: true   },
    'pinch':                { volumetric: false,    trivial: false  }
} as const;
