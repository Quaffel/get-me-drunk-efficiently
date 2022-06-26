import { types } from '@get-me-drunk/common';
import { getDrinks } from '../data/index.js';

const ALCOHOL_GRAM_TO_ML = 16 / 10;

export async function getOptimalDrinkAmounts(
    availableIngredients: Array<types.IIngredient["name"]>,
    promille: number,
    weight: number
): Promise<types.IDrinkAmount[]> {
    const allDrinks = await getDrinks();

    // Filter drinks with missing ingredients
    let availableDrinks: types.IDrink[] = [];

    if (availableIngredients.length) {
        availableDrinks = allDrinks.filter(drink =>
            areIngredientsAvailable(
                drink.ingredients.map(ingredientAmount => ingredientAmount.ingredient),
                availableIngredients
            )
        );
    } else {
        availableDrinks = allDrinks;
    }

    console.log(`From ${allDrinks.length} drinks, ${availableDrinks.length} are available`);


    // Approximate target total alcohol in ml based on weight and promille
    const targetAlcoholMl = calculateTargetAlcohol(promille, weight);


    // a drink might be yielded multiple times, group them as DrinkAmounts
    const drinkAmount = new Map<types.IDrink, number>();

    for (const drink of getDrinksByMostAlc(targetAlcoholMl, availableDrinks)) {
        drinkAmount.set(drink, (drinkAmount.get(drink) ?? 0) + 1);
    }

    const optimal: types.IDrinkAmount[] = [...drinkAmount.entries()].map(([drink, amount]) => ({ drink, amount }));

    const resultingAlcoholVolume = optimal
        .reduce((sum, { drink, amount }) => sum + amount * drink.alcoholVolume, 0);

    // Debug output
    console.log(`Evaluated ${0 /* combinations.length */} combinations of ${availableDrinks.length} possible drinks:
      Weight > ${weight}kg
      Target > ${promille}%°
      Target > ${targetAlcoholMl}ml alcohol
      Found > ${resultingAlcoholVolume}ml alcohol
        ${optimal.map(({ drink, amount }) => `\n  Drink > ${amount}x ${drink.name} (${drink.alcoholVolume}%vol per Drink)`)}
    `);

    return optimal;
}

function calculateTargetAlcohol(targetPromille: number, weightKg: number): number {
    return targetPromille * (weightKg * 0.6) * ALCOHOL_GRAM_TO_ML;
}

function areIngredientsAvailable(
    checkIngredients: types.IIngredient[],
    availableIngredients: Array<types.IIngredient["name"]>
): boolean {
    return checkIngredients.find(it => !availableIngredients.includes(it.name)) === undefined;
}

// the maximum number a drink will be repeated
const MAX_REPETITION = 4;
// How likely a drink will be skipped randomly
// TODO: Maybe increase the more drinks there are?
const SKIP_PROPABILITY = 0.9;


/* Yields a random combination of Drinks till the targetAlcVolume is closely reached */
function* getDrinksByMostAlc(targetAlcVolume: number, drinks: types.IDrink[]): Generator<types.IDrink> {
    let sumAlcoholVolume = 0;
    // First pass: get some random drinks
    first_pass: for (const drink of drinks) {
        // NOTE: a drink might be added another time in the second pass and a second time in the third pass
        repetition: for (let amount = 0; amount < MAX_REPETITION - 2; amount++) {
            console.log(`Checking ${drink.name} with ${drink.alcoholVolume}ml alc, trying to reach ${targetAlcVolume}ml having ${sumAlcoholVolume}ml`);
            if (Math.random() < SKIP_PROPABILITY) continue repetition; // skip some drinks to get a bit of variation
            if (sumAlcoholVolume + drink.alcoholVolume! > targetAlcVolume) continue first_pass; // gets the person more dizzy than wanted, skip

            yield drink;
            sumAlcoholVolume += drink.alcoholVolume!;
        }
    }

    // Second pass: Get close to target
    for (const drink of drinks) {
        console.log(`Checking ${drink.name} with ${drink.alcoholVolume}ml alc, trying to reach ${targetAlcVolume}ml having ${sumAlcoholVolume}ml`);
        if (sumAlcoholVolume + drink.alcoholVolume! > targetAlcVolume) continue; // gets the person more dizzy than wanted, skip
        yield drink;
        sumAlcoholVolume += drink.alcoholVolume!;
    }

    // Third pass: Lastly, if we can get even closer by hitting over the target, also add the smallest
    const smallest = drinks[drinks.length - 1];
    if (smallest && Math.abs(targetAlcVolume - sumAlcoholVolume - smallest.alcoholVolume) < targetAlcVolume - sumAlcoholVolume)
        yield smallest;
}
