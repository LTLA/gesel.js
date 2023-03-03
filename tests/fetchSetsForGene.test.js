import * as utils from "./utils.js";
import * as gesel from "../src/index.js"

test("fetching sets for genes works correctly, more or less", async () => {
    let N = (await gesel.fetchAllGenes()).length;
    for (var i = 0; i < 10; i++) {
        let opt = Math.trunc(Math.random() * N);
        var val = await gesel.fetchSetsForGene(opt);
        expect(val.length > 0).toBe(true);
    }

    let last = N - 1;
    var val = await gesel.fetchSetsForGene(last);
    expect(val.length > 0).toBe(true);
});
