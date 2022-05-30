import * as https from "https";

export const DEFAULT_USER_AGENT = 'GetMeDrunkEfficiently/0.0 (https://github.com/Quaffel/get-me-drunk-efficiently)';

export type MimeType =
    | 'application/sparql-results+json'
    | 'application/x-www-form-urlencoded'
    | 'application/json';

interface FetchRequestBase<T extends string, M extends MimeType> {
    method: T;
    accept: M;
    userAgent?: string,
    customHeaders?: { [headerName: string]: string }
}
export interface GetFetchRequest<M extends MimeType> extends FetchRequestBase<'GET', M> { }
export interface PostFetchRequest<M extends MimeType> extends FetchRequestBase<'POST', M> {
    body: {
        mimeType: MimeType,
        content: string
    }
}
export type FetchRequest<M extends MimeType> = GetFetchRequest<M> | PostFetchRequest<M>;

interface FetchResponseBase<T extends string> {
    type: T;
}
export interface SuccessfulFetchResponse<M extends MimeType> extends FetchResponseBase<'success'> {
    statusCode: number;
    body: {
        mimeType: M,
        content: string
    };
}
export interface RedirectFetchResponse extends FetchResponseBase<'redirect'> { location?: string };
export interface ErrorFetchResponse extends FetchResponseBase<'error'> { error: any; }
export type FetchResponse<M extends MimeType> =
    | SuccessfulFetchResponse<M> | RedirectFetchResponse
    | ErrorFetchResponse;

export function fetch<M extends MimeType>(url: string, request: FetchRequest<M>): Promise<FetchResponse<M>> {
    const headers: any = {
        'Accept': request.accept,
        'User-Agent': request.userAgent ?? DEFAULT_USER_AGENT,
        ...request.customHeaders
    };

    if (request.method === 'POST') {
        headers['Content-Type'] = request.body.mimeType;
        headers['Content-Length'] = Buffer.byteLength(request.body.content);
    }

    return new Promise((resolve, _) => {
        const httpRequest = https.request(url, {
            method: request.method,
            headers
        }, async (res) => {
            try {
                let responseBody = "";

                res.setEncoding("utf-8");
                for await (const chunk of res) {
                    responseBody += chunk;
                }

                if (res.statusCode === 301) {
                    resolve({
                        type: 'redirect',
                        location: res.headers.location
                    });
                }

                resolve({
                    type: 'success',
                    statusCode: res.statusCode!,
                    body: {
                        mimeType: request.accept,
                        content: responseBody
                    }
                });
            } catch (error: any) {
                return {
                    error
                };
            }
        }).on('error', (error) => resolve({
            type: 'error',
            error
        }));

        if (request.method === 'POST') {
            httpRequest.write(request.body.content);
        }
        httpRequest.end();
    });
}
