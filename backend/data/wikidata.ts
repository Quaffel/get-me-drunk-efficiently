import { fetch } from './fetch';

import { IDrink, IIngredient } from "../../types";
import { getAlcohol } from './openfoodfacts';
import { isTrivialUnit, isUnit, isVolumetricUnit } from '../../types';
import { fetchScalingImageInfo } from './wikimedia-imageinfo';
import { normalize, once } from './util';

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

interface SparqlValue {
    type: 'uri' | 'literal';
    value: string;
};

interface WikidataCocktail {
    cocktail: SparqlValue;
    cocktailLabel: SparqlValue;
    alcoholPercentagePoints?: SparqlValue;
    ingredientLabel?: SparqlValue;
    ingredientAmount?: SparqlValue;
    ingredientUnitLabel?: SparqlValue;
    offCategory?: SparqlValue;
    imageUrl?: SparqlValue;
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
    return parsedResponse.results.bindings;
}

function toDrinksAndIngredients(cocktails: WikidataCocktail[]): { drinks: IDrink[], ingredients: IIngredient[] } {
    // As fetching drinks with ingredients increases cardinality, we need to regroup the results by drink
    const drinks = new Map<string, IDrink>();
    const ingredients = new Map<string, IIngredient>();

    let discardedEntries = 0;
    let discardedDrinks = new Set<string>();

    for (let {
        cocktail, cocktailLabel, imageUrl,
        alcoholPercentagePoints, ingredientAmount, ingredientLabel, ingredientUnitLabel, offCategory
    } of cocktails) {
        function discardResult(reason: string) {
            console.error(`Warning: Discard ingredient "${ingredientLabel?.value}" `
                + `of cocktail "${cocktailLabel.value}" ` 
                + `with the unit "${ingredientUnitLabel?.value}". `
                + `Reason: ${reason}`);
            
            discardedEntries++;
            discardedDrinks.add(cocktailLabel.value); // Risk potential "undefined" entry.
        }

        if (!ingredientLabel || !ingredientAmount || !ingredientUnitLabel) {
            // Reached whenever a row lacks entries.  Possible scenarios are:
            // - ingredient lacks a quantity
            //   - it does naturally not have any quantity (garnish, glasses, ice cubes)
            //   - data is incomplete
            // - cocktail does not have any ingredient whatsoever
            //   - Wikidata entry represents a family of drinks
            //   - data is incomplete 
            discardResult("Unknown ingredient label, amount, or unit (possibly legitimate)");
            continue;
        }

        const numericIngredientAmount = Number.parseFloat(ingredientAmount.value);
        if (Number.isNaN(numericIngredientAmount)) {
            discardResult("Non-numeric ingredient amount");
        }

        const numericAlcoholPercentagePoints = alcoholPercentagePoints !== undefined 
            ? Number.parseFloat(alcoholPercentagePoints.value)
            : 0;
        if (Number.isNaN(numericAlcoholPercentagePoints)) {
            discardResult("Non-numeric alcohol concentration");
        }

        const ingredientUnit = ingredientUnitLabel.value;
        if (!isUnit(ingredientUnit)) {
            discardResult("Unknown unit");
            continue;
        }

        if (numericIngredientAmount < 0) {
            discardResult("Illegal negative amount");
            continue;
        }
        if (numericIngredientAmount === 0 && isVolumetricUnit(ingredientUnit)) {
            discardResult("Illegal zero amount (volumetric unit)");
            continue;
        }
        let { amount: trivialAmount, unit: trivialUnit } = isTrivialUnit(ingredientUnit)
            ? { amount: numericIngredientAmount, unit: ingredientUnit }
            : { amount: normalize(numericIngredientAmount, ingredientUnit), unit: 'ml' } as const;

        let drink = drinks.get(cocktail.value);
        if (!drink) {
            drink = {
                name: cocktailLabel.value,
                image: imageUrl?.value,
                ingredients: [],
                alcoholVolume: 0
            };
            drinks.set(cocktail.value, drink);
        }

        let ingredient = ingredients.get(ingredientLabel.value);
        if (!ingredient) {
            ingredient = {
                name: ingredientLabel.value,
                category: offCategory?.value,
                alcoholConcentration: numericAlcoholPercentagePoints / 100
            };
            ingredients.set(ingredientLabel.value, ingredient);
        }

        // If an ingredient has multiple categories, it will appear in multiple rows.  We must therefore
        // ensure that the ingredient isn't present yet.
        if (drink.ingredients.find(it => it.ingredient.name === ingredient!.name) === undefined) {
            drink.ingredients.push({
                ingredient: ingredient,
                amount: trivialAmount,
                unit: trivialUnit
            });
        }
    }

    console.log(`Wikidata: Fetched ${drinks.size} drinks with ${ingredients.size} unique ingredients`);
    console.log(`Wikidata: Discarded ${discardedEntries} entries of ${discardedDrinks.size} drinks `
        + `because of data quality issues`);

    return {
        drinks: [...drinks.values()],
        ingredients: [...ingredients.values()],
    };
}

async function enrichAlcohol(ingredient: IIngredient) {
    if (ingredient.alcoholConcentration) return;
    if (!ingredient.category) return;

    ingredient.alcoholConcentration = await getAlcohol(ingredient.category);

    console.log(`Wikidata enriched alcohol of ${ingredient.name} (category: ${ingredient.category}) to ${ingredient.alcoholConcentration}`);
}

function accumulateTotal(drink: IDrink) {
    drink.alcoholVolume = drink.ingredients.reduce(
        (sum, { amount, unit, ingredient: { alcoholConcentration: alcohol } }) => {
            let normalizedAmount = unit === 'ml'
                ? amount
                : normalize(amount, unit);
            return sum + normalizedAmount * alcohol / 100;
        }, 
        0
    );

    console.log(`Wikidata accumulated alcohol of ${drink.name} to ${drink.alcoholVolume}%vol`);
}

// Normalization is the process of transforming one URL of one service of the Wikimedia Foundation to 
// another URL that points to the same resources.  This is necessary due to a mismatch of URL schemes
// in different APIs, namely Wikidata-provided data and the information provided by other APIs.  
// Besides differences in the URL schemes, there are also subtle differences in how 
// URI component encoding is performed.
//
// The images requested from Wikidata (via property P18) follow the scheme
//   http://commons.wikimedia.org/wiki/Special:FilePath/<image_identifier>
// All non-latin characters are encoded using the percent sign-based URI encoding scheme.
// Words are separated by whitespace characters (encoded as '%20').
// (As a sidenote: The data returned by the Wikidata Query Service violates the URL scheme provided in
// item P18.  It is unclear why this mismatch occurs, especially because it is properly displayed in
// the query builder on https://query.wikidata.org/.)
//
// The Wikimedia API deals with URLs that follow the scheme
//   https://commons.wikimedia.org/wiki/<image_identfier>
// Most non-latin characters are encoded using the percent sign-based URI encoding scheme.  The special characters
// "$-_.+!*'()," (as per RFC 1738), however, are provided unencoded in the URL.
// Words are separated by underscore characters.
//
// During the conversion from the former scheme to the latter, we do not re-encode the URI.
// It is expected that any sane fetch API/URL builder will do so once an actual request is performed.
function normalizeWikimediaUrl(drinkUrl: string): string | null {
    const imageUrl = new URL(drinkUrl);
    const matchInfo = imageUrl.pathname.match(/\/wiki\/Special:FilePath\/([\w\d\-%_]+\.\w{1,3})/);

    return matchInfo !== null
        ? "https://commons.wikimedia.org/wiki/File:" + decodeURIComponent(matchInfo[1]).replace(/ /g, "_")
        : null;
}

const getDrinksAndIngredients = once(async () => {
    const result = await fetchDrinkData();
    const { drinks, ingredients } = toDrinksAndIngredients(result);

    // Fetch additional information on alcohol contents from Open Food Facts 
    // and adjust the ingredients' alcohol property.
    await Promise.all(ingredients.map(enrichAlcohol));
    
    // Accumulate the the drinks' respective total alcohol volume.
    drinks.forEach(accumulateTotal);

    // Normalize the Wikimedia image URLs.  
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

    return { drinks, ingredients };
});


export const getDrinks =      () => getDrinksAndIngredients().then(it => it.drinks);
export const getIngredients = () => getDrinksAndIngredients().then(it => it.ingredients);
