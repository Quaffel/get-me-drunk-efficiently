import { ITipsinessQuery, ITipsinessResponse } from "../../queries";

export const getMeDrunk = (request: ITipsinessQuery): Promise<ITipsinessResponse> =>
    fetch("/api/tipsiness", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    }).then(it => it.json());

export const getIngredients = (): Promise<ITipsinessResponse> =>
    fetch("/api/ingredients").then(it => it.json());