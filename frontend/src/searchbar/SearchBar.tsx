import React, { FormEventHandler } from 'react';
import { resolveCurrentSelection, SelectionData, SingleSelection } from '../util/selection';
import { IndexTraversal } from '../util/traversal';
import './SearchBar.css'

export function SearchBar({
    inlineHint,
    querySuggestions
}: {
    inlineHint?: string,
    querySuggestions: (query: string) => Array<String> 
}): JSX.Element {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const suggestionRef = React.useRef<HTMLSpanElement>();

    const previousSelectionRef = React.useRef<{ atEnd: boolean, selection: SingleSelection }>();

    const [suggestion, setSuggestion] = React.useState<{ value: string, visible: boolean }>({ 
        value: "test",
        visible: false
     });

    const selectionListener = function(event: React.SyntheticEvent<HTMLDivElement>) {
        const root = containerRef.current!!;
        const selection = resolveCurrentSelection(root);
        
        // No valid selection: User tried to interact with element but the cursor was not set
        // (e.g., when user clicks on non-selectable element containing text)
        if (!selection) {
            return;
        }

        // Pressing solely an arrow key when a range selection is active turns the range selection into
        // a single selection whereby the caret's position remains unchanged.  Such an action can thus
        // not cause the caret to enter into the completion span.
        if (selection.type !== 'single') {
            return;
        }

        const totalLength = IndexTraversal.traverse(root, {
            visitNode: () => "no-visit"
        });

        if (selection.node === root) {
            const windowSelection = window.getSelection()!!;
            const previousSelection = previousSelectionRef.current;

            windowSelection.removeAllRanges();
            if (previousSelection) {
                window.getSelection()?.addRange(previousSelection?.selection.range);
            }
            return;
        }

        console.log(selection.index, totalLength);
        let visible = selection.index === totalLength - (suggestion.visible ? suggestion.value.length : 0);
        if (visible !== suggestion.visible) {
            setSuggestion(previous => ({ 
                value: previous.value, 
                visible
            }));
        }

        (previousSelectionRef as any).current = {
            atEnd: visible, 
            selection
        };
    }

    const changeListener = function(event: React.KeyboardEvent<HTMLDivElement>) {
        if (previousSelectionRef.current?.atEnd ?? false) {
            switch (event.key) {
                case "ArrowRight":
                    break;
                case "Delete":
                    event.preventDefault();
                    return;
                default:
                    break;
            }
        }
        console.log(event.key);
    }

    // Maybe use "portals" to avoid contentEditable warnings?
    // https://www.reddit.com/r/reactjs/comments/2wnge4/how_to_disable_react_warnings/

    return <div aria-label="Search" ref={containerRef} onKeyDown={changeListener} onSelect={selectionListener}
        className='searchbar' contentEditable={true}>
        test
        {suggestion.visible && <span contentEditable={false}>{suggestion.value}</span>}
        {/* <span>Prolog</span>
        Content

        <span  contentEditable={false} className="inlinehint">Hint</span>
        <span> </span>
        <span contentEditable={false} className="inlinehint">Hint</span>

        more text
        {suggestion.visible && <span contentEditable={false}>${suggestion.value}</span>} */}

        {/* <div id="container-test">
            <div>
                asdf
                <span>Test tesxt</span>
            </div>
        </div>
        <div id="indexinator"> </div> */}

    </div>
}

/* function findIndex(root: Node, targetNode: Node): [index: number, targetLength: number, totalLength: number] {
        let targetIndex: number = -1;
        let targetLength: number = -1;

        const totalLength = IndexTraversal.traverse(root, {
            visitNode(node, currentIndex, lengthSelf) {
                if (node === targetNode) {
                    targetIndex = currentIndex;
                    targetLength = lengthSelf;
                    return 'no-visit';
                }

                return 'visit';
            }
        }, 0);

        return [targetIndex, targetLength, totalLength];
    } */