import * as React from 'react';
import './searchform.css';

import { IngredientList } from './IngredientList';
import { IIngredient } from "../../../types";
import { useTipsySelector } from '../tipsyselector/tipsyselector';

function SearchForm({
    submit
}: {
    submit(query: { weight: number, ingredients: IIngredient[], promille: number }): void
}) {
    const [weight, setWeight] = React.useState(70);
    const [ingredients, setIngredients] = React.useState<IIngredient[]>([]);
    const [tipsySelectorEl, promille] = useTipsySelector({ rangeOptions: { min: .3, max: 2 } });

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
