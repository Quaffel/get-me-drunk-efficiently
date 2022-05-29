import { fetch } from './fetch';

import { IDrink, IIngredient } from "../../types";
import { getAlcohol } from './openfoodfacts';
import { NonEmptyArray, normalize, once } from './util';
import { fetchScalingImageInfo } from './wikimedia-imageinfo';

const SERVICE_URL = 'https://query.wikidata.org/sparql';

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

async function fetchDrinkData(): Promise<WikidataCocktail[]> {
    const postData = `query=${encodeURIComponent(DRINK_QUERY)}`;

    const requestTime = Date.now();
    const result = await fetch<'application/sparql-results+json'>(SERVICE_URL, {
        method: 'POST',
        accept: 'application/sparql-results+json',
        body: {
            mimeType: 'application/x-www-form-urlencoded',
            content: postData
        }
    });
    const returnTime = Date.now();
    console.log(`Wikidata query ended after ${returnTime - requestTime}ms`);

    if (result.type === 'error') {
        throw new Error(result.error);
    }
    if (result.type === 'redirect') {
        throw new Error("Unexpected redirect");
    }

    const parsedResponse: any = JSON.parse(result.body.content);
    console.log(result.body.content);
    return parsedResponse.results.bindings;
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
                console.log(imageUrl?.value);
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

function normalizeWikimediaUrl(drinkUrl: string): string | null {
    const imageUrl = new URL(drinkUrl);
    const matchInfo = imageUrl.pathname.match(/\/wiki\/Special:FilePath\/([\w\d\-%_]+\.\w{1,3})/);

    if (matchInfo === null) {
        console.log("Warning: Image URL does not match the expected pattern", imageUrl);
        return null;
    }

    return "https://commons.wikimedia.org/wiki/File:" + decodeURIComponent(matchInfo[1]).replace(/ /g, "_");
}

const getDrinksAndIngredients = once(async () => {
    const result = await fetchDrinkData();
    const { drinks, ingredients } = toDrinksAndIngredients(result);

    const oldDrinkUrls = drinks.map(it => it.image);

    // then fetch additional alcohol data from OpenFoodFacts
    // await Promise.all(ingredients.map(enrichAlcohol));
    
    // as all data is now present, accumulate totals
    drinks.forEach(accumulateTotal);
    drinks.forEach(it => { 
        if (it.image) { 
            const normalizedUrl = normalizeWikimediaUrl(it.image) ;
            if (!normalizedUrl) {
                console.error(`Warning: Failed to normalize the Wikimedia URL "${it.image}" for drink ${it.name}`);
                return;
            }

            it.image = normalizedUrl;
        }
    });

    const images = await fetchScalingImageInfo(drinks, { width: 300, height: 300 });
    for (let [drinkName, imageInfo] of Object.entries(images!)) {
        const drink = drinks.find(it => it.name === drinkName);
        if (drink === undefined) {
            console.error("Warning: Couldn't map the image info back to a drink");
            continue;
        }

        drink.image = imageInfo.scaledImage.url;
    }

    console.log(oldDrinkUrls);

    return { drinks, ingredients };
});


export const getDrinks =      () => getDrinksAndIngredients().then(it => it.drinks);
export const getIngredients = () => getDrinksAndIngredients().then(it => it.ingredients);
