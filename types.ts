interface IIngredient {
    name: string;
}

interface IDrink {
    name: string;
    description: string;
    instructions: string[];
    ingredients: IIngredient[];
}

interface IDrinkAmount {
    drink: IDrink;
    amount: number;
}

interface IRequest {
    ingredients: IIngredient[];
    promille: number;
    weight: number;
}

interface IResponse {
    drinks: IDrinkAmount[];
}
