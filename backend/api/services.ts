import { IDrinkAmount, IIngredient } from '../../types';
import { getDrinks, getIngredients } from './data';

const ALCOHOL_GRAM_TO_ML = 8 / 10;

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

    // Aggregate alcohol for drinks
    const availableDrinkAmounts: IDrinkAmount[] = [];
    availableDrinks.forEach((drink) => {
        availableDrinkAmounts.push({
            drink: drink,
            amount: drink.ingredients.filter(ingredient => ingredient.unit === 'ml').map(ingredient => ingredient.amount).reduce((prev, val) => (+prev) + (+val)),
            amountAlcohol: drink.ingredients.filter(ingredient => ingredient.unit === 'ml').map(ingredient => ingredient.ingredient.alcohol * ingredient.amount).reduce((prev, val) => (+prev) + (+val))
        });
    });

    // Approximate target total alcohol in ml based on weight and promille
    const targetAlcoholMl = calculateTargetAlcohol(promille, weight);

    // Generate all possible combinations
    const combinations = generatePossibleCombinations(3, availableDrinkAmounts);

    // Select combination closest to target
    const optimal = combinations.reduce((prev, val) => Math.pow(targetAlcoholMl - val.alcohol, 2) > Math.pow(targetAlcoholMl - prev.alcohol, 2) ? prev : val);

    // Debug output
    console.log(`Evaluated ${combinations.length} combinations:
      Weight > ${weight}kg
      Target > ${promille}%°
      Target > ${targetAlcoholMl}ml alcohol
      Found > ${optimal.alcohol}ml alcohol
        ${optimal.combination.map(drinkAmount => `\n  Drink > ${drinkAmount.drink.name} (${drinkAmount.amount}ml ${drinkAmount.amountAlcohol * 100 / drinkAmount.amount}%vol)`)}
    `);

    return optimal.combination;
}

function calculateTargetAlcohol(targetPromille: number, weightKg: number): number {
    return targetPromille * (weightKg * 0.6) * ALCOHOL_GRAM_TO_ML;
}

function areIngredientsAvailable(
    checkIngredients: IIngredient[],
    availableIngredients: IIngredient[]): boolean {

    const availableIngredientNames = availableIngredients.map(ingredient => ingredient.name);
    return checkIngredients.every(ingredient => availableIngredientNames.includes(ingredient.name));
}
function generatePossibleCombinations(maxDrinks: number, availableDrinkAmounts: IDrinkAmount[]): { alcohol: number, combination: IDrinkAmount[] }[] {
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
}