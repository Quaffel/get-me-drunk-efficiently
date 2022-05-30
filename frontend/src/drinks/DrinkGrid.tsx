import { IDrink } from '../../../types';
import { Card } from '../basic/Card';
import { DrinkCard } from './DrinkCard';

import './DrinkGrid.css';

export function DrinkGrid({ drinks }: { drinks: Array<IDrink> }): JSX.Element {
    if (drinks.length === 0) {
        return <div className="browser-result-status">
            <label>No results</label>
        </div>;
    }

    return <div className="browser-result-grid">
        {drinks.map(it => ((<Card.Container key={it.name}>
            <DrinkCard drink={it} />
        </Card.Container>)))}
    </div>;
}