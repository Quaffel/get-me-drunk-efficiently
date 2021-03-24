import * as React from 'react';
import './searchform.css';

import { IngredientList } from './IngredientList';
import { IIngredient } from "../../../types";

const DEFAULT_INGREDIENTS = [
    {"name":"carbonated water","alcohol":0},
    {"name":"coffee","alcohol":0},
    {"name":"cola","alcohol":0},
    {"name":"crushed ice","alcohol":0},
    {"name":"cow's milk","alcohol":0},
    {"name":"drinking water","alcohol":0.040999999999999995},
    {"name":"ice","alcohol":0},
    {"name":"sugar","alcohol":0},
    {"name":"milk","alcohol":0},
    {"name":"water","alcohol":0}
];

function SearchForm({submit} : { submit(query: { weight: number, ingredients: IIngredient[], promille: number }): void,  }) {
    const [weight, setWeight] = React.useState(70);
    const [ingredients, setIngredients] = React.useState<IIngredient[]>(DEFAULT_INGREDIENTS);

    return (
        <div className="searchform-container">
            <IngredientList ingredients={ingredients} setIngredients={setIngredients}/>
            <br />
            <label htmlFor="weightInput" className="searchform-label">How much do you weight?</label>
            <div className="searchform-input-container"><input type="number" id="weightInput" value={weight} onChange={events => setWeight(+events.target.value)} className="searchform-input"></input><span>kg</span></div>
            <br />
            <DrunkScale />
            <button className="searchform-submit" onClick={() => submit({ weight, ingredients, promille: 1 })}>Drunk!</button>
        </div>
    );
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