import NodeType from './node';

export type ChildrenMapper<N> = (node: N) => Array<N>
const DomChildrenMapper = (node: Node) => Array.from(node.childNodes);

export namespace SimpleTraversal {
    export type VisitorResult = 'visit' | 'no-visit' | 'abort';
    export interface Visitor<N> {
        visitNode(node: N): VisitorResult;
        enterNode(node: N): void;
        exitNode(node: N): void;
    }
    export function traverse<N = Node>(root: N, visitor: Visitor<N>, childrenMapper: ChildrenMapper<N>): boolean {
        const result = visitor.visitNode(root);
        if (result === 'no-visit') {
            return false;
        }
        if (result === 'abort') {
            return true;
        }

        visitor.enterNode(root);
        for (let child of childrenMapper(root)) {
            const childResult = traverse(child, visitor, childrenMapper);
            if (childResult === true) {
                return true;
            }
        }
        visitor.exitNode(root);
        return false;
    }

    export function traverseDom(root: Node, visitor: Visitor<Node>): boolean {
        return traverse(root, visitor, DomChildrenMapper);
    }
}

export namespace PayloadTraversal {
    export type PayloadPolicy = 'keep-payload' | 'discard-payload';
    export type ChildrenPolicy = 'visit-children' | 'evaluate-children' | 'ignore-children' | 'abort';

    export type VisitorResult = { payload: PayloadPolicy, children: ChildrenPolicy };
    export interface Visitor<N, T> {
        visitNode(node: N, previousPayload: T, ownPayload: T): VisitorResult;
        enterNode?(node: N, payloadOnEnter: T): void;
        exitNode?(node: N, payloadOnEnter: T, payloadOnExit: T): void;
    }

    export function traverse<N, P>(
        root: N,
        visitor: Visitor<N, P>,
        mapperInfo: {
            payload: (node: N, previousPayload: P) => P,
            children: ChildrenMapper<N>
        },
        initialPayload: P
    ): P {
        let currentPayload = initialPayload;

        type TraversalFrame = { payloadOnEnter: P, policy: Exclude<ChildrenPolicy, 'ignore-children' | 'abort'> };
        let currentTraversalFrame: TraversalFrame = {
            payloadOnEnter: currentPayload,
            policy: 'visit-children'
        };
        let traversalStack: Array<TraversalFrame> = [currentTraversalFrame];

        SimpleTraversal.traverse<N>(root, {
            visitNode(node) {
                const nodePayload = mapperInfo.payload(node, currentPayload);

                const policy: VisitorResult = currentTraversalFrame.policy === 'visit-children'
                    ? visitor.visitNode(node, currentPayload, nodePayload)
                    : { payload: 'keep-payload', children: 'evaluate-children' };

                if (policy.payload === 'keep-payload') {
                    currentPayload = nodePayload;
                }

                if (policy.children === 'abort') {
                    return 'abort';
                }
                if (policy.children === 'ignore-children') {
                    return 'no-visit';
                }

                traversalStack.push({
                    payloadOnEnter: nodePayload,
                    policy: policy.children
                });
                return 'visit';
            },
            enterNode(node) {
                currentTraversalFrame = traversalStack[traversalStack.length - 1];
                if (currentTraversalFrame.policy === 'visit-children') {
                    visitor.enterNode?.(node, currentPayload);
                }
            },
            exitNode(node) {
                currentTraversalFrame = traversalStack.splice(-1, 1)[0]; // Remove stack's top element
                if (currentTraversalFrame.policy === 'visit-children') {
                    visitor.exitNode?.(node, currentTraversalFrame.payloadOnEnter, currentPayload);
                }
            }
        }, mapperInfo.children);

        return currentPayload;
    }

    export function traverseDom<P>(
        root: Node,
        visitor: Visitor<Node, P>,
        payloadMapper: (node: Node, previousPayload: P) => P,
        initialPayload: P
    ): P {
        return traverse<Node, P>(root, visitor, {
            payload: payloadMapper,
            children: DomChildrenMapper
        }, initialPayload);
    }
}

export namespace IndexTraversal {
    export type VisitorResult = 'visit' | 'no-visit' | 'abort';
    export interface Visitor {
        visitNode(node: Node, index: number, lengthSelf: number): VisitorResult;
        enterNode?(node: Node, indexOnEnter: number): void;
        exitNode?(node: Node, indexOnEnter: number, indexOnExit: number): void;
    }

    export function traverse(root: Node, visitor: Visitor, rootIndex: number = 0): number {
        return PayloadTraversal.traverseDom(
            root,
            {
                visitNode(node, currentIndex, indexWithSelf) {
                    const length = indexWithSelf - currentIndex;
                    const policy = visitor.visitNode(node, currentIndex, length);
                    if (policy === 'abort') {
                        return { payload: 'discard-payload', children: 'abort' };
                    }

                    return policy === 'visit'
                        ? { payload: 'keep-payload', children: 'visit-children' }
                        : { payload: 'keep-payload', children: 'evaluate-children' };
                },
                enterNode(node, indexOnEnter) {
                    visitor.enterNode?.(node, indexOnEnter);
                },
                exitNode(node, indexOnEnter, indexOnExit) {
                    visitor.exitNode?.(node, indexOnEnter, indexOnExit);
                }
            },
            (node, previous) => previous + (NodeType.isTextNode(node) ? (node as Text).textContent!!.length : 0),
            rootIndex
        );
    }
}
