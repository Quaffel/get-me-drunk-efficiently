import { IDrinkAmount, IIngredient } from '../../types';
import { getDrinks, getIngredients } from './data';

export function getAllIngredients(): IIngredient[] {
    return getIngredients();
}

export function getOptimalDrinkAmounts(
    availableIngredients: IIngredient[],
    promille: Number,
    weight: Number
): IDrinkAmount[] {
    const allDrinks = getDrinks();
    const availableDrinks = allDrinks.filter(drink => 
        areIngredientsAvailable(drink.ingredients.map(ingredientAmount => ingredientAmount.ingredient), availableIngredients));

    

    return [];
}

function areIngredientsAvailable(
    checkIngredients: IIngredient[],
    availableIngredients: IIngredient[]): boolean {

    const availableIngredientNames = availableIngredients.map(ingredient => ingredient.name);
    return checkIngredients.every(ingredient => availableIngredientNames.includes(ingredient.name));
}