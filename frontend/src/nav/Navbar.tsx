import { NavElement, useNav } from './nav';

import './Navbar.css';

export function Navbar(): JSX.Element {
    const { elements, navigateById, selectedElement } = useNav();

    function handleItemSelect(id: NavElement['id']) {
        navigateById(id);
    }

    return <nav>
        {elements.map(it => {
            const classSet = selectedElement.id === it.id ? "nav-item selected" : "nav-item";
            return <div className={classSet} onClick={() => handleItemSelect(it.id)}>
                {it.name}
            </div>
        })}
    </nav>;
}
