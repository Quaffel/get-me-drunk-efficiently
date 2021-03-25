import * as React from "react";
import { IDrinkAmount } from "../../../types";
import { Card } from "../basic/Card";
import { DrinkCard } from "./DrinkCard";

export function DrinkList({ drinkAmounts, goBack }: { drinkAmounts: IDrinkAmount[], goBack():void }) {
    return <div>
        {drinkAmounts.map(({ drink, amount }) => <div>
            <Card.Container>
                <Card.Decorator content={amount + "x"} />
                <DrinkCard drink={drink} />
            </Card.Container>
        </div>)}
        <button className="searchform-submit" onClick={goBack}>Retry &#10227;</button>
    </div>
}