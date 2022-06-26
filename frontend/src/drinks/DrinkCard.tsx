import * as React from 'react';
import  { types } from '@get-me-drunk/common';
import { Card } from '../basic/Card';
import { MessyButton } from './messy/MessyButton';

const FALLBACK_DRINK_THUMBNAIL = 
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Flaming_cocktails.jpg/300px-Flaming_cocktails.jpg";

export function DrinkCard({ drink }: { drink: types.IDrink }) {
    return <Card>
        <Card.Image src={drink.image ?? FALLBACK_DRINK_THUMBNAIL} />
        <Card.Title name={drink.name} />
        <Card.Content title="Ingredients">
            {drink.ingredients.map(({ ingredient, amount, unit }, index) => 
                <React.Fragment key={drink.name + ingredient.name + index}>
                    {amount ? (+amount).toFixed(0) : null} {unit} {ingredient.name}<br/>
                </React.Fragment>    
            )}
        </Card.Content>
        <Card.Container>
            <MessyButton recipe={{
                name: { en: "Weird cocktail", de: "Komischer Cocktail" },
                tasks: [{
                    type: 'fill',
                    amount: 3,
                    ingredient: { en: "Vodka", de: "Vodka" },
                    amountInUnit: {
                        amount: 4,
                        unit: 'kg'
                    }
                }]
            }}/>
        </Card.Container> 
    </Card>
}