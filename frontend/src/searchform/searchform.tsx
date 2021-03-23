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
        <div className="searchform-container">
            <IngredientList ingredients={ingredients} setIngredients={setIngredients} />
            <br />
            <label htmlFor="weightInput" className="searchform-label">How much do you weight?</label>
            <div className="searchform-input-container">
                <input type="number" id="weightInput" value={weight}
                    onChange={events => setWeight(+events.target.value)} className="searchform-input" />
                <span>kg</span>
            </div>
            <br />
            {tipsySelectorEl}
            <button className="searchform-submit" onClick={() => submit({ weight, ingredients, promille })}>Drunk!</button>
        </div>
    );
}

export default SearchForm;
