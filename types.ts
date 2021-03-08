export interface IIngredient {
    name: string;
}

export interface IDrink {
    name: string;
    description: string;
    instructions: string[];
    ingredients: IIngredient[];
}

export interface IDrinkAmount {
    drink: IDrink;
    amount: number;
}

export interface IRequest {
    ingredients: IIngredient[];
    promille: number;
    weight: number;
}

export interface IResponse {
    drinks: IDrinkAmount[];
}
