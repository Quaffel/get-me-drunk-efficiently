import express, { Router, Request, Response } from 'express';
import { IRequest, IResponse } from '../../types';
import { getOptimalDrinkAmounts } from './services';

const router: Router = Router();

router.post('/get-me-drunk', express.json(), (req: Request, res: Response) => {
    const request = req.body as IRequest;

    const result: IResponse = { drinks: [] };
    return res.json(result);
});

export { router };