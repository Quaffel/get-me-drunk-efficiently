import NodeType from './node';

export namespace SimpleTraversal {
    export type VisitorResult = 'visit' | 'no-visit' | 'abort';

    export interface Visitor {
        visitNode(node: Node): VisitorResult;
        enterNode(node: Node): void;
        exitNode(node: Node): void;
    }

    export function traverse(root: Node, visitor: Visitor): boolean {
        const result = visitor.visitNode(root);
        if (result === 'no-visit') {
            return false;
        }
        if (result === 'abort') {
            return true;
        }

        visitor.enterNode(root);
        for (let child of Array.from(root.childNodes)) {
            const childResult = traverse(child, visitor);
            if (childResult === true) {
                return true;
            }
        }
        visitor.exitNode(root);
        return false;
    }
}

export namespace PayloadTraversal {
    export type PayloadPolicy = 'keep-payload' | 'discard-payload';
    export type ChildrenPolicy = 'visit-children' | 'evaluate-children' | 'ignore-children' | 'abort';

    export type VisitorResult = { payload: PayloadPolicy, children: ChildrenPolicy };
    export interface Visitor<T> {
        visitNode(node: Node, previousPayload: T, ownPayload: T): VisitorResult;
        enterNode?(node: Node, payloadOnEnter: T): void;
        exitNode?(node: Node, payloadOnEnter: T, payloadOnExit: T): void;
    }

    export function traverse<T>(
        root: Node,
        payloadMapper: (node: Node, previousPayload: T) => T,
        visitor: Visitor<T>,
        initialPayload: T
    ): T {
        let currentPayload = initialPayload;

        type TraversalFrame = { payloadOnEnter: T, policy: Exclude<ChildrenPolicy, 'ignore-children' | 'abort'> };
        let currentTraversalFrame: TraversalFrame = {
            payloadOnEnter: currentPayload,
            policy: 'visit-children'
        };
        let traversalStack: Array<TraversalFrame> = [currentTraversalFrame];

        SimpleTraversal.traverse(root, {
            visitNode(node) {
                const nodePayload = payloadMapper(node, currentPayload);

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
        });

        return currentPayload;
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
        return PayloadTraversal.traverse(
            root,
            (node, previous) => previous + (NodeType.isTextNode(node) ? (node as Text).textContent!!.length : 0),
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
            }, rootIndex);
    }
}
