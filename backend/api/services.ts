import { IDrinkAmount, IIngredient } from "../../types";
import { getDrinks } from "./data";

export function getAllIngredients(): IIngredient[] {

    return [];
}

export function getOptimalDrinkAmounts(
    availableIngredients: IIngredient[],
    promille: Number,
    weight: Number
): IDrinkAmount[] {
    const allDrinks = getDrinks();
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