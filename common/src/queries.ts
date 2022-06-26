import { messy } from './index.js';
import { IIngredient, IDrinkAmount, IDrink } from './types.js';

// Tipsiness query: Query a set of cocktails that needs to be consumed for reaching a certain 
// level of drunkenness.  Used by "get-me-drunk-efficiently"'s core feature.
export interface ITipsinessQuery {
    ingredients: Array<IIngredient["name"]>;
    promille: number;
    weight: number;
}

export interface ITipsinessResponse {
    drinks: IDrinkAmount[];
}

export function isTipsinessQuery(obj: any): obj is ITipsinessQuery {
    return obj && obj.ingredients && typeof obj.ingredients === 'object'
        && obj.promille && typeof obj.promille === 'number'
        && obj.weight && typeof obj.weight === 'number';
}

// All ingredients query: Query all ingredients that are used in at least one cocktail. 
// Required for on-device suggestions in the IngredientList component.
export interface IAllIngredientsQuery {}

export interface IAllIngredientsResponse {
    ingredients: IIngredient[];
}

export function isAllIngredientsQuery(obj: any): obj is IAllIngredientsQuery {
    return !!obj;
}

// Drink request: Query drinks based on filter criteria.
export interface IDrinkQuery {
    drinkName?: string;
    maxAlcoholConcentration?: number;
    ingredients?: Array<IIngredient["name"]>;
}

export interface IDrinkResponse {
    drinks: IDrink[];
}

export function isDrinkQuery(obj: any): obj is IDrinkQuery {
    return !!obj;
}

// Recipe request: Query the recipe associated with a drink.
export interface IRecipeQuery {
    drink: IDrink['name'];
}

export interface IRecipeResponse {
    recipe: messy.types.Recipe;
}

export function isRecipeQuery(obj: any): obj is IRecipeQuery {
    return obj && obj.drink && typeof obj.drink === 'string';
}