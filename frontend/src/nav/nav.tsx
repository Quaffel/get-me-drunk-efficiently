import React, { PropsWithChildren } from 'react';
import ReactIs from 'react-is';

// Declare the navigation context as exposed by the 'NavProvider' component.
export interface NavContextProps {
    selectedElement: NavElement,
    elements: Array<NavElement>,
    navigateById: (elementId: string) => void
};

const NavContext: React.Context<NavContextProps> = React.createContext({} as any);
export const useNav: () => NavContextProps = () => React.useContext(NavContext);

// Declare the 'NavElement' component used for indicating navigation element boundaries in React's node tree.
// Mind the lowercase element name which causes React to assume that the component can be rendered by the browser.
// It is filtered out by the 'NavProvider' component.
export interface NavElement {
    id: string,
    name: string
}
declare global {
    namespace JSX {
        interface IntrinsicElements {
            navElement: React.PropsWithChildren<NavElement>;
        }
    }
}

function isNavElement(
    node: React.ReactElement
): node is React.ReactElement<PropsWithChildren<NavElement>, 'navElement'> {
    return node.type === 'navElement';
}

// Define the component providing the 'NavContext' and encapsulating its default implementation.
export function NavProvider({
    fallbackElementId,
    children
}: React.PropsWithChildren<{ fallbackElementId: string }>): JSX.Element {
    // Traverses React's component tree to find all 'navElement' components.  If an identified 'navElement' is
    // supposed to be displayed, its children are appended to the element's parent (so that the 'navElement' is
    // removed from the tree).  Otherwise, it and its children are removed without any replacement.
    function discoverAndFilterChildren(
        node: React.ReactNode,
        selectedElementId: string
    ): [filteredChildren: React.ReactNode, discoveredNavElements: Array<NavElement>] {
        if (ReactIs.isElement(node)) {
            if (isNavElement(node)) {
                // Keep track of the identified 'navElement'.  Even if the element is removed from the tree
                // in a  future step, its mere presence in the component tree may be of importance for
                // other components, e.g., the 'Navbar' component.
                const navElementEntry: NavElement = {
                    id: node.props.id,
                    name: node.props.name
                };

                // If the identified 'navElement' component isn't the selected one, the value 'undefined' is reported
                // back to the caller.  This causes all non-selected 'navElement's to be removed from the
                // component tree.
                if (node.props.id !== selectedElementId) {
                    return [undefined, [navElementEntry]];
                }

                // The 'navElement' to be displayed does not necessarily have to be traversed as well.  Since we only
                // support single-element selection, further traversal would only benefit the detection of illegal
                // nesting of 'navElement' components.
                return [node.props.children, [navElementEntry]];
            }

            // For all other elements having children, we apply this algorithm recursively for their children and 
            // replace the React element with an element of identical type and properties with a potentially
            // reduced children set. 
            // (The 'children' property is read-only and can thus not be modified directly.)
            if (node.props.children !== undefined) {
                const [filteredChildren, discoveredNavElements] = 
                    discoverAndFilterChildren(node.props.children, selectedElementId);
                const { children: _, ...filteredProps } = node.props;

                return [React.createElement(
                    node.type,
                    filteredProps,
                    filteredChildren
                ), discoveredNavElements];
            }

            return [node, []];
        } else if (Array.isArray(node)) {
            // Return the filtered-out array.  If this 'node' is the top-level node, the direct children of
            // the 'NavProvider' component will be reduced.  In all other cases, there is a higher-level React element
            // that will be redefined to only contain the filtered out components.
            const allFilteredChildren = [];
            const allNavElements = [];
            for (let it of node) {
                const [filteredChildren, navElements] = discoverAndFilterChildren(it, selectedElementId);
                allFilteredChildren.push(filteredChildren);
                allNavElements.push(...navElements);
            }

            return [allFilteredChildren, allNavElements];
        } else if (typeof node === 'string' || typeof node === 'number') {
            return [node, []];
        } else {
            if (ReactIs.isFragment(node)) {
                console.error("Found fragment", node);
            }
            throw new Error("Illegal children (only elements are allowed)");
        }
    }

    const [selectedElementId, setSelectedElementId] = React.useState<string | null>(null);
    const targetedElementId = selectedElementId ?? fallbackElementId;

    const [visibleChildren, navElements] = discoverAndFilterChildren(children, targetedElementId);

    function findElementById(id: string): NavElement | null {
        return navElements.find(it => it.id === id) ?? null;
    }
    function navigateById(elementId: string | null) {
        elementId ??= fallbackElementId;
        if (findElementById(elementId) === null) {
            throw new Error(`Navigation element id "${elementId}" is unknown`);
        }
        setSelectedElementId(elementId);
    }

    const context: NavContextProps = {
        selectedElement: findElementById(targetedElementId)!,
        elements: navElements,
        navigateById
    }

    return <NavContext.Provider value={context}>
        {visibleChildren}
    </NavContext.Provider>;
}
