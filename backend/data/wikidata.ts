import { IncomingMessage } from 'http';
import https from 'https';

import { IDrink, IIngredient } from "../../types";
import { getAlcohol } from './openfoodfacts';
import { cached, normalize, once, USER_AGENT } from './util';

const URL = 'https://query.wikidata.org/sparql';

const DRINK_QUERY = `
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

type SparqlValue<T> = {
    type: 'uri' | 'literal';
    value: T;
};

interface WikidataCocktail {
    cocktail: SparqlValue<string>;
    cocktailLabel: SparqlValue<string>;
    alcohol?: SparqlValue<number>;
    ingredientLabel?: SparqlValue<string>;
    ingredientAmount?: SparqlValue<number>;
    ingredientUnitLabel?: SparqlValue<string>;
    offCategory?: SparqlValue<string>;
    imageUrl?: SparqlValue<string>;
};

function fetchDrinkData(): Promise<WikidataCocktail[]> {
    const postData = `query=${encodeURIComponent(DRINK_QUERY)}`;

    return new Promise<WikidataCocktail[]>((resolve, reject) => {
        const requestTime = Date.now();
        const request = https.request(URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/sparql-results+json',
                'User-Agent': USER_AGENT,
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

                const result = JSON.parse(body);
                resolve(result.results.bindings);
            });
        });

        // Write request body
        request.write(postData);
        request.end();
    });
}

function toDrinksAndIngredients(cocktails: WikidataCocktail[]): { drinks: IDrink[], ingredients: IIngredient[] } {
        // As fetching drinks with ingredients increases cardinality, we need to regroup the results by drink
        const drinks = new Map<string, IDrink>();
        const ingredients = new Map<string, IIngredient>();

        for(let { cocktail, cocktailLabel, alcohol, imageUrl, ingredientAmount, ingredientLabel, ingredientUnitLabel, offCategory } of cocktails) {
            if (!ingredientLabel || !ingredientAmount || !ingredientUnitLabel) 
                continue;

            const amount = normalize(ingredientAmount.value, ingredientUnitLabel.value);
            if(amount.val <= 0) 
                continue;

            let drink = drinks.get(cocktail.value);

            if(!drink) {
                drink = {
                    name: cocktailLabel.value,
                    image: imageUrl?.value,
                    ingredients: [],
                    alcoholVolume: 0
                };
                drinks.set(cocktail.value, drink);
            }

            let ingredient = ingredients.get(ingredientLabel.value);

            if(!ingredient) {
                ingredient = {
                    name: ingredientLabel.value,
                    category: offCategory?.value,
                    alcohol: alcohol ? alcohol.value / 100 : 0
                };
                ingredients.set(ingredientLabel.value, ingredient);
            }

             // Add IngredientAmount
             drink.ingredients.push({
                ingredient,
                amount: amount.val,
                unit: amount.unit
            });
        
        }

        console.log(`Wikidata fetched ${drinks.size} drinks with ${ingredients.size} unique ingredients`);
    
        return { 
            drinks: [...drinks.values()],
            ingredients: [...ingredients.values()],
        };
}

async function enrichAlcohol(ingredient: IIngredient) {
    if(ingredient.alcohol) return;
    if(!ingredient.category) return;

    ingredient.alcohol = await getAlcohol(ingredient.category);

    console.log(`Wikidata enriched alcohol of ${ingredient.name} (category: ${ingredient.category}) to ${ingredient.alcohol}`);
}

function accumulateTotal(drink: IDrink) {
    drink.alcoholVolume = drink.ingredients.reduce(
        (sum, { amount, ingredient: { alcohol }}) => sum + amount * alcohol / 100, 
        0
    );

    console.log(`Wikidata accumulated alcohol of ${drink.name} to ${drink.alcoholVolume}%vol`);
}

const getDrinksAndIngredients = once(async () => {
    const result = await fetchDrinkData();
    const { drinks, ingredients } = toDrinksAndIngredients(result);

    // then fetch additional alcohol data from OpenFoodFacts
    await Promise.all(ingredients.map(enrichAlcohol));
    
    // as all data is now present, accumulate totals
    drinks.forEach(accumulateTotal);

    return { drinks, ingredients };
});


export const getDrinks =      () => getDrinksAndIngredients().then(it => it.drinks);
export const getIngredients = () => getDrinksAndIngredients().then(it => it.ingredients);
