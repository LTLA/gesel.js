import * as utils from "./utils.js";
import * as gesel from "../src/index.js";

test("fetchGenesBySymbol works as expected", async () => {
    let info = await gesel.fetchGenesBySymbol();
    expect(info.size).toBeGreaterThan(0);
    let nvals = (await gesel.fetchAllGenes()).length;

    let is_upper = 0;
    let okay_ids = 0;
    for (const [k, v] of info) {
        is_upper += (k.toLowerCase() !== k);
        okay_ids += v.every(y => (y >= 0 && y < nvals));
    }

    expect(is_upper).toBeGreaterThan(0);
    expect(okay_ids).toEqual(info.size);

    // Check with a more concrete example.
    expect(info.has("SNAP25")).toBe(true);
    expect(info.has("Snap25")).toBe(true);
})

test("fetchGenesBySymbol works as expected with lowercasing", async () => {
    let info = await gesel.fetchGenesBySymbol({ lowerCase: true });
    expect(info.size).toBeGreaterThan(0);
    let nvals = (await gesel.fetchAllGenes()).length;

    let is_upper = 0;
    let okay_ids = 0;
    for (const [k, v] of info) {
        is_upper += (k.toLowerCase() !== k);
        okay_ids += v.every(y => (y >= 0 && y < nvals));
    }

    expect(is_upper).toBe(0);
    expect(okay_ids).toEqual(info.size);

    // Check with a more concrete example.
    let ref = await gesel.fetchGenesBySymbol();
    let found = new Set(info.get("snap25"));
    let union = new Set([...ref.get("SNAP25"), ...ref.get("Snap25")]);
    expect(Array.from(found).sort()).toEqual(Array.from(union).sort());
})
