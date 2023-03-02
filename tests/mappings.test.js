import * as gesel from "../src/index.js"
import * as token from "../src/mappings.js"
import "isomorphic-fetch"

beforeAll(async () => { await gesel.initialize(); }, 10000);

test("fetching indices for a gene", async () => {
    var first = await gesel.fetchSetsForGene(0);
    expect(first.length > 0).toBe(true);
});

test("fetching indices for a sets", async () => {
    var first = await gesel.fetchGenesForSet(0);
    expect(first.length > 0).toBe(true);
});

test("fetching set details", async () => {
    var deets = await gesel.fetchSetDetails(0);
    expect(typeof deets.name).toBe("string");
    expect(typeof deets.description).toBe("string");
    expect(typeof deets.size).toBe("number");
    expect(typeof deets.collection).toBe("number");
    expect(typeof deets.number).toBe("number");
})

test("fetching collection details", async () => {
    var deets = await gesel.fetchCollectionDetails(0);
    expect(typeof deets.id).toBe("string");
    expect(typeof deets.start).toBe("number");
    expect(typeof deets.size).toBe("number");
    expect(typeof deets.title).toBe("string");
    expect(typeof deets.description).toBe("string");
    expect(typeof deets.species).toBe("string");
})

test("fetching sets by token", async () => {
    {
        let sets = await token.fetchSetsByNameToken("kegg");
        expect(sets.length).toBeGreaterThan(0);
    }

    {
        let sets = await token.fetchSetsByDescriptionToken("anneleen");
        expect(sets.length).toBeGreaterThan(0);
    }
})

