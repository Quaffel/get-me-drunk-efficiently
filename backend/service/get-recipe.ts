import { types, messy } from "@get-me-drunk/common";

export async function getRecipe(drink: types.IDrink): Promise<messy.types.Recipe> {
    return ({
        name: { en: "Weird cocktail", de: "Komischer Cocktail" },
        tasks: [{
            type: 'fill',
            amount: 3,
            ingredient: { en: "Vodka", de: "Vodka" },
            amountInUnit: {
                amount: 4,
                unit: 'kg'
            }
        }]
    });
}