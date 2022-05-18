import { IRequest, IResponse, IResponseIngredients } from "../../types";

export const getMeDrunk = (request: IRequest): Promise<IResponse> =>
    fetch("/api/get-me-drunk", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    }).then(it => it.json());

export const getIngredients = (): Promise<IResponseIngredients> =>
    fetch("/api/ingredients").then(it => it.json());