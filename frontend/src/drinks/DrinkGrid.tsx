import { IDrink } from '../../../types';
import { Card } from '../basic/Card';
import { DrinkCard } from './DrinkCard';

import './DrinkGrid.css';
import '../App.css';

export function DrinkGrid({ drinks }: { drinks: Array<IDrink> }): JSX.Element {
    return <div className="browser-result-grid">
        {drinks.map(it => ((<Card.Container>
            <DrinkCard drink={it} />
        </Card.Container>)))}
    </div>;
}