import * as utils from "./utils.js";
import * as gesel from "../src/index.js";

test("fetchSingleSet works as expected", async () => {
    let c = await gesel.fetchAllSets("10090");

    // Same result as fetchSingleSet.
    let jump = Math.max(1, Math.trunc(c.length / 10));
    for (var i = 0; i < c.length; i += jump) {
        expect(c[i]).toEqual(await gesel.fetchSingleSet("10090", i, { forceRequest: true }));
        expect(c[i]).toEqual(await gesel.fetchSingleSet("10090", i, { forceRequest: false }));
    }

    let last = c.length - 1;
    expect(c[last]).toEqual(await gesel.fetchSingleSet("10090", last, { forceRequest: true }));
    expect(c[last]).toEqual(await gesel.fetchSingleSet("10090", last, { forceRequest: false }));
})

test("fetchSingleSet works correctly with initialization", async () => {
    expect(await gesel.fetchSingleSet("9606", null, { forceRequest: true })).toBeUndefined();
    expect(await gesel.fetchSingleSet("9606", null, { forceRequest: false })).toBeUndefined();
})

test("numberOfSets works as expected", async () => {
    expect(await gesel.numberOfSets("10090")).toEqual((await gesel.fetchAllSets("10090")).length);
})

