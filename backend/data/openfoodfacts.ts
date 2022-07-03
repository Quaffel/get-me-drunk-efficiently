import { cached } from "./util.js";
import { fetch } from './fetch.js';
import { persistedWithDomainArg } from "./persist.js";

export const getAlcohol = persistedWithDomainArg(async function fetchAlcohol(category: string): Promise<number> {
    const url = `https://world.openfoodfacts.org/category/${encodeURIComponent(category)}.json?page_size=50`;

    const requestTime = Date.now();
    const response = await fetch<'application/json'>(url, {
        method: 'GET',
        accept: 'application/json'
    });
    const returnTime = Date.now();

    if (response.type === 'error') {
        throw new Error(response.error);
    }

    if (response.type === 'redirect') {
        const newCategory = response.location!.replace('/category/', '').replace('.json', '');
        console.log(`OpenFoodFacts redirected ${category} -> ${newCategory}`);

        return await fetchAlcohol(newCategory);
    }

    const averageAlcohol = parseOffResult(response.body.content);

    // Ensure accuracy of a single decimal
    const roundedAverageAlcohol = Math.round(averageAlcohol * 10) / 10;

    console.log(`OpenFoodFacts query for '${category}' (avg. ${roundedAverageAlcohol} %vol) ended after ${returnTime - requestTime}ms`);
    return roundedAverageAlcohol;
}, (domainName) => `off-ingredient-${domainName}`);

interface FoodFactsResult {
    count: number;
    products: Array<{
        no_nutrition_data: '' | 'on',
        nutriments: {
            alcohol?: number;
        }
    }>;
}

function parseOffResult(result: string): number {
    const { products, count } = (JSON.parse(result) as FoodFactsResult);

    // For global categories such as "beverages", building an average value is useless
    if (count > 1000)
        return 0;

    // Get all alcohol values from products
    const productsAlcohol = products
        .filter(el => el.no_nutrition_data === '')
        .map(product => product.nutriments.alcohol)
        .filter(val => val) as number[];

    if (productsAlcohol.length === 0)
        return 0;

    // Return average
    return productsAlcohol.reduce((sum, current) => sum + (+current || 0), 0) / productsAlcohol.length;
}