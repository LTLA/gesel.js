import * as utils from "./utils.js";
import * as gesel from "../src/index.js";

test("fetchAllSets works as expected", async () => {
    let sets = await gesel.fetchAllSets("7227");
    expect(sets.length).toBeGreaterThan(0);
    let coll = await gesel.fetchAllCollections("7227");

    let is_okay = 0;
    for (const x of sets) {
        is_okay += (typeof x.name == "string" && x.name.length > 0) &&
            (typeof x.description == "string" && x.description.length > 0) && 
            (typeof x.size == "number" && x.size >= 0) &&
            (typeof x.collection == "number" && x.collection >= 0 && x.collection < coll.length) &&
            (typeof x.number == "number" && x.number >= 0 && x.number < coll[x.collection].size);
    }

    expect(is_okay).toEqual(sets.length);
    expect(sets[0].collection).toEqual(0);
    expect(sets[0].number).toEqual(0);
})

