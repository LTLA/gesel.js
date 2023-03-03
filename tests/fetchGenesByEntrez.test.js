import * as utils from "./utils.js";
import * as gesel from "../src/index.js";

test("fetchGenesByEntrez works as expected", async () => {
    let info = await gesel.fetchGenesByEntrez();
    expect(info.size).toBeGreaterThan(0);
    let nvals = (await gesel.fetchAllGenes()).length;

    let okay_ent = 0;
    let okay_ids = 0;
    for (const [k, v] of info) {
        okay_ent += k.match(/^[0-9]+$/) !== null;
        okay_ids += v.every(y => (y >= 0 && y < nvals));
    }
    expect(okay_ent).toEqual(info.size);
    expect(okay_ids).toEqual(info.size);
})
