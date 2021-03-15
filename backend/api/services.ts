import { IDrinkAmount, IIngredient } from "../../types";
import { fetchCocktails } from "./data";

export async function getOptimalDrinkAmounts(
    availableIngredients: IIngredient[],
    promille: Number,
    weight: Number
): Promise<IDrinkAmount[]> {
    const allDrinks = await fetchCocktails();
    const availableDrinks = allDrinks.filter(drink => 
        areIngredientsAvailable(drink.ingredients, availableIngredients));

    return [];
}

function areIngredientsAvailable(
    checkIngredients: IIngredient[],
    availableIngredients: IIngredient[]): boolean {

    const availableIngredientNames = availableIngredients.map(ingredient => ingredient.name);
    return checkIngredients.every(ingredient => availableIngredientNames.includes(ingredient.name));
}