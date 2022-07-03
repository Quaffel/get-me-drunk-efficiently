import * as React from 'react';
import './IngredientList.css';

import { types } from '@get-me-drunk/common';
import * as API from '../api';

export const loadAllIngredients = API.queryIngredients();


const normalize = (str: string) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

async function getRecommendation(
    search: string, exclude: types.IIngredient[], cancellationToken: { cancelled: boolean }
): Promise<types.IIngredient | null> {
    const ingredients = (await loadAllIngredients).ingredients;

    if(cancellationToken.cancelled)
        throw new Error("cancelled");

    let best = null;
    
    search = normalize(search);
    
    for(const ingredient of ingredients) {
        if(exclude.includes(ingredient)) continue;
        if(!normalize(ingredient.name).startsWith(search)) continue;

        if(!best || best.name.length > ingredient.name.length)
            best = ingredient;
        
    }

    return best;
}

function useRecommendation(search: string, exclude: types.IIngredient[]): types.IIngredient | null {
    const [recommendation, setRecommendation] = React.useState<types.IIngredient | null>(null);

    React.useEffect(() => {
        const cancellationToken = { cancelled: false };

        getRecommendation(search, exclude, cancellationToken)
            .then(setRecommendation)
            .catch(() => {});

        return () => { cancellationToken.cancelled = true }; 
    }, [search, exclude]);

    return recommendation;
}

export function IngredientList({ 
    ingredients, setIngredients 
}: { 
    ingredients: types.IIngredient[], 
    setIngredients(ingredients: types.IIngredient[]): void
}) {
    const [currentIngredient, setCurrentIngredient] = React.useState("");
    const recommendation = useRecommendation(currentIngredient, /* exclude: */ ingredients);

    const ingredientSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.code !== "Enter") return;
        if(currentIngredient.length <= 2) return;
        if(!recommendation) return;
        if(ingredients.includes(recommendation)) return;

        setIngredients([...ingredients, recommendation]);
        setCurrentIngredient("");
        event.preventDefault();
    }

    const handleDelete = (ingredient: types.IIngredient) => {
        setIngredients(ingredients.filter(it => it !== ingredient));
    }

    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const ingredientsSorted = React.useMemo(
        () => [...ingredients].sort((a, b) => a.name.localeCompare(b.name)), 
    [ingredients]);

    return (
        <>
            <div className="ingredient-input" onClick={() => inputRef.current?.focus()}>
                <input 
                    type="text" 
                    id="ingredientInput" 
                    autoComplete="off" 
                    value={currentIngredient} 
                    onChange={event => setCurrentIngredient(event.target.value)} 
                    onKeyDown={ingredientSubmit}
                    className="ingredient-input-value"
                    style={{ width: (1 + currentIngredient.length) * 10 + "px"}}
                    ref={inputRef}
                />
                {currentIngredient.length > 2 && !!recommendation && 
                    <div className="ingredient-completion">{recommendation.name.slice(currentIngredient.length)}</div>}
                {currentIngredient.length > 2 && !recommendation && 
                    <div className="ingredient-completion"> - No such ingredient?</div>}
            
            </div>
            {ingredientsSorted.map(ingredient =>
                <div key={ingredient.name} className="ingredient-container">
                    <div className="ingredient-label">{ingredient.name}</div>
                    <button onClick={() => handleDelete(ingredient)} className="ingredient-delete-button">X</button>
                </div>)}
        </>
    )
}