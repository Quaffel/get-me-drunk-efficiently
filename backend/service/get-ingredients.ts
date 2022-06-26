import { types } from "@get-me-drunk/common";
import { getIngredients } from "../data/index.js";

export async function getAllIngredients(): Promise<types.IIngredient[]> {
    return getIngredients();
}