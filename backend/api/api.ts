import express, { Router, Request, Response } from 'express';
import { IRequest, IResponse } from '../../types';

const router: Router = Router();

router.post("/get-me-drunk", express.json(), (req: Request, res: Response) => {
    const request = req.body as IRequest;

    // TODO: Loads of logic

    const result: IResponse = { drinks: [] };
    return res.json(result);
});

export { router };