import express, { Application} from "express";
import { router as apiRouter } from './api/api';
import { fetchDrinks, getDrinks } from "./api/data";

const app: Application = express();

app.use('/api', apiRouter);

fetchDrinks().then(() => {
    const drinks = getDrinks();
    console.log(`Successfully cached ${drinks.length} drinks with ingredients!`);

    app.listen(80, () => console.log("Started the backend on port 80"));
});