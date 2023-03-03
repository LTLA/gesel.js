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

var candidates = [
    "Adam8",
    "SNAP25",
    "ENSG00000000003",
    "ENSG11111000003",
    "asdasd",
    ""
];

test("mapping multiple genes works as expected", async () => {
    var output = gesel.mapMultipleGenes(candidates, "any");
    expect(output.length).toBe(candidates.length);

    // Symbols match both human and mouse.
    expect(output[0].status).toBe("multiple"); 
    expect(output[1].status).toBe("multiple"); 

    // This one is okay.
    expect(output[2].status).toBe("ok"); 
    expect(output[2].ensembl).toBe(candidates[2]); 
    var ginfo = gesel.genes();
    expect(ginfo[output[2].id].ensembl).toBe(candidates[2]);

    // Looks like Ensembl but is filtered out.
    expect(output[3].status).toBe("filtered");

    // Bad!
    expect(output[4].status).toBe("none");
    expect(output[5].status).toBe("none");
});

test("mapping multiple genes works with species constraints", async () => {
    var output = gesel.mapMultipleGenes(candidates, "Mus musculus");
    expect(output.length).toBe(candidates.length);

    expect(output[0].status).toBe("ok"); 
    expect(output[1].status).toBe("ok"); 

    // Filtered out.
    expect(output[2].status).toBe("filtered");
    expect(output[3].status).toBe("filtered");

    // Bad!
    expect(output[4].status).toBe("none");
    expect(output[5].status).toBe("none");
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

