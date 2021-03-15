import express, { Application, Request, Response} from "express";
import { IResponse, IRequest } from "../types";
import { router as apiRouter } from './api/router';

const app: Application = express();

app.use('/api', apiRouter);

app.listen(80, () => console.log("Started the backend on port 80"));