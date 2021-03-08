import { IRequest, IResponse } from "../../types";

export const getMeDrunk = (request: IRequest): Promise<IResponse> =>
    fetch("/api/get-me-drunk", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    }).then(it => it.json());