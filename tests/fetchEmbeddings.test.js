import * as utils from "./utils.js";
import * as gesel from "../src/index.js"

test("fetching sets for all embeddings works correctly", async () => {
    let full = await gesel.fetchEmbeddings("10090");
    let coll = await gesel.fetchAllSets("10090");
    expect(full.x.length).toEqual(coll.length); 
    expect(full.y.length).toEqual(coll.length); 

    // Check that the parsing was done correctly.
    expect(full.x.every(Number.isFinite)).toBe(true);
    expect(full.y.every(Number.isFinite)).toBe(true);
})
