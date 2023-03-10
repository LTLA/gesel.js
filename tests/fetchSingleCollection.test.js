import * as utils from "./utils.js";
import * as gesel from "../src/index.js";

test("fetchSingleCollection works as expected", async () => {
    let c = await gesel.fetchAllCollections("9606");

    // Same result as fetchSingleCollection.
    let jump = Math.max(1, Math.trunc(c.length / 10));
    for (var i = 0; i < c.length; i += jump) {
        expect(c[i]).toEqual(await gesel.fetchSingleCollection("9606", i, { forceRequest: true }));
        expect(c[i]).toEqual(await gesel.fetchSingleCollection("9606", i, { forceRequest: false }));
    }

    let last = c.length - 1;
    expect(c[last]).toEqual(await gesel.fetchSingleCollection("9606", last, { forceRequest: true }));
    expect(c[last]).toEqual(await gesel.fetchSingleCollection("9606", last, { forceRequest: false }));
})

test("fetchSingleCollection works correctly with initialization", async () => {
    expect(await gesel.fetchSingleCollection("9606", null, { forceRequest: true })).toBeUndefined();
    expect(await gesel.fetchSingleCollection("9606", null, { forceRequest: false })).toBeUndefined();
})

test("numberOfCollections works as expected", async () => {
    expect(await gesel.numberOfCollections("9606")).toEqual((await gesel.fetchAllCollections("9606")).length);
})

test("fetchCollectionSizes works as expected", async () => {
    expect((await gesel.fetchCollectionSizes("9606")).length).toEqual((await gesel.fetchAllCollections("9606")).length);
})

