import express, { Application } from 'express';
import { router as apiRouter } from './api/api.js';
import { getDrinks } from './data/index.js';

(async function init() {
    const app: Application = express();
    app.use('/api', apiRouter);

    console.time("cache load time");
    console.log("-------- START FILLING CACHE ---------");

    await getDrinks();

    console.log("-------- FINISHED FILLING CACHE ------");
    console.timeEnd("cache load time");

    app.listen(4000, () => console.log("Started the backend on port 4000"));
})();

