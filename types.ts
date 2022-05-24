export interface IIngredient {
    name: string;
    category?: string;
    alcohol: number;
}

export interface IIngredientAmount {
    ingredient: IIngredient;
    amount: number;
    unit: string;
}

export interface IDrink {
    name: string;
    image?: string;
    description?: string;
    instructions?: string[];
    ingredients: IIngredientAmount[];
    alcoholVolume: number; /* in ml*/
}

export interface IDrinkAmount {
    drink: IDrink;
    amount: number;
}
