import * as React from 'react';
import './searchform.css';

import { types } from '@get-me-drunk/common';
import { IngredientList, loadAllIngredients } from '../../searchform/IngredientList';
import { useTipsySelector } from '../tipsyselector/tipsyselector';

const INGREDIENT_STORE = "get-me-drunk-fridge";

function SearchForm({
    submit
}: {
    submit(query: { weight: number, ingredients: types.IIngredient[], promille: number }): void
}) {
    const [weight, setWeight] = React.useState(70);
    const [ingredients, setIngredients] = React.useState<types.IIngredient[] | null>(null);
    const [tipsySelectorEl, promille] = useTipsySelector({ rangeOptions: { min: .3, max: 2 } });

    // If the ingredients were loaded before the user started adding some, 
    // prefill the ingredient list with something basically everyone has
    React.useEffect(() => {
        (async function() {
            const { ingredients } = await loadAllIngredients;
            const storedIngredients = JSON.parse(localStorage.getItem(INGREDIENT_STORE) || "[]");

            console.log("loadingIngredients, stored", storedIngredients);
            const resultIngredients = ingredients.filter(it => storedIngredients.includes(it.name));

            setIngredients(prev => prev !== null ? prev : resultIngredients); 
        })();
    }, []);

    React.useEffect(() => {
        console.log("store ingredients", ingredients)
        if(ingredients !== null)
            localStorage.setItem(INGREDIENT_STORE, JSON.stringify(ingredients.map(it => it.name)));
    }, [ingredients]);
    
    return (
        <div className="searchform">
            <div className="searchform-segment searchform-segment-selector">
                {tipsySelectorEl}
            </div>
            <div className="searchform-segment searchform-segment-weight">
                <label htmlFor="weightInput" className="searchform-label">How much do you weight?</label>
                <div className="searchform-input-container">
                    <input type="number" id="weightInput" value={weight}
                        onChange={events => setWeight(+events.target.value)} className="searchform-input" />
                    <span className="suffix">kg</span>
                </div>
            </div>
            <div className="searchform-segment searchform-segment-fridge">
                {ingredients !== null && <>
                    <label htmlFor="ingredientInput" className="searchform-label">What's inside your fridge?</label>
                    <IngredientList ingredients={ingredients} setIngredients={setIngredients} />
                </>}
            </div>
            <button className="searchform-submit" onClick={() => { if(ingredients !== null) submit({ weight, ingredients, promille })}}>Drinks &rarr;</button>
        </div>
    );
}

export default SearchForm;
