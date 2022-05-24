import { IIngredient, IDrinkAmount, IDrink } from './types';

// Tipsiness query: 
// Querying a set of cocktails that needs to be consumed for reaching a certain 
// level of drunkenness.  Used by "get-me-drunk-efficiently"'s core feature.
export interface ITipsinessQuery {
    ingredients: IIngredient[];
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

// All ingredients query:
// Querying all ingredients that are used in at least one cocktail.  
// Used by the fridge functionality on the tipsiness query page.
export interface IAllIngredientsQuery {}

export interface IAllIngredientsResponse {
    ingredients: IIngredient[];
}

export function isAllIngredientsQuery(obj: any): obj is IAllIngredientsQuery {
    return !!obj;
}

// Cocktails request:
// Querying cocktails based on filter criteria.
export interface IDrinkQuery {
    searchValue: string;
    maxAlcoholConcentration: number | null;
}

export interface IDrinkResponse {
    drinks: IDrink[];
}

export function isDrinkQuery(obj: any): obj is IDrinkQuery {
    return obj && obj.searchValue && typeof obj.searchValue === 'string'
        && obj.maxAlcoholConcentration && typeof obj.maxAlcoholConcentration === 'number';
}