import { types } from '@get-me-drunk/common';
import { Card } from '../basic/Card';
import { DrinkCard } from './DrinkCard';

import './DrinkGrid.css';

export function DrinkGrid({ drinks }: { drinks: Array<types.IDrink> }): JSX.Element {
    return <div className="browser-result-grid">
        {drinks.map((it, index) => ((<Card.Container key={index + it.name}>
            <DrinkCard drink={it} />
        </Card.Container>)))}
    </div>;
}