import { types, queries } from '@get-me-drunk/common';
import express, { Router, Request, Response } from 'express';
import { getDrinks } from '../data/wikidata.js';
import { getAllIngredients } from '../service/get-ingredients.js';
import { getRecipe } from '../service/get-recipe.js';
import { searchDrinks } from '../service/search-drinks.js';
import { getOptimalDrinkAmounts } from '../service/tipsiness.js';

const router: Router = Router();

router.post('/tipsiness', express.json(), async (req: Request, res: Response) => {
    const query = req.body;
    if (!queries.isTipsinessQuery(query)) return res.status(400).end();

    const result: queries.ITipsinessResponse = {
        drinks: await getOptimalDrinkAmounts(query.ingredients, query.promille, query.weight)
    };

    return res.json(result);
});

router.get('/ingredients', async (_: Request, res: Response) => {
    const result: queries.IAllIngredientsResponse = { ingredients: await getAllIngredients() };
    return res.json(result);
});

router.post('/drinks', express.json(), async (req: Request, res: Response) => {
    const query = req.body;
    if (!queries.isDrinkQuery(query)) return res.status(400).end();

    let eligibleDrinks;
    try {
        eligibleDrinks = await searchDrinks({
            drinkName: query.drinkName && query.drinkName.length > 0 ? query.drinkName : undefined,
            maxAlcoholConcentration: query.maxAlcoholConcentration,
            ingredients: query.ingredients && query.ingredients.length > 0 ? query.ingredients : undefined
        });
    } catch (e: unknown) {
        return res.status(400).end();
    }

    const result: queries.IDrinkResponse = {
        drinks: eligibleDrinks
    };

    return res.json(result);
});

router.post('/recipe', express.json(), async (req: Request, res: Response) => {
    const query = req.body;
    if (!queries.isRecipeQuery(query)) return res.status(400).end();

    let drinksMatchingName = (await getDrinks()).filter(it => it.name === query.drink);
    if (drinksMatchingName.length === 0) {
        return res.status(404).end();
    }
    if (drinksMatchingName.length > 1) {
        console.error(`[route-recipe] Found drinks with ambiguous name "${query.drink}"`);
    }

    const drink = drinksMatchingName[0];
    const result: queries.IRecipeResponse = {
        recipe: await getRecipe(drink)
    };

    return res.json(result);
});

export { router };
