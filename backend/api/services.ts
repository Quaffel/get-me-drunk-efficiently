import { IDrink, IDrinkAmount, IIngredient } from '../../types';
import { getDrinks, getIngredients } from './data';

const ALCOHOL_GRAM_TO_ML = 16 / 10;

export function getAllIngredients(): IIngredient[] {
    return getIngredients();
}

export function getOptimalDrinkAmounts(
    availableIngredients: IIngredient[],
    promille: number,
    weight: number
): IDrinkAmount[] {
    const allDrinks = getDrinks();

    // Filter drinks with missing ingredients
    const availableDrinks = allDrinks.filter(drink =>
        areIngredientsAvailable(drink.ingredients.map(ingredientAmount => ingredientAmount.ingredient), availableIngredients));

    console.log(`From ${allDrinks.length} drinks, ${availableDrinks.length} are available`);


    // Approximate target total alcohol in ml based on weight and promille
    const targetAlcoholMl = calculateTargetAlcohol(promille, weight);

    // Generate all possible combinations
    // const combinations = generatePossibleCombinations(3, availableDrinkAmounts);

    // Select combination closest to target
    // const optimal = combinations.reduce((prev, val) => Math.pow(targetAlcoholMl - val.alcohol, 2) > Math.pow(targetAlcoholMl - prev.alcohol, 2) ? prev : val);

    const optimal = [...getDrinksByMostAlc(targetAlcoholMl, availableDrinks)]
        .map(drink => ({ drink, amount: 1 }));

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
    checkIngredients: IIngredient[],
    availableIngredients: IIngredient[]): boolean {

    const availableIngredientNames = availableIngredients.map(ingredient => ingredient.name);
    const notAvailable = checkIngredients.reduce((count, ingredient) => count - +availableIngredientNames.includes(ingredient.name), checkIngredients.length);

    console.log(`Of ${checkIngredients.length}, ${notAvailable} are not available `);
    return notAvailable === 0;
}


function* getDrinksByMostAlc(targetAlcVolume: number, drinks: IDrink[]): Generator<IDrink> {
  let sumAlcoholVolume = 0;
  for(const drink of drinks) {
    console.log(`Checking ${drink.name} with ${drink.alcoholVolume}ml alc, trying to reach ${targetAlcVolume}ml having ${sumAlcoholVolume}ml`);
    if(Math.random() > 0.8) continue; // skip some drinks to get a bit of variation
    if(sumAlcoholVolume + drink.alcoholVolume! > targetAlcVolume) continue; // gets the person more dizzy than wanted, skip
    yield drink;
    sumAlcoholVolume += drink.alcoholVolume!;
  }

  if(sumAlcoholVolume < targetAlcVolume) {
     // not quite reached, do we get closer if we add the last one?
  } 
   
}

/* function generatePossibleCombinations(maxDrinks: number, availableDrinkAmounts: IDrinkAmount[]): { alcohol: number, combination: IDrinkAmount[] }[] {
    // Generation-based combinations
    const allCombinations: { alcohol: number, combination: IDrinkAmount[] }[][] = [
        [{ alcohol: 0, combination: [] }] // Initial starting value representing "drink nothing"
    ];

    for (let gen = 1; gen <= maxDrinks; gen++) {
        allCombinations[gen] = [];
        // For every combination of last generation, append every drink
        allCombinations[gen-1].forEach((last) => {
            for(let current = 0; current < availableDrinkAmounts.length; current++) {
                const newCombination = last.combination.concat(availableDrinkAmounts[current]);
                allCombinations[gen].push({
                    alcohol: newCombination.map(drinkAmount => drinkAmount.amountAlcohol).reduce((prev, val) => prev + val),
                    combination: newCombination
                });
            }
        });
    }

    return allCombinations.flat();
} */