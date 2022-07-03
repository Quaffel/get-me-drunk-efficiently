import { types } from "@get-me-drunk/common";
import { getDrinks } from "../data/index.js";

export async function searchDrinks({
    drinkName,
    maxAlcoholConcentration,
    ingredients
}: {
    drinkName?: string,
    maxAlcoholConcentration?: number,
    ingredients?: Array<types.IIngredient["name"]>
}): Promise<types.IDrink[]> {
    let drinks = await getDrinks();

    if (drinkName) {
        drinks = drinks.filter(it => it.name.toLowerCase().includes(drinkName.toLowerCase()));
    }

    if (ingredients) {
        const permissibleIngredients = new Set<types.IIngredient["name"]>(ingredients);
        drinks = drinks.filter(it => {
            return it.ingredients.find(ingr => !permissibleIngredients.has(ingr.ingredient.name)) === undefined;
        });
    }

    if (maxAlcoholConcentration !== undefined) {
        if (maxAlcoholConcentration < 0 || maxAlcoholConcentration > 1) {
            throw new Error("Alcohol concentration is out of bounds");
        }   
    }

    return drinks;
}