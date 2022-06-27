import { types, messy } from "@get-me-drunk/common";
import { IIngredientAmount } from "@get-me-drunk/common/lib/types.js";
import { normalize } from "../data/util.js";

export async function getRecipe(drink: types.IDrink): Promise<messy.types.Recipe> {
    const diminutiveIngredients: Array<IIngredientAmount> = [];
    const regularAlcoholicIngredients: Array<IIngredientAmount> = [];
    const regularIngredients: Array<IIngredientAmount> = [];
    const nonVolumetricIngredients: Array<IIngredientAmount> = [];

    for (let ingredient of drink.ingredients) {
        if (!types.isVolumetricUnit(ingredient.unit)) {
            nonVolumetricIngredients.push(ingredient);
            continue;
        }

        const normalizedAmount = normalize(ingredient.amount, ingredient.unit);
        if (normalizedAmount < 25) {
            diminutiveIngredients.push(ingredient);
            continue;
        }

        if (ingredient.ingredient.alcoholConcentration > 0) {
            regularAlcoholicIngredients.push(ingredient);
            continue;
        }

        regularIngredients.push(ingredient);
    }

    function deriveTask(ingredient: types.IIngredientAmount): messy.types.Task {
        const normalizedAmount: number = normalize(ingredient.amount, ingredient.unit);
        const displayAmount: { amount: number, unit: { en: string } } = types.isTrivialUnit(ingredient.unit)
            ? { amount: ingredient.amount, unit: { en: ingredient.unit } }
            : { amount: normalizedAmount, unit: { en: ingredient.unit } };

        if (types.isVolumetricUnit(ingredient.unit)) {
            return {
                type: 'fill',
                ingredient: { en: ingredient.ingredient.name },
                amount: normalizedAmount,
                amountInUnit: {
                    amount: normalizedAmount,
                    unit: "ml"
                }
            };
        }

        return {
            type: 'add',
            ingredient: { en: ingredient.ingredient.name },
            amountInUnit: displayAmount
        }
    }

    return ({
        name: { en: "Weird cocktail", de: "Komischer Cocktail" },
        tasks: [
            ...diminutiveIngredients.map(deriveTask), ...regularAlcoholicIngredients.map(deriveTask),
            ...regularIngredients.map(deriveTask), ...nonVolumetricIngredients.map(deriveTask)
        ],
    });
}