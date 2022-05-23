export const USER_AGENT = 'GetMeDrunkEfficiently/0.0 (https://github.com/Quaffel/get-me-drunk-efficiently)';

export function normalize(ingredientAmount: number, unit: string): { val: number, unit: string } {
    // Convert every known unit to ml
    switch(unit) {
        case 'fluid ounce':       return { val: ingredientAmount * 29.5735, unit: 'ml' };
        case 'centilitre':        return { val: ingredientAmount * 10,      unit: 'ml' };
        case 'splash':            return { val: ingredientAmount * 3.7,     unit: 'ml' };
        case 'dash':              return { val: ingredientAmount * 0.9,     unit: 'ml' };
        case 'millilitre':        return { val: ingredientAmount,           unit: 'ml' };
        case 'teaspoon':          return { val: ingredientAmount * 3.7,     unit: 'ml' };
        case 'bar spoon':         return { val: ingredientAmount * 2.5,     unit: 'ml' };
        case 'ounce':             return { val: ingredientAmount * 29.5735, unit: 'ml' };
        case 'Stemware':          return { val: ingredientAmount * 150,     unit: 'ml' };
        case 'tablespoon':        return { val: ingredientAmount * 11.1,    unit: 'ml' };
        case 'drop':              return { val: ingredientAmount * 0.05,    unit: 'ml' };
        case 'teaspoon (metric)': return { val: ingredientAmount * 3.7,     unit: 'ml' };
        case 'pinch':             return { val: ingredientAmount * 0.31,    unit: 'ml' };
        case '1':                 return { val: ingredientAmount * 29.5735, unit: 'ml' };

        default:                  return { val: ingredientAmount,           unit: unit };
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