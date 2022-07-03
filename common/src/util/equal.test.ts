import { testContext } from "../test.js";

import { deepEquals } from "./equal.js";

// TODO: Primitives:    Test types exhaustively
// TODO: Objects:       Test different object key functions

testContext("deep-equality", ctx => {
    ctx.testContext("number", numberCtx => {
        numberCtx.assert("inf-eq-default", "infinities with same sign must be equal",
            deepEquals(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY) &&
            deepEquals(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY)
        );
        numberCtx.assert("inf-eq-loose", "infinities with same sign must be equal",
            deepEquals(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, { strictNumberEquality: false }) &&
            deepEquals(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, { strictNumberEquality: false })
        );
        numberCtx.assert("inf-eq-strict", "infinities with same sign must be equal",
            deepEquals(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, { strictNumberEquality: true }) &&
            deepEquals(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, { strictNumberEquality: true })
        );

        numberCtx.assert("inf-ne-default", "infinities with opposite signs must not be equal",
            !deepEquals(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY) &&
            !deepEquals(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY)
        );
        numberCtx.assert("inf-eq-loose", "infinities with opposite signs must not be equal",
            !deepEquals(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, { strictNumberEquality: false }) &&
            !deepEquals(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, { strictNumberEquality: false })
        );
        numberCtx.assert("inf-eq-strict", "infinities with opposite signs must not be equal",
            !deepEquals(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, { strictNumberEquality: true }) &&
            !deepEquals(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, { strictNumberEquality: true })
        );

        // 'NaN' must always equal 'NaN', regardless of whether number equality is strict.
        numberCtx.assert("NaN-eq-default", "'NaN' must equal 'NaN'",
            deepEquals(NaN, NaN)
        );
        numberCtx.assert("NaN-eq-loose", "'NaN' must equal 'NaN'",
            deepEquals(NaN, NaN, { strictNumberEquality: false })
        );
        numberCtx.assert("NaN-eq-strict", "'NaN' must equal 'NaN'",
            deepEquals(NaN, NaN, { strictNumberEquality: true })
        );

        numberCtx.assert("zero-eq-default", "+0 must equal -0",
            deepEquals(+0, -0)
        );
        numberCtx.assert("zero-eq-loose", "+0 must equal -0",
            deepEquals(+0, -0, { strictNumberEquality: false })
        );
        numberCtx.assert("zero-eq-strict", "+0 must not equal -0",
            !deepEquals(+0, -0, { strictNumberEquality: true })
        );
    });

    ctx.testContext("boolean", booleanCtx => {
        booleanCtx.assert("same-eq", "identical boolean values must be equal",
            deepEquals(true, true) &&
            deepEquals(false, false)        
        );
        booleanCtx.assert("diff-ne", "different boolean values must not be equal",
            deepEquals(false, true) &&
            deepEquals(false, true)        
        );
    });

    ctx.testContext("nullish", nullishCtx => {
        nullishCtx.assert("null-undefined-eq", "'null' must not equal 'undefined'",
            !deepEquals(null, undefined)
        );
        nullishCtx.assert("null-eq", "'null' must equal 'null'",
            deepEquals(undefined, undefined)
        );
        nullishCtx.assert("undefined-eq", "'undefined' must equal 'undefined'",
            deepEquals(undefined, undefined)
        );
    });

    ctx.testContext("cyclic", cyclicCtx => {
        function buildCyclicObject(variant: 1 | 2) {
            const obj = {
                outerObjProp: [
                    {
                        innerObjProp: undefined,
                        innerNullishProp: variant === 1 ? null : undefined,
                        innerNumberProp: variant * 2,
                        innerStringProp: "inner" + variant
                    }
                ],
                outerNullishProp: variant === 1 ? undefined : null,
                outerNumberProp: variant,
                outerStringProp: "outer" + variant
            };

            (obj.outerObjProp[0].innerObjProp as any) = obj;
            return obj;
        }

        cyclicCtx.assert("same-eq", "objects must be deep equal",
            deepEquals(buildCyclicObject(1), buildCyclicObject(1))
        );
        cyclicCtx.assert("diff-eq", "objects must not be deep equal",
            deepEquals(buildCyclicObject(1), buildCyclicObject(2))
        );

        cyclicCtx.testContext("depth", depthCtx => {
            const obj = buildCyclicObject(1);
            const equalObjWithOtherRef = buildCyclicObject(1);
            depthCtx.assert("max-depth", "fall back to referential equality when maximum depth is reached",
                deepEquals(obj, obj, { maximumDepth: 1 }) &&
                !deepEquals(obj, equalObjWithOtherRef, { maximumDepth: 1 })
            );
        });
    });
});