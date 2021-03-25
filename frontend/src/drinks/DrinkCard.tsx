import * as React from "react";
import  { IDrink } from "../../../types";
import { Card } from "../basic/Card";

export function DrinkCard({ drink }: { drink: IDrink }) {
    return <Card>
        <Card.Image src={"https://hips.hearstapps.com/del.h-cdn.co/assets/15/38/768x1156/gallery-1442433700-delish-halloween-cocktails-good-evil-drink.png?resize=480:*"} />
        <Card.Title name={drink.name} />
        <Card.Content title="Ingredients">
            {drink.ingredients.map(({ ingredient, amount, unit }) => 
                <>{amount}{unit} {ingredient.name}<br/></>    
            )}
        </Card.Content>
        {!!drink.instructions?.length && <Card.Content title="Instructions">
            {drink.instructions?.map((instruction, index) => 
                <>{index + 1}. {instruction}<br/></>
            )}
        </Card.Content>}
        
    </Card>
}