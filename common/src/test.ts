import { DeepEqualityOptions, deepEquals } from "./util/equal.js"

export interface TestContext {
    assert: (probeName: string, condition: string, success: boolean) => void | never;
    fail: (probeName: string, reason: string) => void | never;

    assertEquals: (
        probeName: string, first: any, second: any, equalityOptions?: Omit<DeepEqualityOptions, 'maximumDepth'>
    ) => void | never;
    assertDeepEquals: (
        probeName: string, first: any, second: any, equalityOptions?: DeepEqualityOptions
    ) => void | never;

    testContext: (contextName: string, block: (ctx: TestContext) => void) => void;
}

export interface TestContextHandler {
        onRootRegistration?: (rootContextName: string, run: () => void) => void,
        onContextEnter?: (contextName: string) => void,
        onContextLeave?: (contextName: string) => void,
        onProbe?: (contextName: string, probeName: string) => void,
        onProbeFailure?: (contextName: string, probeName: string, reason: string) => void,
}

let testContextHandler: TestContextHandler | null = null;
export function setTestContextHandler(handler: typeof testContextHandler | null) {
    testContextHandler = handler;
}

export function testContext(contextName: string, block: (ctx: TestContext) => void) {
    console.log("at the beginning");
    
    if (testContextHandler === null) {
        return;
    }

    console.log("he");

    function buildContext(contextName: string): TestContext {
        return ({
            fail(probeName, reason) {
                testContextHandler?.onProbe?.(contextName, probeName);
                testContextHandler?.onProbeFailure?.(contextName, probeName, reason);
            },

            assert(probeName, condition, success) {
                testContextHandler?.onProbe?.(contextName, probeName);

                if (success) return;

                testContextHandler?.onProbeFailure?.(contextName, probeName, `Condition "${condition}" does not hold`);
            },
            
            assertEquals(probeName, first, second, equalityOptions) {
                testContextHandler?.onProbe?.(contextName, probeName);

                const optionsWithDepth = Object.assign({}, equalityOptions, { maximumDepth: 1 });
                if (deepEquals(first, second, optionsWithDepth)) return;

                testContextHandler?.onProbeFailure?.(contextName, probeName, `${first} not deep equals to ${second}`);
            },
            
            assertDeepEquals(probeName, first, second, equalityOptions) {
                testContextHandler?.onProbe?.(contextName, probeName);

                if (deepEquals(first, second, equalityOptions)) return;

                testContextHandler?.onProbeFailure?.(contextName, probeName, `${first} not deep equals to ${second}`);
            },
    
            testContext(contextName, block) {
                const innerContextName = `${contextName}/${contextName}`;
                const innerContext = buildContext(innerContextName);

                testContextHandler?.onContextEnter?.(innerContextName);
                block(innerContext);
                testContextHandler?.onContextLeave?.(innerContextName);
            }
        });
    }

    const context = buildContext(contextName);
    console.log("registering context");
    testContextHandler.onRootRegistration?.(contextName, () => {
        testContextHandler?.onContextEnter?.(contextName);
        block(context);
    });
}
