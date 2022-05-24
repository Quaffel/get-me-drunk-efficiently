import {
    IAllIngredientsResponse, IDrinkQuery, IDrinkResponse,
    ITipsinessQuery, ITipsinessResponse
} from "../../queries";

export const queryTipsinessRecommendation = (request: ITipsinessQuery): Promise<ITipsinessResponse> =>
    fetch("/api/tipsiness", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    }).then(it => it.json());

export const queryIngredients = (): Promise<IAllIngredientsResponse> =>
    fetch("/api/ingredients").then(it => it.json());

export const queryDrinks = (request: IDrinkQuery): Promise<IDrinkResponse> =>
    fetch("/api/drinks", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    }).then(it => it.json());
