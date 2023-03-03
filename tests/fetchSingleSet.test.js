import * as utils from "./utils.js";
import * as gesel from "../src/index.js";

test("fetchSingleSet works as expected", async () => {
    let c = await gesel.fetchAllSets();

    // Same result as fetchSingleSet.
    let jump = Math.max(1, Math.trunc(c.length / 10));
    for (var i = 0; i < c.length; i += jump) {
        expect(c[i]).toEqual(await gesel.fetchSingleSet(i, { forceRequest: true }));
        expect(c[i]).toEqual(await gesel.fetchSingleSet(i, { forceRequest: false }));
    }

    let last = c.length - 1;
    expect(c[last]).toEqual(await gesel.fetchSingleSet(last, { forceRequest: true }));
    expect(c[last]).toEqual(await gesel.fetchSingleSet(last, { forceRequest: false }));
})

