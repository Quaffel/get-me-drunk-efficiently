export interface IIngredient {
    name: string;
    alcohol: number;
}

export interface IIngredientAmount {
    ingredient: IIngredient;
    amount: number;
}

export interface IDrink {
    name: string;
    description?: string;
    instructions?: string[];
    ingredients: IIngredientAmount[];
}

export interface IDrinkAmount {
    drink: IDrink;
    amount: number;
    amountAlcohol: number;
}

export interface IRequest {
    ingredients: IIngredient[];
    promille: number;
    weight: number;
}

export interface IResponse {
    drinks: IDrinkAmount[];
}

export interface IResponseIngredients {
    ingredients: IIngredient[];
}

export function objIsRequest(obj: any): obj is IRequest {
    return obj && obj.ingredients && typeof obj.ingredients === 'object'
        && obj.promille && typeof obj.promille === 'number'
        && obj.weight && typeof obj.weight === 'number'
}