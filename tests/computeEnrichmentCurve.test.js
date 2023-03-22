import * as gesel from "../src/index.js";

test("computeEnrichmentCurve works as expected", async () => {
    // Works with arrays.
    {
        let out = gesel.computeEnrichmentCurve([ 2, [3, 4], [], [5] ], [ 2, 5 ]);
        expect(out.found).toEqual(new Uint32Array([0, 3]));
        expect(out.proportions).toEqual(new Float64Array([1/6, 1/7, 1/8, 2/9]));
    }

    // Works with sets.
    {
        let out = gesel.computeEnrichmentCurve([ 2, [3, 4], [], [5] ], new Set([ 3, 4 ]));
        expect(out.found).toEqual(new Uint32Array([1]));
        expect(out.proportions).toEqual(new Float64Array([0/6, 1/7, 1/8, 1/9]));
    }
})
