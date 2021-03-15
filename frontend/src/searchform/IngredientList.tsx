import * as React from "react";
import "./IngredientList.css";

import { IIngredient } from "../../../types";

import * as API from "../api";

const allIngredients = API.getIngredients();

export function IngredientList({ ingredients, setIngredients }: { ingredients: IIngredient[], setIngredients(ingredients: IIngredient[]): void, }) {
    const [currentIngredient, setCurrentIngredient] = React.useState("");
    const ingredientSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.code !== "Enter") return;
        setIngredients([...ingredients, { name: currentIngredient }]);
        setCurrentIngredient("");
        event.preventDefault();
    }

    const handleDelete = (ingredient: IIngredient) => {
        setIngredients(ingredients.filter(it => it !== ingredient));
    }

    return (
        <>
            <label htmlFor="ingredientInput" className="searchform-label">What's inside your fridge?</label>
            <input type="text" id="ingredientInput" value={currentIngredient} onChange={event => setCurrentIngredient(event.target.value)} onKeyDown={ingredientSubmit} className="searchform-input"></input>
            {ingredients.map(ingredient =>
                <div key={ingredient.name} className="ingredient-container">
                    <div className="ingredient-label">{ingredient.name}</div>
                    <button onClick={() => handleDelete(ingredient)} className="ingredient-delete-button">×</button>
                </div>)}
        </>
    )
}