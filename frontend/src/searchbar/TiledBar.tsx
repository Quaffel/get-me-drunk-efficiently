import React, { ReactNode } from 'react';
import ReactIs from 'react-is';
import * as DomSelection from '../util/selection';
import { IndexTraversal } from '../util/traversal';

import './Searchbar.css';

// Not compatible with 'react-hot-loader' because of type checking performed in 'EnrichedBar'.
// https://github.com/gaearon/react-hot-loader/issues/304

type TagProps = { color?: string } & { children: string };

declare global {
    namespace JSX {
        interface IntrinsicElements {
            inlineTag: TagProps
        }
    }
}

function isTagTile(node: React.ReactNode): node is React.ReactElement<TagProps, 'inlineTag'> {
    return ReactIs.isElement(node) && node.type === 'inlineTag';
}

function isTextTile(node: React.ReactNode): node is React.ReactText {
    return typeof (node) === "string" || typeof (node) === "number";
}

export function TiledBar(props: React.PropsWithChildren<{

}>): JSX.Element {
    // Traverse and sanitize children, i.e., ensure that the caller obeys aforementioned limitations
    // on the children.
    function getSanitizedChildren(
        node: React.ReactNode
    ): Array<React.ReactText | React.ReactElement<TagProps, 'inlineTag'>> {
        if (isTextTile(node) || isTagTile(node)) {
            return [node];
        }

        if (ReactIs.isFragment(node)) {
            const fragment = node as React.ReactFragment;
            const fragmentContent = (typeof ((fragment as any)[Symbol.iterator] === "function")
                ? Array.from(fragment as Iterable<ReactNode>)
                : [null]);

            return fragmentContent.flatMap(getSanitizedChildren);
        }

        if (Array.isArray(node)) {
            return node.flatMap(getSanitizedChildren);
        }

        if (node === null || node === undefined) {
            return [""];
        }

        throw new Error("TiledBar must only contain tile children");
    }

    // Convert the given tree into the internal representation as a list of tiles.
    interface BarTileBase<T extends string, N> {
        type: T,
        index: number,
        length: number,
        node: N
    }
    type BarTile = BarTileBase<'text', React.ReactText> | BarTileBase<'tag', React.ReactNode>;

    let index = 0;
    const tiles: Array<BarTile> = getSanitizedChildren(props.children).map(it => {
        let tile: BarTile;

        if (isTextTile(it)) {
            tile = {
                type: 'text',
                index,
                length: it.toString().length,
                node: it
            };
        } else if (isTagTile(it)) {
            tile = {
                type: 'tag',
                index,
                length: it.props.children.length,
                node: (<InlineTag color={it.props.color}>{it.props.children}</InlineTag>)
            }
        } else {
            throw new Error("Unreachable");
        }

        index += tile.length;
        return tile;
    });

    // Helper functions
    function findTileByIndex(targetIndex: number): BarTile | null {
        return tiles.find(it => targetIndex <= it.index + it.length) ?? null;
    }

    function findLastTile(type: BarTile['type']): BarTile | null {
        for (let i = tiles.length - 1; i >= 0; i--) {
            const currentTile = tiles[i];
            if (currentTile.type === type) {
                return currentTile;
            }
        }
        return null;
    }

    function findTilesInRange(start: number, end: number): Array<BarTile> | null {
        const startTile = tiles.findIndex(it => start <= it.index + it.length);
        if (startTile === -1) {
            return null;
        }

        for (let i = startTile; i < tiles.length; i++) {
            const currentTile = tiles[i];
            if (end <= currentTile.index + currentTile.length) {
                return tiles.slice(startTile, i + 1);
            }
        }

        return null;
    }

    function findAdjacentTile(tile: BarTile, direction: 'left' | 'right'): BarTile | null {
        const inputIndex = tiles.findIndex(it => it === tile);
        const targetIndex = inputIndex + (direction === 'left' ? -1 : 1);

        if (targetIndex < 0 || targetIndex >= tiles.length) {
            return null;
        }
        return tiles[targetIndex];
    }

    // Event handling
    const barRef = React.useRef<HTMLDivElement>(null);

    type SingleSelection = DomSelection.SingleSelection & { tile: BarTile };
    type RangeSelection = DomSelection.RangeSelection & { caret: 'left' | 'right' | 'unknown', tiles: Array<BarTile> };
    type Selection = SingleSelection | RangeSelection;

    function resolveDomSelection(
        domSelection: DomSelection.SelectionData | null,
        previousSelection: Selection | null
    ): Selection | null {
        if (domSelection === null) {
            return null;
        }

        switch (domSelection.type) {
            case 'single':
                return {
                    ...domSelection,
                    tile: findTileByIndex(domSelection.index)!!
                };
            case 'range':
                let caret: RangeSelection['caret'] = 'unknown';
                if (previousSelection?.type === 'range') {
                    caret = previousSelection.startIndex === domSelection.startIndex ? 'right' : 'left';
                }

                return {
                    ...domSelection,
                    caret,
                    tiles: findTilesInRange(domSelection.startIndex, domSelection.endIndex)!!
                };
            case 'multi':
                // Multi selections are currently only supported on Firefox and can only be triggered via
                // the selection API.  It is assmued that this mechanism is not used in conjunction with 
                // this component.
                throw new Error("Unexpected multi selection");
            default: {
                throw new Error("Unreachable");
            }
        }
    }

    function applySelection(selection: Selection | null) {
        let range: Range | null = selection !== null ? selection.range : null;
        DomSelection.setSelection(range);
    }

    /* function calculateRangeSelectionDiff(
        previous: Selection | null, 
        current: RangeSelection
    ): { end: 'left' | 'right', action: 'expanding' | 'shrinking' } {
        if (previous === null) {
            return { end: 'right', action: 'expanding' };
        }
        if (previous.type === 'single') {
            return { end: previous.index === current.startIndex ? 'right' : 'left', action: 'expanding' };
        }
        if (current.endIndex > previous.endIndex) {
            return { end: 'right', action: 'expanding' };
        } else if (current.endIndex < previous.endIndex) {
            return { end: 'right', action: 'shrinking' };
        } else if (current.startIndex < previous.startIndex) {
            return { end: 'left', action: 'expanding' };
        } else {
            return { end: 'left', action: 'shrinking' };
        }
    } */

    function getImplicatedTiles(selection: Selection | null): Array<BarTile> {
        if (selection === null) {
            return [];
        }
        if (selection.type === 'single') {
            return [selection.tile];
        }
        return selection.tiles;
    }

    const currentSelectionRef = React.useRef<Selection | null>(null);

    function handleSelection() {
        const barElement = barRef!!.current!!;

        const previousSelection = currentSelectionRef.current;
        const currentSelection = resolveDomSelection(
            DomSelection.resolveCurrentSelection(barElement),
            previousSelection
        );

        currentSelectionRef.current = currentSelection;

        // No valid selection: User tried to interact with element but the cursor was not set
        // (e.g., when user clicks on non-selectable element containing text)
        if (!currentSelection) {
            return;
        }

        // Pressing solely an arrow key when a range selection is active turns the range selection into
        // a single selection whereby the caret's position remains unchanged.  Such an action can thus
        // not cause the caret to enter into the completion span.

        if (currentSelection.type === 'range') {
            const previouslyImplicatedTiles = getImplicatedTiles(previousSelection);
            const currentlyImplicatedTiles = getImplicatedTiles(currentSelection);

            // Selection is shrinking.  Given that it was previously permitted to expand, it is safe
            // to assume that no additional safeguarding is required.
            if (currentlyImplicatedTiles.length <= previouslyImplicatedTiles.length) {
                return;
            }

            const newTiles = currentlyImplicatedTiles.filter(it => !previouslyImplicatedTiles.includes(it));

            // New selection exclusively contains selectable tags.
            if (newTiles.find(it => it.type === 'tag') === undefined) {
                return;
            }

            // Illegal selection.  Fall back to previous selection or abort selection altogether.
            applySelection(previousSelection);
            return;
        }

        console.log(currentSelection);

        // When clicked on DOM node but not within the text area. Especially elements with a high padding
        // are susceptible.
        if (currentSelection.node === barElement) {
            if (!previousSelection || !previousSelection) {
                const editTile = findLastTile('text')!!;
                const editIndex = editTile.index + editTile.length;
                DomSelection.setSelection(DomSelection.createRange({
                    node: findDomNodeByIndex(barElement, editIndex)!!,
                    offset: editIndex
                }));
                return;
            }

            // Previous selection must be of type 'single' here.
            if (previousSelection.type !== 'single') {
                throw new Error("Unreachable");
            }

            const offset = previousSelection.tile.length;
            DomSelection.setSelection(DomSelection.createRange({
                node: previousSelection.node,
                offset
            }));
            return;
        }
    }

    function handleKeyPress(event: React.KeyboardEvent<HTMLDivElement>) {
        switch (event.key) {
            case "Delete":
                break;
        }
    }

    function handleInput(event: React.KeyboardEvent<HTMLDivElement>) {
        handleNavigation(event);
    }

    function handleNavigation(event: React.KeyboardEvent<HTMLDivElement>) {
        if (event.shiftKey && (event.key === "ArrowRight" || event.key === "ArrowLeft")) {
            const currentSelection = currentSelectionRef.current;
            if (currentSelection?.type !== 'range' || currentSelection.caret === 'unknown') {
                return;
            }

            const expansionDirection: 'right' | 'left' | 'none' =
                (currentSelection.caret === 'right' && event.key === "ArrowRight")
                    ? 'right'
                    : (currentSelection.caret === 'left' && event.key === "ArrowLeft")
                        ? 'left'
                        : 'none';

            if (expansionDirection === 'none') {
                return;
            }

            const outerTile: BarTile = currentSelection.caret === 'right'
                ? currentSelection.tiles[currentSelection.tiles.length - 1]
                : currentSelection.tiles[0];
            const isAtTileBorder = currentSelection.caret === 'right'
                ? outerTile.index + outerTile.length === currentSelection.endIndex
                : outerTile.index === currentSelection.startIndex;

            if (!isAtTileBorder) {
                return;
            }

            const adjacentTile = findAdjacentTile(outerTile, expansionDirection);
            if (!adjacentTile || adjacentTile.type === 'tag') {
                console.log("prevented");
                event.preventDefault();
            } 
        }
    }

    function handleUnfocus() {
        currentSelectionRef.current = null;
    }

    return <div ref={barRef} contentEditable={true}
        className="searchbar"
        onSelect={handleSelection} onBlur={handleUnfocus} onKeyDown={handleInput}>
        {tiles.map(it => it.node)}
    </div>
}

function InlineTag({
    color,
    children
}: React.PropsWithChildren<{
    color?: string,
}>): JSX.Element {
    const style: React.CSSProperties = {
        borderColor: color,
        color
    }

    return <span style={style} contentEditable={true} className="searchbar-inlinehint">{children}</span>
}

function findDomNodeByIndex(root: Node, targetIndex: number): Node | null {
    let result: Node | null = null;
    IndexTraversal.traverse(root, {
        visitNode(node, index, lengthSelf) {
            if (targetIndex <= index + lengthSelf) {
                result = node;
                return 'abort';
            }
            return 'visit';
        }
    });
    return result;
}

function findDomNodesByRange(root: Node, targetStartIndex: number, targetEndIndex: number): Array<Node> | null {
    let nodes: Array<Node> = [];
    IndexTraversal.traverse(root, {
        visitNode(node, index, lengthSelf) {
            if (nodes.length > 0) {
                if (targetEndIndex < index + lengthSelf) {
                    return 'abort';
                }
            } else {
                if (targetStartIndex > index + lengthSelf) {
                    return 'visit';
                }
            }

            nodes.push(node);
            return 'visit';
        }
    });
    return nodes.length > 0 ? nodes : null;
}
