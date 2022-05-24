# Usage of Open Food Facts API

## General

The Open Food Facts API provides access to manifold information on everything the food and beverages industry has to offer.
With more than 1.6 million listed items, Open Food Facts provides data on almost every product available in Western countries.

The "Get me drunk efficiently" project leverages the API to retrieve information on an ingredient's alcohol concentration.
The required category identifiers are provided by Wikidata.

To detect and fill Wikidata's gaps more effectively, the project might also make use of the search API to determine the alcohol concentration dynamically in the future.

## API request

An exemplary request can be found [here](./query-category.http).

Please note: It's strongly recommended to set the user agent before sending requests to any Open Food Facts endpoint.  
This requirement is not strictly enforced, but clients sending multiple requests without passing a user agent may be blocked without further notice.

## API response

The response is provided in the JSON format and comprises a list of products and some additional metadata.

By default, each product object contains all the information Open Food Facts stores about that particular product.
Unfortunately, there's no obvious/documented way to restrict the response to only a couple of attributes.
For more information, please refer to the [official documentation](https://wiki.openfoodfacts.org/API/Read).

### Product

A product contains several attributes, such as the product's name, its availability in certain regions or nutritional data.
Unfortunately, it's not possible to only query a limited set of properties.
That is, the application must filter the attributes on its own.

The alcohol concentration is part of the `nutriments` (making alcohol an official nutriment) attribute.
It is comprised of several nested attributes, with information on carbohydrates, fat and, well, alcohol (if applicable).
The relevant nested attributes are:

- `alcohol_unit` (with `% vol` being the relevant value)
- `alcohol_serving`
- `alcohol_value`
- `alcohol_100g`
- `alcohol`

Implementations should also check for the following attributes to check whether a product entry is complete.
If it isn't, it might be better to skip the current product and pick another one from the sample.

`no_nutrition_data`
`complete` (to be distinguished from `completeness`)
