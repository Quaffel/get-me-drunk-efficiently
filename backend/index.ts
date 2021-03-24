import express, { Application } from 'express';
import { router as apiRouter } from './api/api';
import { fetchAlcohol, fetchDrinks, getAlcohol, getDrinks, getIngredients } from './api/data';

const app: Application = express();

app.use('/api', apiRouter);

fetchDrinks().then(() => {
    const drinks = getDrinks();
    const ingredients = getIngredients();
    const alcohol = getAlcohol();

    console.log(`Successfully cached ${drinks.length} drinks with ${ingredients.length} unique ingredients!`);
    console.log(`Successfully cached %vol for ${Object.keys(alcohol).length} categorys!`);
});

app.listen(4000, () => console.log("Started the backend on port 4000"));
