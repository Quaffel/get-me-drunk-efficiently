import express, { Router, Request, Response } from 'express';
import { IRequest, IResponse, IResponseIngredients } from '../../types';
import { getIngredients } from './data';
import { getOptimalDrinkAmounts } from './services';

const router: Router = Router();

router.post('/get-me-drunk', express.json(), (req: Request, res: Response) => {
    const request = req.body as IRequest;

    const result: IResponse = { drinks: [] };
    return res.json(result);
});

router.get('/ingredients', (req: Request, res: Response) => {
    const result: IResponseIngredients = { 
        ingredients: getIngredients()
    };

    return res.json(result);
});

export { router };