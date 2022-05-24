import * as React from "react";
import  { IDrink } from "../../../types";
import { Card } from "../basic/Card";

const FALLBACK_DRINK_THUMBNAIL = 
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Flaming_cocktails.jpg/300px-Flaming_cocktails.jpg";

export function DrinkCard({ drink }: { drink: IDrink }) {
    return <Card>
        <Card.Image src={drink.image ?? FALLBACK_DRINK_THUMBNAIL} />
        <Card.Title name={drink.name} />
        <Card.Content title="Ingredients">
            {drink.ingredients.map(({ ingredient, amount, unit }, index) => 
                <React.Fragment key={drink.name + ingredient.name + index}>
                    {amount ? (+amount).toFixed(0) : null}{unit} {ingredient.name}<br/>
                </React.Fragment>    
            )}
        </Card.Content>
        {!!drink.instructions?.length && <Card.Content title="Instructions">
            {drink.instructions?.map((instruction, index) => 
                <>{index + 1}. {instruction}<br/></>
            )}
        </Card.Content>}
        
    </Card>
}