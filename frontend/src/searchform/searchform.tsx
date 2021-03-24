import * as React from 'react';
import './searchform.css';

import { IngredientList, loadAllIngredients } from './IngredientList';
import { IIngredient } from "../../../types";
import { useTipsySelector } from '../tipsyselector/tipsyselector';

const DEFAULT_INGREDIENTS = [
    "carbonated water",
    "coffee",
    "cola",
    "crushed ice",
    "cow's milk",
    "drinking water",
    "ice",
    "sugar",
    "milk",
    "water",
];

function SearchForm({
    submit
}: {
    submit(query: { weight: number, ingredients: IIngredient[], promille: number }): void
}) {
    const [weight, setWeight] = React.useState(70);
    const [ingredients, setIngredients] = React.useState<IIngredient[]>([]);
    const [tipsySelectorEl, promille] = useTipsySelector({ rangeOptions: { min: .3, max: 2 } });

    // If the ingredients were loaded before the user started adding some, 
    // prefill the ingredient list with something basically everyone has
    React.useEffect(() => {
        loadAllIngredients
            .then(result => setIngredients(prev => prev.length ? prev : result.ingredients.filter(it => DEFAULT_INGREDIENTS.includes(it.name)))); 
    }, []);
    
    return (
        <>
            <div className="segment">
                <IngredientList ingredients={ingredients} setIngredients={setIngredients} />
            </div>
            <div className="segment">
                <label htmlFor="weightInput" className="searchform-label">How much do you weight?</label>
                <div className="searchform-input-container">
                    <input type="number" id="weightInput" value={weight}
                        onChange={events => setWeight(+events.target.value)} className="searchform-input" />
                    <span className="suffix">kg</span>
                </div>
            </div>
            <div className="segment">
                {tipsySelectorEl}
            </div>
            <button className="searchform-submit" onClick={() => submit({ weight, ingredients, promille })}>Drinks &rarr;</button>

        </>
    );
}

export default SearchForm;
