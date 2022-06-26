import { queries } from '@get-me-drunk/common';

export const queryTipsinessRecommendation = (request: queries.ITipsinessQuery): Promise<queries.ITipsinessResponse> =>
    fetch("/api/tipsiness", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    }).then(it => it.json());

export const queryIngredients = (): Promise<queries.IAllIngredientsResponse> =>
    fetch("/api/ingredients").then(it => it.json());

export const queryDrinks = (request: queries.IDrinkQuery): Promise<queries.IDrinkResponse> =>
    fetch("/api/drinks", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    }).then(it => it.json());

export const queryRecipe = (request: queries.IRecipeQuery): Promise<queries.IRecipeResponse> =>
    fetch("/api/recipe", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    }).then(it => it.json());
