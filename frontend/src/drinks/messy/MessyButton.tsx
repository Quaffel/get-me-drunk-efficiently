import React from 'react';
import { messy, types } from '@get-me-drunk/common';
import { queryRecipe } from '../../api';
import "./MessyButton.css";

const messySession = messy.startMessy();

export function MessyButton({ drink }: { drink: types.IDrink }) {
    const [state, setState] = React.useState<"pending" | "loading" | "done" | "abort">("pending");
    const recipeRef = React.useRef<Promise<messy.types.Recipe>>();

    async function run() {
        if (state === 'loading') {
            return;
        }
        setState("loading");

        if (recipeRef.current === undefined) {
            recipeRef.current = queryRecipe({ drink: drink.name }).then(it => it.recipe);
        }

        await messySession.onReady;
        const result = await messySession.run({
            recipe: await recipeRef.current
        });
        setState(result.state);
    }

    return <button className="messy-button" onClick={run}>
        {(state === "pending" || state === "done") && "Mix with Messy"}
        {state === "loading" && "lädt"}
        {state === "abort" && "Huch?"}
    </button>;
}