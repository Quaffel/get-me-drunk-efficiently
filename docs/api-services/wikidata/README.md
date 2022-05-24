# Usage of Wikidata Query Service

## Motivation

The Wikidata Query Service provides

## Basic concepts

### SPARQL

#### Triple patterns in queries

Each query consists of a set of triples that express the relations the requested data should be in.

A triple consists of a subject, a predicate, and an object; just like a English sentence.
This makes it quite easy to reason about the meaning of such a tuple.

Suppose you want to query all the ingredients the well-known cocktail "Mojito" is made of.

```raw
'Mojito' 'is made of' <ingredient>
```

Due to the similarities of SPARQL and the English language, this schema translates quite well into a SPARQL query.

```rq
SELECT ?ingredient
WHERE
{
  wd:Q487338 wdt:P186 ?ingredient           
}
```

`wd:Q487338` (an entity) denotes the subject "Mojito", `wdt:P186` (a property) the predicate "made from material" and `?ingredient` (an entity) the object.
Replacing the cryptic identifiers with their actual meaning results in a sentence that is quite similar to the one stated above.

Query variables can be either be a subject or an object.
Given that other, more restricting triples are present in the query, a single tuple may be comprised of two path variables; one as the tuple's subject and the other one as the object.

#### Prefixes

- `wd` stands for Wikidata
- `t` stands for truthy wdt
- `Q` stands for Q-item
- `P` stands for property

## Querying all cocktails

Unfortunately, the following, intuitive query isn't sufficient.

```raw
"<cocktail> 'is an instance of' 'cocktail'"
```

```rq
SELECT ?cocktail
WHERE
{
  ?cocktail wdt:P279* wd:Q134768.
}
```

The query yields 477 results, but the list is incomplete.
For instance, one of the most well-known cocktails, the "Mojito", is missing.
Taking a look at the entity `Q487338` ("Mojito") unveils why this is happening:

Ingredients:

- "has part": P527
- "made from material": P186
