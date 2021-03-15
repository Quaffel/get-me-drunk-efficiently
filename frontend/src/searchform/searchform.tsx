import * as React from 'react';
import './searchform.css';

function SearchForm({submit}:{submit:(weight:number, ingredients:string[]) => void }) {
    const [weight, setWeight] = React.useState(70);
    const [ingredients, setIngredients] = React.useState<string[]>([]);

    return (
        <div className="searchform-container">
            <IngredientList ingredients={ingredients} setIngredients={setIngredients}/>
            <br />
            <label htmlFor="weightInput" className="searchform-label">How much do you weight?</label>
            <div className="searchform-input-container"><input type="number" id="weightInput" value={weight} onChange={events => setWeight(+events.target.value)} className="searchform-input"></input><span>kg</span></div>
            <br />
            <DrunkScale />
            <button className="searchform-submit" onClick={() => submit(weight, ingredients)}>Drunk!</button>
        </div>
    );
}

function IngredientList({ ingredients, setIngredients }: { ingredients: string[], setIngredients: React.Dispatch<React.SetStateAction<string[]>> }) {
    const [currentIngredient, setCurrentIngredient] = React.useState("");
    const ingredientSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.code !== "Enter") return;
        setIngredients(ingredients.concat(currentIngredient));
        setCurrentIngredient("");
        event.preventDefault();
    }

    const handleDelete = (ingredient: string) => {
        setIngredients(ingredients.filter(it => it !== ingredient));
    }

    return (
        <>
            <label htmlFor="ingredientInput" className="searchform-label">What's inside your fridge?</label>
            <input type="text" id="ingredientInput" value={currentIngredient} onChange={events => setCurrentIngredient(events.target.value)} onKeyPress={ingredientSubmit} className="searchform-input"></input>
            {ingredients.map(ingredient =>
                <div key={ingredient} className="ingredient-container">
                    <div className="ingredient-label">{ingredient}</div>
                    <button onClick={() => handleDelete(ingredient)} className="ingredient-delete-button">×</button>
                </div>)}
        </>
    )
}

function DrunkScale() {
    return (
        <>
            <label htmlFor="" className="searchform-label">How drunk to you want to get?</label>
            <input type="radio" name="drunkLevel" id="tipsy" value="0.7"></input>
            <label htmlFor="tipsy">Tipsy (0.7‰)</label>
        </>
    )
}

export default SearchForm;