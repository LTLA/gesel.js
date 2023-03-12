import * as utils from "./utils.js";
import * as gesel from "../src/index.js"

test("fetching genes for sets works correctly, more or less", async () => {
    let N = await gesel.numberOfSets("9606");
    for (var i = 0; i < 10; i++) {
        let opt = Math.trunc(Math.random() * N);
        var val = await gesel.fetchGenesForSet("9606", opt);
        expect(val.length > 0).toBe(true);
    }

    let last = N - 1;
    var val = await gesel.fetchGenesForSet("9606", last);
    expect(val.length > 0).toBe(true);
});

test("fetching genes for sets works correctly with initialization", async () => {
    expect(await gesel.fetchGenesForSet("9606", null)).toBeUndefined();
})

test("fetching genes for sets works correctly with a full download beforehand", async () => {
    let full = await gesel.fetchGenesForAllSets("9606");
    for (var i = 0; i < 10; i++) {
        let opt = Math.trunc(Math.random() * full.length);
        var forced = await gesel.fetchGenesForSet("9606", opt, { forceRequest: true });
        expect(forced).toEqual(full[opt]);
        var cached = await gesel.fetchGenesForSet("9606", opt);
        expect(cached).toEqual(forced);
    }
})
