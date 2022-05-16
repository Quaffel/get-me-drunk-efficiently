import { IndexTraversal } from './traversal';

export interface RangeSelection {
    type: 'range',
    startIndex: number,
    endIndex: number,
    range: Range
}

export interface SingleSelection {
    type: 'single',
    index: number,
    node: Node,
    range: Range
}

// Currently only supported by Firefox.
export interface MultiSelection {
    type: 'multi'
}

export type SelectionData = RangeSelection | SingleSelection | MultiSelection;

export function resolveCurrentSelection(root: Node): SelectionData | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount < 1) {
        return null;
    }

    if (selection.rangeCount > 1) {
        return { type: 'multi' };
    }

    const range = selection.getRangeAt(0);

    // Fast path: Single selection OR
    // range selection with selection being within the bounds of a single container
    if (range.startContainer === range.endContainer) {
        const startNode = range.startContainer;
        let nodeIndex = IndexTraversal.traverse(root, {
            visitNode(node) {
                if (node === startNode) {
                    return 'abort';
                }
                return 'visit';
            }   
        });

        if (range.startOffset === range.endOffset) {
            return {
                type: 'single',
                index: nodeIndex + range.startOffset,
                node: startNode,
                range
            }
        }

        return {
            type: 'range',
            startIndex: nodeIndex + range.startOffset,
            endIndex: nodeIndex + range.endOffset,
            range
        }
    }

    const startNode = range.startContainer;
    const endNode = range.endContainer;

    let startNodeIndex = -1;
    let endNodeIndex = -1;
    IndexTraversal.traverse(root, {
        visitNode(node, index) {
            if (node === startNode) {
                startNodeIndex = index;
            }
            if (node === endNode) {
                if (startNodeIndex == -1) throw new Error("Encountered end container before start container");
                endNodeIndex = index;
                return 'abort';
            }

            return 'visit';
        }
    });

    return {
        type: 'range',
        startIndex: startNodeIndex + range.startOffset,
        endIndex: endNodeIndex + range.endOffset,
        range
    };
}

export function createRange(
    startInfo: { node: Node, offset: number }, 
    endInfo: { node: Node, offset: number } | undefined
): Range {
    if (!endInfo) {
        endInfo = startInfo;
    }

    const range = new Range();
    range.setStart(startInfo.node, startInfo.offset);
    range.setEnd(endInfo.node, endInfo.offset);

    return range;
}
