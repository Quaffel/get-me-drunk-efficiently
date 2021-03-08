import * as Express from "express";
import * as bodyParser from "body-parser";
import { IResponse, IRequest } from "../types";

const app = Express();

app.post("/api/get-me-drunk", bodyParser.json(), (req, res) => {
    const request = req.body as IRequest;

    // TODO: Loads of logic

    const result: IResponse = { drinks: [] };
    return res.json(result);
});

app.listen(80, () => console.log("Started the backend on port 80"));