import { types, messy } from "@get-me-drunk/common";
import { normalize } from "../data/util.js";

const FILL_MAGIC_UNITS_MAP: Partial<{ [unit in types.Unit]: typeof messy.types.AddIngredientTask.MAGIC_UNITS[number] }>
    = {
    '1': 'whole'
}

export async function getRecipe(drink: types.IDrink): Promise<messy.types.Recipe> {
    const diminutiveIngredients: Array<types.IIngredientAmount> = [];
    const regularAlcoholicIngredients: Array<types.IIngredientAmount> = [];
    const regularIngredients: Array<types.IIngredientAmount> = [];
    const nonVolumetricIngredients: Array<types.IIngredientAmount> = [];

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
        // TODO: Respect special units such as wholes and ml
        const normalizedAmount: number = normalize(ingredient.amount, ingredient.unit);

        const isTrivial = types.isTrivialUnit(ingredient.unit);
        const displayAmount = isTrivial ? ingredient.amount : normalizedAmount;
        const baseUnit = isTrivial 
            ? (ingredient.unit in FILL_MAGIC_UNITS_MAP ? FILL_MAGIC_UNITS_MAP[ingredient.unit]! : ingredient.unit)
            : "ml";

        if (types.isVolumetricUnit(ingredient.unit)) {
            const displayUnit: NonNullable<messy.types.FillIngredientTask['amountInUnit']>['unit'] =
                messy.types.FillIngredientTask.isMagicUnit(baseUnit)
                    ? baseUnit
                    : { en: baseUnit };

            return {
                type: 'fill',
                ingredient: { en: ingredient.ingredient.name },
                amount: normalizedAmount,
                amountInUnit: {
                    amount: displayAmount,
                    unit: displayUnit
                }
            };
        }

        const displayUnit: NonNullable<messy.types.AddIngredientTask['amountInUnit']>['unit'] =
                messy.types.AddIngredientTask.isMagicUnit(baseUnit)
                    ? baseUnit
                    : { en: baseUnit };

        return {
            type: 'add',
            ingredient: { en: ingredient.ingredient.name },
            amountInUnit: {
                amount: displayAmount,
                unit: displayUnit
            }
        }
    }

    return ({
        name: { en: drink.name },
        tasks: [
            ...diminutiveIngredients.map(deriveTask), ...regularAlcoholicIngredients.map(deriveTask),
            ...regularIngredients.map(deriveTask), ...nonVolumetricIngredients.map(deriveTask)
        ],
    });
}