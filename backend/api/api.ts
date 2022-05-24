import express, { Router, Request, Response } from 'express';
import { IAllIngredientsResponse, isTipsinessQuery, ITipsinessQuery, ITipsinessResponse } from '../../queries';
import { getAllIngredients, getOptimalDrinkAmounts } from '../services';

const router: Router = Router();

router.post('/tipsiness', express.json(), async (req: Request, res: Response) => {
    const query = req.body;
    if(!isTipsinessQuery(query)) return res.status(400).end();

    const optimalDrinks = getOptimalDrinkAmounts(query.ingredients, query.promille, query.weight);
    
    const result: ITipsinessResponse = { drinks: optimalDrinks };
    return res.json(result);
});

router.get('/ingredients', async (_: Request, res: Response) => {
    const result: IAllIngredientsResponse = { ingredients: await getAllIngredients() };
    return res.json(result);
});

router.post('/drinks', async (req: Request, res: Response) => {
    const query = req.body;
    if (!isTipsinessQuery(query)) return res.status(400).end(); 

    // TODO: Contact corresponding service.
});

export { router };
