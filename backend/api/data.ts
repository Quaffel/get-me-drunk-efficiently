import { IDrink, IIngredient } from '../../types';
import { IncomingMessage } from 'http';
import https from 'https';

const endpointHost = 'query.wikidata.org';
const endpointPath = 'sparql';
const userAgent = 'GetMeDrunkEfficiently/0.0 (https://github.com/Quaffel/get-me-drunk-efficiently)';

let cachedDrinks: IDrink[] = [];
let cachedIngredients: IIngredient[] = [];
let cachedAlcohol: { [category: string]: number } = {};

/** Get cached Drinks, most alcoholVolume first */
export function getDrinks(): IDrink[] {
    return cachedDrinks;
}

/** Get cached Ingredients */
export function getIngredients(): IIngredient[] {
    return cachedIngredients;
}

/** Get cached Alcohol */
export function getAlcohol(): { [category: string]: number } {
    return cachedAlcohol;
}


/** Fetch drinks from wikidata and cache response */
export async function fetchDrinks(): Promise<IDrink[]> {
    const query = `
    prefix wdt: <http://www.wikidata.org/prop/direct/>
    prefix wd: <http://www.wikidata.org/entity/>
    prefix bd: <http://www.bigdata.com/rdf#>
    prefix wikibase: <http://wikiba.se/ontology#>

    SELECT DISTINCT ?cocktail ?imageUrl ?cocktailLabel ?ingredientLabel ?offCategory ?alcohol ?ingredientAmount ?ingredientUnitLabel
    WHERE {
    # Retrieves all entities that are at least one of the following:
    # - an instance of "cocktail"
    # - a subclass of "cocktail"
    # - an instance of a subclass of "cocktail"
    ?cocktail wdt:P31?/wdt:P279* wd:Q134768.

    # Removes all classes (instances of Q16889133; "classes")
    FILTER NOT EXISTS {
        ?cocktail wdt:P31 wd:Q16889133.
    }

    # Retrieve the cocktail's image if available
    OPTIONAL { ?cocktail wdt:P18 ?imageUrl. }

    # Queries the English label explictly to exclude entities that don't have a proper English label.
    # Using SERVICE wikibase:label would expose the entity's identifier if no label is present.
    ?cocktail rdfs:label ?cocktailLabel.
    FILTER (lang(?cocktailLabel) = "en").

    # Retrieves a cocktail's ingredients based on the P186 ("made from material") property.
    # The identifiers for the Open Food Facts API are retrieved as well, if available.
    OPTIONAL {
        ?cocktail p:P186 ?ingredientStatement.

        ?ingredientStatement ps:P186 ?ingredient;
                            pqv:P1114/wikibase:quantityAmount ?ingredientAmount;
                            pqv:P1114/wikibase:quantityUnit ?ingredientUnit.


        # Queries the ingredient's and its unit's English label explicitly.
        ?ingredient rdfs:label ?ingredientLabel.
        FILTER (lang(?ingredientLabel) = "en").

        ?ingredientUnit rdfs:label ?ingredientUnitLabel.
        FILTER (lang(?ingredientUnitLabel) = "en").


        # If the ingredient is a subclass and/or an instance of another class, those classes are
        # queried as well if the entity itself doesn't hold sufficient information.
        # Querying those classes upfront might seem more efficient at first glance, but leads
        # to severe performance issues in practice (due to a data dependency that is hard to optimize).
        # That's why '?ingredientClass' and '?ingredientSuperclass' are queried several times.

        # Queries the ingredient's alcohol concentration by volume (percentage points).
        # If the ingredient itself doesn't have such a property, but the class the ingredient
        # is an instance or a subclass of has, the property of the respective class is used instead.
        OPTIONAL { ?ingredient wdt:P2665 ?ingredientAlcohol. }
        OPTIONAL { ?ingredient wdt:P31/wdt:P2665 ?ingredientClassAlcohol. }
        OPTIONAL { ?ingredient wdt:P279/wdt:P2665 ?ingredientSuperclassAlcohol. }
        BIND(COALESCE(?ingredientAlcohol, ?ingredientClassAlcohol, ?ingredientSuperclassAlcohol) AS ?alcohol).

        # Retrieves the ingredient's Open Food Facts category, if available.
        # If the ingredient itself doesn't have such aproperty, but the class the ingredient
        # is an instnace or a subclass of has, the property of the respective class is used instead.
        OPTIONAL { ?ingredient wdt:P1821 ?ingredientOffCategory. }
        OPTIONAL { ?ingredient wdt:P31/wdt:P1821 ?ingredientClassOffCategory. }
        OPTIONAL { ?ingredient wdt:P279/wdt:P1821 ?ingredientSuperclassOffCategory. }
        BIND(COALESCE(?ingredientOffCategory, ?ingredientClassOffCategory, ?ingredientSuperclassOffCategory) AS ?offCategory).

        # Removes all Open Food Facts category identifiers that include a colon (':').
        # Colons are only part of regionalized identifiers.  As the application queries the 
        # world-wide database (world.openfoodfacts.org), however, only the universal identifiers are required.
        FILTER (!CONTAINS(IF(BOUND(?offCategory), ?offCategory, ""), ":"))
    }

    # Retrieves a cocktail's ingredients based on the P4330 ("contains") property.
    # The identifiers for the Open Food Facts API are retrieved as well, if available.
    OPTIONAL {
        ?cocktail p:P4330 ?ingredientStatement.

        ?ingredientStatement ps:P4330 ?ingredient;
                            pqv:P1114/wikibase:quantityAmount ?ingredientAmount;
                            pqv:P1114/wikibase:quantityUnit ?ingredientUnit.


        # Queries the ingredient's and its unit's English label explicitly.
        ?ingredient rdfs:label ?ingredientLabel.
        FILTER (lang(?ingredientLabel) = "en").

        ?ingredientUnit rdfs:label ?ingredientUnitLabel.
        FILTER (lang(?ingredientUnitLabel) = "en").


        # Queries the ingredient's alcohol concentration by volume (percentage points).
        OPTIONAL { ?ingredient wdt:P2665 ?ingredientAlcohol. }
        OPTIONAL { ?ingredient wdt:P31/wdt:P2665 ?ingredientClassAlcohol. }
        OPTIONAL { ?ingredient wdt:P279/wdt:P2665 ?ingredientSuperclassAlcohol. }
        BIND(COALESCE(?ingredientAlcohol, ?ingredientClassAlcohol, ?ingredientSuperclassAlcohol) AS ?alcohol).

        # Retrieves the ingredient's Open Food Facts category, if available.
        OPTIONAL { ?ingredient wdt:P1821 ?ingredientOffCategory. }
        OPTIONAL { ?ingredient wdt:P31/wdt:P1821 ?ingredientClassOffCategory. }
        OPTIONAL { ?ingredient wdt:P279/wdt:P1821 ?ingredientSuperclassOffCategory. }
        BIND(COALESCE(?ingredientOffCategory, ?ingredientClassOffCategory, ?ingredientSuperclassOffCategory) AS ?offCategory).

        FILTER (!CONTAINS(IF(BOUND(?offCategory), ?offCategory, ""), ":"))
    }

    # Retrieves a cocktail's ingredients based on the P527 ("has part") property.
    # The identifiers for the Open Food Facts API are retrieved as well, if available.
    OPTIONAL {
        ?cocktail p:P527 ?ingredientStatement.

        ?ingredientStatement ps:P527 ?ingredient;
                            pqv:P1114/wikibase:quantityAmount ?ingredientAmount;
                            pqv:P1114/wikibase:quantityUnit ?ingredientUnit.


        # Queries the ingredient's and its unit's English label explicitly.
        ?ingredient rdfs:label ?ingredientLabel.
        FILTER (lang(?ingredientLabel) = "en").

        ?ingredientUnit rdfs:label ?ingredientUnitLabel.
        FILTER (lang(?ingredientUnitLabel) = "en").


        # Queries the ingredient's alcohol concentration by volume (percentage points).
        OPTIONAL { ?ingredient wdt:P2665 ?ingredientAlcohol. }
        OPTIONAL { ?ingredient wdt:P31/wdt:P2665 ?ingredientClassAlcohol. }
        OPTIONAL { ?ingredient wdt:P279/wdt:P2665 ?ingredientSuperclassAlcohol. }
        BIND(COALESCE(?ingredientAlcohol, ?ingredientClassAlcohol, ?ingredientSuperclassAlcohol) AS ?alcohol).

        # Retrieves the ingredient's Open Food Facts category, if available.
        OPTIONAL { ?ingredient wdt:P1821 ?ingredientOffCategory. }
        OPTIONAL { ?ingredient wdt:P31/wdt:P1821 ?ingredientClassOffCategory. }
        OPTIONAL { ?ingredient wdt:P279/wdt:P1821 ?ingredientSuperclassOffCategory. }
        BIND(COALESCE(?ingredientOffCategory, ?ingredientClassOffCategory, ?ingredientSuperclassOffCategory) AS ?offCategory).

        FILTER (!CONTAINS(IF(BOUND(?offCategory), ?offCategory, ""), ":"))
    }
    }

    ORDER BY ASC(?cocktailLabel)
    `;

    const url = `https://${endpointHost}/${endpointPath}`;
    const postData = `query=${encodeURIComponent(query)}`;

    return new Promise<IDrink[]>((resolve, reject) => {
        const requestTime = Date.now();
        const request = https.request(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/sparql-results+json',
                'User-Agent': userAgent,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res: IncomingMessage) => {
            let body: string = '';
            res.on('error', (err) => reject(err));
            res.on('data', (chunk: string) => body += chunk);
            res.on('end', async () => {
                // Debug
                const returnTime = Date.now();
                console.log(`Wikidata query ended after ${returnTime - requestTime}ms`);
                // console.log(`Wikidata responded with`, body);

                resolve(await parseWikidataResult(body));
            });
        });

        // Write request body
        request.write(postData);
        request.end();
    }).then(drinks => {

        drinks.sort((a, b) => (b.alcoholVolume ?? 0) - (a.alcoholVolume ?? 0));

        // Cache drinks
        cachedDrinks = drinks;

        // Cache ingredients;
        cachedIngredients = [];
        drinks.map(drink => drink.ingredients.map(ingredientAmount => ingredientAmount.ingredient)).flat().forEach(ingredient => {
            if (!cachedIngredients.map(el => el.name).includes(ingredient.name))
                cachedIngredients.push(ingredient);
        });

        return drinks;
    });
}

// Parses SPARQL cocktail results to drink array
async function parseWikidataResult(sparqlResult: string): Promise<IDrink[]> {
    const data = JSON.parse(sparqlResult);

    // Type results
    type sparqlValue<T> = {
        type: 'uri' | 'literal';
        value: T;
    };

    const cocktailTable = data.results.bindings as {
        cocktail: sparqlValue<string>;
        cocktailLabel: sparqlValue<string>;
        alcohol?: sparqlValue<number>;
        ingredientLabel?: sparqlValue<string>;
        ingredientAmount?: sparqlValue<number>;
        ingredientUnitLabel?: sparqlValue<string>;
        offCategory?: sparqlValue<string>;
        imageUrl?: sparqlValue<string>;
    }[];

    // Fetch alcohol for all categorys
    const uniqueCategorys = cocktailTable.map(el => el.offCategory?.value).filter((val, i, self) => val && self.indexOf(val) === i) as string[];
    await Promise.all(uniqueCategorys.map(category => fetchAlcohol(category)));


    // Aggregate drink information
    const drinks: { [id: string]: IDrink } = {};
    cocktailTable.forEach(el => {
        // Do not add IngredientAmount if empty
        if (!el.ingredientLabel || !el.ingredientAmount || !el.ingredientUnitLabel) return;

        // Do not add IngredientAmount if amount is 0ml or less
        const amount = normalize(el.ingredientAmount.value, el.ingredientUnitLabel.value);
        if(amount.val <= 0) return;

        // Drink does not exists
        if (!drinks[el.cocktail.value]) {
            drinks[el.cocktail.value] = {
                name: el.cocktailLabel.value,
                image: el.imageUrl?.value,
                ingredients: [],
                alcoholVolume: 0,
            }
        }

        // Try to aggregate Openfoodfacts-data if alcohol not set
        if(!el.alcohol && el.offCategory) el.alcohol = { 
            type: 'literal',
            value: getAlcohol()[el.offCategory.value] || 0 
        };

        // Add IngredientAmount
        drinks[el.cocktail.value].ingredients.push({
            ingredient: {
                name: el.ingredientLabel.value,
                alcohol: el.alcohol ? el.alcohol.value / 100 : 0
            },
            amount: amount.val,
            unit: amount.unit
        });

        drinks[el.cocktail.value]!.alcoholVolume += amount.val * (el.alcohol?.value ?? 0) / 100;
        console.log(`Increased alcohol volume of ${el.cocktail.value} to ${drinks[el.cocktail.value]!.alcoholVolume}`);
    });

    return Object.values(drinks);
}

/** Fetch alcohol for given category from openfoodfacts and cache response */
export async function fetchAlcohol(category: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
        const url = `https://world.openfoodfacts.org/category/${encodeURIComponent(category)}.json?page_size=50`;
        const requestTime = Date.now();
        const request = https.get(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': userAgent
            }
        }, async (res: IncomingMessage) => {
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
    }).then((alcohol) => {
        // Cache Alcohol for category
        cachedAlcohol[category] = alcohol;
        return alcohol;
    });
}

interface offResult {
    count: number;
    products: {
        no_nutrition_data: '' | 'on',
        nutriments: {
            alcohol?: number;
        }
    }[]
}

function parseOffResult(result: string): number {
    const { products, count } = (JSON.parse(result) as offResult);

    // Get all alcohol values from products
    const productsAlcohol = products.filter(el => el.no_nutrition_data === '').map(product => product.nutriments.alcohol).filter(val => val) as number[];

    // For global categories such as "beverages", building an avergae value is useless
    if(count > 1000)
        return 0;
        
    // Return average
    return productsAlcohol.reduce((sum, current) => sum + (+current), 0) / productsAlcohol.length;
}

function normalize(ingredientAmount: number, unit: string): { val: number, unit: string } {
    // Convert every known unit to ml
    switch(unit) {
        case 'fluid ounce': return { val: ingredientAmount * 29.5735, unit: 'ml' };
        case 'centilitre': return { val: ingredientAmount * 10, unit: 'ml' };
        case 'splash': return { val: ingredientAmount * 3.7, unit: 'ml' };
        case 'dash': return { val: ingredientAmount * 0.9, unit: 'ml' };
        case 'millilitre': return { val: ingredientAmount, unit: 'ml' };
        case 'teaspoon': return { val: ingredientAmount * 3.7, unit: 'ml' };
        case 'bar spoon': return { val: ingredientAmount * 2.5, unit: 'ml' };
        case 'ounce': return { val: ingredientAmount * 29.5735, unit: 'ml' };
        case 'Stemware': return { val: ingredientAmount * 150, unit: 'ml' };
        case 'tablespoon': return { val: ingredientAmount * 11.1, unit: 'ml' };
        case 'drop': return { val: ingredientAmount * 0.05, unit: 'ml' };
        case 'teaspoon (metric)': return { val: ingredientAmount * 3.7, unit: 'ml' };
        case 'pinch': return { val: ingredientAmount * 0.31, unit: 'ml' };
        case '1': return { val: ingredientAmount * 29.5735, unit: 'ml' };

        default: return { val: ingredientAmount, unit: unit };
    }
}