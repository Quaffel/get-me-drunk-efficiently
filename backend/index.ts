import express, { Application} from "express";
import { router as apiRouter } from './api/api';

const app: Application = express();

app.use('/api', apiRouter);

app.listen(80, () => console.log("Started the backend on port 80"));