import * as React from "react";
import  { IDrink } from "../../../types";
import { Card } from "../basic/Card";

export function DrinkCard({ drink }: { drink: IDrink }) {
    return <Card>
        <Card.Image src={drink.image ?? "https://upload.wikimedia.org/wikipedia/commons/e/e7/Flaming_cocktails.jpg"} />
        <Card.Title name={drink.name} />
        <Card.Content title="Ingredients">
            {drink.ingredients.map(({ ingredient, amount, unit }) => 
                <>{amount ? (+amount).toFixed(0) : null}{unit} {ingredient.name}<br/></>    
            )}
        </Card.Content>
        {!!drink.instructions?.length && <Card.Content title="Instructions">
            {drink.instructions?.map((instruction, index) => 
                <>{index + 1}. {instruction}<br/></>
            )}
        </Card.Content>}
        
    </Card>
}