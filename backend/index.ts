import express, { Application, Request, Response} from "express";
import { IResponse, IRequest } from "../types";

const app: Application = express();

app.post("/api/get-me-drunk", express.json(), (req: Request, res: Response) => {
    const request = req.body as IRequest;

    // TODO: Loads of logic

    const result: IResponse = { drinks: [] };
    return res.json(result);
});

app.listen(80, () => console.log("Started the backend on port 80"));