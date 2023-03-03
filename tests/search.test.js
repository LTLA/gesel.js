import * as gesel from "../src/index.js";
import "isomorphic-fetch"

beforeAll(async () => { await gesel.initialize(); }, 10000);

test("finding overlapping sets works as expected", async () => {
    var found = await gesel.findOverlappingSets([0, 1, 2, 3, 4, 100, 101, 102, 103]);
    expect(found.length > 0).toBe(true);
    expect(found[0].count > 1).toBe(true);

    // Should be sorted.
    var last = found[0].count;
    for (const x of found) {
        expect(x.count <= last).toBe(true);
    }
});

test.skip("searching by text works as expected", async () => {
    // Searching the names.
    {
        let results = await gesel.searchSetText("GO metabolism", { inDescription: false });
        expect(results.length).toBeGreaterThan(0);
        for (var i = 0; i < Math.min(10, results.length); i++) {
            let deets = await gesel.fetchSetDetails(results[i]);
            expect(deets.name).toMatch(/GO.*metabolism/i);
        }
    }

    // Searching the descriptions.
    {
        let results = await gesel.searchSetText("anneleen", { inName: false });
        expect(results.length).toBeGreaterThan(0);
        for (var i = 0; i < Math.min(10, results.length); i++) {
            let deets = await gesel.fetchSetDetails(results[i]);
            expect(deets.name).toMatch(/anneleen/i);
        }
    }
})

