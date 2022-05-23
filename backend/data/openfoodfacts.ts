import { cached, USER_AGENT } from "./util";
import * as https from "https";

export const getAlcohol = cached(function fetchAlcohol(category: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
        const url = `https://world.openfoodfacts.org/category/${encodeURIComponent(category)}.json?page_size=50`;
        const requestTime = Date.now();
        const request = https.get(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': USER_AGENT
            }
        }, async (res) => {
            if(res.statusCode === 301) {
                // Handle redirects
                const newCategory = res.headers.location?.replace('/category/', '').replace('.json', '') as string;

                console.log(`OpenFoodFacts redirected ${category} -> ${newCategory}`);
                return resolve(await fetchAlcohol(newCategory));
            }
            let body: string = '';
            res.on('error', (err) => reject(err));
            res.on('data', (chunk: string) => body += chunk);
            res.on('end', () => {
                // Debug
                const returnTime = Date.now();

                const avgAlcohol = Math.round(parseOffResult(body) * 10) / 10;
                resolve(avgAlcohol);
                console.log(`OpenFoodFacts query for '${category}' (avg. ${avgAlcohol} %vol) ended after ${returnTime - requestTime}ms`);
            });
        });
    });
});

interface OffResult {
    count: number;
    products: {
        no_nutrition_data: '' | 'on',
        nutriments: {
            alcohol?: number;
        }
    }[]
}

function parseOffResult(result: string): number {
    const { products, count } = (JSON.parse(result) as OffResult);

    // For global categories such as "beverages", building an average value is useless
    if(count > 1000)
        return 0;

    // Get all alcohol values from products
    const productsAlcohol = products
        .filter(el => el.no_nutrition_data === '')
        .map(product => product.nutriments.alcohol)
        .filter(val => val) as number[];
        
    if(productsAlcohol.length === 0)
        return 0;
        
    // Return average
    return productsAlcohol.reduce((sum, current) => sum + (+current || 0), 0) / productsAlcohol.length;
}