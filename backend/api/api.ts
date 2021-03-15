import express, { Router, Request, Response } from 'express';
import { IRequest, IResponse, IResponseIngredients } from '../../types';
import { getAllIngredients, getOptimalDrinkAmounts } from './services';

const router: Router = Router();

router.post('/get-me-drunk', express.json(), (req: Request, res: Response) => {
    const request = req.body as IRequest;

    const optimalDrinks = getOptimalDrinkAmounts(request.ingredients, request.promille, request.weight);
    
    const result: IResponse = { drinks: optimalDrinks };
    return res.json(result);
});

router.get('/ingredients', (req: Request, res: Response) => {
    const result: IResponseIngredients = { ingredients: getAllIngredients() };
    return res.json(result);
});

export { router };