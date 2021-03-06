import * as React from "react";
import "./IngredientList.css";

import { IIngredient } from "../../../types";

import * as API from "../api";

export const loadAllIngredients = API.getIngredients();


const normalize = (str: string) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

async function getRecommendation(search: string, exclude: IIngredient[], cancellationToken: { cancelled: boolean }): Promise<IIngredient | null> {
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

function useRecommendation(search: string, exclude: IIngredient[]): IIngredient | null {
    const [recommendation, setRecommendation] = React.useState<IIngredient | null>(null);

    React.useEffect(() => {
        const cancellationToken = { cancelled: false };

        getRecommendation(search, exclude, cancellationToken)
            .then(setRecommendation)
            .catch(() => {});

        return () => { cancellationToken.cancelled = true }; 
    }, [search, exclude]);

    return recommendation;
}

export function IngredientList({ ingredients, setIngredients }: { ingredients: IIngredient[], setIngredients(ingredients: IIngredient[]): void, }) {
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

    const handleDelete = (ingredient: IIngredient) => {
        setIngredients(ingredients.filter(it => it !== ingredient));
    }

    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const ingredientsSorted = React.useMemo(() => [...ingredients].sort((a, b) => a.name.localeCompare(b.name)), [ingredients]);

    return (
        <>
        
            <label htmlFor="ingredientInput" className="searchform-label">What's inside your fridge?</label>
            <div className="searchform-input" onClick={() => inputRef.current?.focus()}>
                <input 
                    type="text" 
                    id="ingredientInput" 
                    autoComplete="off" 
                    value={currentIngredient} 
                    onChange={event => setCurrentIngredient(event.target.value)} 
                    onKeyDown={ingredientSubmit}
                    className="searchform-input-value"
                    style={{ width: (1 + currentIngredient.length) * 10 + "px"}}
                    ref={inputRef}
                />
                {currentIngredient.length > 2 && !!recommendation && 
                    <div className="searchform-completion">{recommendation.name.slice(currentIngredient.length)}</div>}
                {currentIngredient.length > 2 && !recommendation && 
                    <div className="searchform-completion"> - No such ingredient?</div>}
            
            </div>
            {ingredientsSorted.map(ingredient =>
                <div key={ingredient.name} className="ingredient-container">
                    <div className="ingredient-label">{ingredient.name}</div>
                    <button onClick={() => handleDelete(ingredient)} className="ingredient-delete-button">X</button>
                </div>)}
        </>
    )
}