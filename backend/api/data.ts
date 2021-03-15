import { IDrink } from '../../types';
import { IncomingMessage } from 'http';
import https from 'https';

const endpointHost = 'query.wikidata.org';
const endpointPath = 'sparql';
const userAgent = 'GetMeDrunkEfficiently/0.0 (https://github.com/Quaffel/get-me-drunk-efficiently)';

let cachedDrinks: IDrink[] = [];

/** Get cached Drinks */
export function getDrinks(): IDrink[] {
    return cachedDrinks;
}

/** Fetch drinks from wikidata and cache response */
export async function fetchDrinks(): Promise<IDrink[]> {
    const query = `
    prefix wdt: <http://www.wikidata.org/prop/direct/>
    prefix wd: <http://www.wikidata.org/entity/>
    prefix bd: <http://www.bigdata.com/rdf#>
    prefix wikibase: <http://wikiba.se/ontology#>
    
    SELECT DISTINCT ?cocktail ?cocktailLabel ?ingredientLabel ?offCategory ?offIngredient ?ingredientAmount ?ingredientUnitLabel
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
    
    
        # Retrieves the ingredient's Open Food Facts category and ingredient identifiers, if available.
        OPTIONAL { ?ingredient wdt:P1821 ?offCategory. }
        OPTIONAL { ?ingredient wdt:P5930 ?offRawIngredient. }
    
        # Discards ingredient identifiers if category identifier is given since ingredients with 
        # mulitple ingredient identifiers are way more likely than ingredients with multiple category identifiers.
        BIND(IF(BOUND(?offCategory), "", ?offRawIngredient) AS ?offIngredient).
    
        # Removes all Open Food Facts identifiers that include a colon (':').
        # Colons are only part of regionalized identifiers.  As the application queries the 
        # world-wide database (world.openfoodfacts.org), however, only the universal identifiers are required.
        FILTER (!CONTAINS(IF(BOUND(?offCategory), ?offCategory, ""), ":"))
        FILTER (!CONTAINS(IF(BOUND(?offIngredient), ?offIngredient, ""), ":"))
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
    
    
        # Retrieves the ingredient's Open Food Facts category and ingredient identifiers, if available.
        OPTIONAL { ?ingredient wdt:P1821 ?offCategory. }
        OPTIONAL { ?ingredient wdt:P5930 ?offRawIngredient. }
    
        # Discards ingredient identifiers if category identifier is given since ingredients with 
        # mulitple ingredient identifiers are way more likely than ingredients with multiple category identifiers.
        BIND(IF(BOUND(?offCategory), "", ?offRawIngredient) AS ?offIngredient).
    
        # Removes all Open Food Facts identifiers that include a colon (':').
        # Colons are only part of regionalized identifiers.  As the application queries the 
        # world-wide database (world.openfoodfacts.org), however, only the universal identifiers are required.
        FILTER (!CONTAINS(IF(BOUND(?offCategory), ?offCategory, ""), ":"))
        FILTER (!CONTAINS(IF(BOUND(?offIngredient), ?offIngredient, ""), ":"))
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
    
    
        # Retrieves the ingredient's Open Food Facts category and ingredient identifiers, if available.
        OPTIONAL { ?ingredient wdt:P1821 ?offCategory. }
        OPTIONAL { ?ingredient wdt:P5930 ?offRawIngredient. }
    
        # Discards ingredient identifiers if category identifier is given since ingredients with 
        # mulitple ingredient identifiers are way more likely than ingredients with multiple category identifiers.
        BIND(IF(BOUND(?offCategory), "", ?offRawIngredient) AS ?offIngredient).
    
        # Removes all Open Food Facts identifiers that include a colon (':').
        # Colons are only part of regionalized identifiers.  As the application queries the 
        # world-wide database (world.openfoodfacts.org), however, only the universal identifiers are required.
        FILTER (!CONTAINS(IF(BOUND(?offCategory), ?offCategory, ""), ":"))
        FILTER (!CONTAINS(IF(BOUND(?offIngredient), ?offIngredient, ""), ":"))
      }
    }
    ORDER BY ASC(?cocktailLabel)
    `;

    const url = `https://${endpointHost}/${endpointPath}`;
    const postData = `query=${encodeURIComponent(query)}`;

    return new Promise<IDrink[]>((resolve, reject) => {
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
            res.on('end', () => resolve(parseResult(body)));
        });

        // Write request body
        request.write(postData);
        request.end();
    }).then(drinks => cachedDrinks = drinks);
}

// Parses SPARQL cocktail results to drink array
function parseResult(sparqlResult: string): IDrink[] {
    const data = JSON.parse(sparqlResult);

    // Type results
    type sparqlValue<T> = { 
        type: 'uri' | 'literal';
        value: T;
    }
    const cocktailTable = data.results.bindings as {
        cocktail: sparqlValue<string>;
        cocktailLabel: sparqlValue<string>;
        ingredientLabel?: sparqlValue<string>;
        ingredientAmount?: sparqlValue<Number>;
        ingredientUnitLabel?: sparqlValue<string>;
    }[];

    // Aggregate drink information
    const drinks: { [id: string]: IDrink } = {};
    cocktailTable.forEach(el => {
        // Drink does not exists
        if(!drinks[el.cocktail.value]) {
            drinks[el.cocktail.value] = {
                name: el.cocktailLabel.value,
                ingredients: []
            }
        }

        // Add ingredient if not empty
        if(el.ingredientLabel) drinks[el.cocktail.value].ingredients.push({
            name: el.ingredientLabel.value
        });
    });
    let result = Object.values(drinks);

    // Remove drinks without ingredients
    result = result.filter(drink => drink.ingredients.length > 0);

    return result;
}