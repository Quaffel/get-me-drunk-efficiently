import assert from 'assert';
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
    export type VisitorResult<T> = [
        childrenPolicy: 'visit' | 'count-no-visit' | 'no-count-no-visit' | 'abort',
        payload: T
    ];
    export interface Visitor<T> {
        visitNode(node: Node, payload: T): VisitorResult<T>;
        enterNode?(node: Node, payloadOnEnter: T): void;
        exitNode?(node: Node, payloadOnEnter: T, payloadOnExit: T): void;
    }

    export function traverse<T>(root: Node, visitor: Visitor<T>, rootPayload: T): T {
        let traversalStack: Array<{ payloadOnEnter: T, reportTraversal: boolean }> = [];
        let currentPayload = rootPayload;

        SimpleTraversal.traverse(root, {
            visitNode(node) {
                const [policy, payload] = visitor.visitNode(node, currentPayload);
                currentPayload = payload;

                if (policy === 'abort') {
                    return 'abort';
                }
                if (policy === 'no-count-no-visit') {
                    return 'no-visit';
                }

                assert(policy === 'visit' || policy === 'count-no-visit', "unreachable");
                traversalStack.push({ 
                    payloadOnEnter: payload,
                    reportTraversal: policy === 'visit'
                });

                return 'visit';
            },
            enterNode(node) {
                const top = traversalStack[traversalStack.length - 1];
                if (top.reportTraversal) {
                    visitor.enterNode?.(node, currentPayload);
                }
            },
            exitNode(node) {
                const top = traversalStack.splice(-1, 1)[0]; // Remove stack's top element
                if (top.reportTraversal){ 
                    visitor.exitNode?.(node, top.payloadOnEnter, currentPayload);
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
        return PayloadTraversal.traverse(root, {
            visitNode(node, currentIndex) {
                let length = 0;
                if (NodeType.isTextNode(node)) {
                    length = (node as Text).textContent?.length ?? 0;
                }
                
                const policy = visitor.visitNode(node, currentIndex, length);
                if (policy === 'abort') {
                    return ['abort', currentIndex];
                }

                return [policy === 'visit' ? 'visit' : 'count-no-visit', currentIndex + length];
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
