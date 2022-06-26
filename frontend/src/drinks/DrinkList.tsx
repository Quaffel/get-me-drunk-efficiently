import { types } from '@get-me-drunk/common';
import { Card } from '../basic/Card';
import { DrinkCard } from './DrinkCard';

export function DrinkList({ drinkAmounts, goBack }: { drinkAmounts: types.IDrinkAmount[], goBack(): void }) {
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