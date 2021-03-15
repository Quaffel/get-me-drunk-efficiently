import express, { Application} from "express";
import { router as apiRouter } from './api/api';
import { fetchDrinks, getDrinks, getIngredients } from "./api/data";

const app: Application = express();

app.use('/api', apiRouter);

fetchDrinks().then(() => {
    const drinks = getDrinks();
    const ingredients = getIngredients();
    console.log(`Successfully cached ${drinks.length} drinks with ${ingredients.length} unique ingredients!`);

    app.listen(4000, () => console.log("Started the backend on port 4000"));
});