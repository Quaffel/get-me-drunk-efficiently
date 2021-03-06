import express, { Router, Request, Response } from 'express';
import { IRequest, IResponse, IResponseIngredients, objIsRequest } from '../../types';
import { getAllIngredients, getOptimalDrinkAmounts } from './services';

const router: Router = Router();

router.post('/get-me-drunk', express.json(), (req: Request, res: Response) => {
    if(!objIsRequest(req.body)) return res.status(400).end();

    const optimalDrinks = getOptimalDrinkAmounts(req.body.ingredients, req.body.promille, req.body.weight);
    
    const result: IResponse = { drinks: optimalDrinks };
    return res.json(result);
});

router.get('/ingredients', (req: Request, res: Response) => {
    const result: IResponseIngredients = { ingredients: getAllIngredients() };
    return res.json(result);
});

export { router };