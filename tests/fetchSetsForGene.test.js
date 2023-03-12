import * as utils from "./utils.js";
import * as gesel from "../src/index.js"

test("fetching sets for genes works correctly, more or less", async () => {
    let N = (await gesel.fetchAllGenes("6239", { types: [ "ensembl" ] })).get("ensembl").length;
    for (var i = 0; i < 10; i++) {
        let opt = Math.trunc(Math.random() * N);
        var val = await gesel.fetchSetsForGene("6239", opt);
        expect(val instanceof Uint32Array).toBe(true);
    }

    let last = N - 1;
    var val = await gesel.fetchSetsForGene("6239", last);
    expect(val instanceof Uint32Array).toBe(true);
});

test("fetching sets for genes works correctly with initialization", async () => {
    expect(await gesel.fetchSetsForGene("6239", null)).toBeUndefined();
})

test("fetching sets for genes works correctly with a full download beforehand", async () => {
    let full = await gesel.fetchSetsForAllGenes("6239");
    for (var i = 0; i < 10; i++) {
        let opt = Math.trunc(Math.random() * full.length);
        var forced = await gesel.fetchSetsForGene("6239", opt, { forceRequest: true });
        expect(forced).toEqual(full[opt]);
        var cached = await gesel.fetchSetsForGene("6239", opt);
        expect(cached).toEqual(forced);
    }
})

test("effective number of genes is correctly determined", async () => {
    let N = (await gesel.fetchAllGenes("6239", { types: [ "ensembl" ] })).get("ensembl").length;
    expect(await gesel.effectiveNumberOfGenes("6239")).toBeLessThan(N);
})
