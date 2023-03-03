import * as utils from "./utils.js";
import * as gesel from "../src/index.js";

test("fetchSingleCollection works as expected", async () => {
    let c = await gesel.fetchAllCollections();

    // Same result as fetchSingleCollection.
    let jump = Math.max(1, Math.trunc(c.length / 10));
    for (var i = 0; i < c.length; i += jump) {
        expect(c[i]).toEqual(await gesel.fetchSingleCollection(i, { forceRequest: true }));
        expect(c[i]).toEqual(await gesel.fetchSingleCollection(i, { forceRequest: false }));
    }

    let last = c.length - 1;
    expect(c[last]).toEqual(await gesel.fetchSingleCollection(last, { forceRequest: true }));
    expect(c[last]).toEqual(await gesel.fetchSingleCollection(last, { forceRequest: false }));
})

test("numberOfCollections works as expected", async () => {
    expect(await gesel.numberOfCollections()).toEqual((await gesel.fetchAllCollections()).length);
})

