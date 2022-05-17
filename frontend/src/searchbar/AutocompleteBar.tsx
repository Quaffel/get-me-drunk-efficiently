import React, { FormEventHandler } from 'react';
import { createRange, resolveCurrentSelection, SelectionData, SingleSelection } from '../util/selection';
import { IndexTraversal } from '../util/traversal';
import './Searchbar.css'

export function Searchbar({
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

    const selectHandler = function(event: React.SyntheticEvent<HTMLDivElement>) {
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

    const changeHandler = function(event: React.KeyboardEvent<HTMLDivElement>) {
        const windowSelection = window.getSelection();
        const currentSelection = previousSelectionRef.current;
        if (!currentSelection || !windowSelection) {
            return;
        }

        if (event.key === "Delete" && currentSelection.atEnd) {
            event.preventDefault();
            return;
        }

        if (event.key === "ArrowRight" && suggestion.visible) {
            const node = currentSelection.selection.node;
            node.textContent += suggestion.value;

            windowSelection.removeAllRanges();
            windowSelection.addRange(createRange({
                node,
                offset: node.textContent!!.length
            }));

            setSuggestion(prev => ({ value: prev.value, visible: false }));
        }

        console.log(event.key);
        console.log(containerRef.current!!.textContent);
    }

    const unfocusHandler = function(event: React.FocusEvent<HTMLDivElement>) {
        setSuggestion(prev => ({ value: prev.value, visible: false }));
    }

    // Maybe use "portals" to avoid contentEditable warnings?
    // https://www.reddit.com/r/reactjs/comments/2wnge4/how_to_disable_react_warnings/

    return <div aria-label="Search" ref={containerRef} 
        onBlur={unfocusHandler} onKeyDown={changeHandler} onSelect={selectHandler}
        className='searchbar' contentEditable={true}>
        bla
        {suggestion.visible && <span className="searchbar-suggestion" contentEditable={false}>{suggestion.value}</span>}
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