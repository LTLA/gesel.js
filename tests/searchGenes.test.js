import * as utils from "./utils.js";
import * as gesel from "../src/index.js";

var candidates = [
    "Adam8",
    "SNAP25",
    "ENSG00000000003",
    "ensg00000000005",
    "ENSG11111000003",
    "asdasd",
    ""
];

test("mapping multiple genes works as expected", async () => {
    var output = await gesel.searchGenes(candidates, null);
    expect(output.length).toBe(candidates.length);

    // Symbols match both human and mouse.
    expect(output[0].length).toBeGreaterThan(1);
    expect(output[1].length).toBeGreaterThan(1);

    // This one is okay.
    expect(output[2].length).toBe(1);
    var ginfo = await gesel.fetchAllGenes();
    expect(ginfo[output[2][0]].ensembl).toBe(candidates[2]);

    // This one is also okay.
    expect(output[3].length).toBe(1);
    var ginfo = await gesel.fetchAllGenes();
    expect(ginfo[output[3][0]].ensembl).toBe(candidates[3].toUpperCase());

    // Bad!
    expect(output[4].length).toBe(0);
    expect(output[5].length).toBe(0);
    expect(output[6].length).toBe(0);
});

test("mapping multiple genes works in a case-sensitive manner", async () => {
    var ref = await gesel.searchGenes(candidates, null);
    var output = await gesel.searchGenes(candidates, null, { ignoreCase: false });
    expect(output.length).toBe(candidates.length);

    // Symbols don't match both human/mouse anymore.
    expect(output[0].length).toBeLessThan(ref[0].length);
    expect(output[1].length).toBeLessThan(ref[1].length);

    // This one is okay.
    expect(output[2].length).toBe(1);

    // But now this one is not.
    expect(output[3].length).toBe(0);

    // These are still bad!
    expect(output[4].length).toBe(0);
    expect(output[5].length).toBe(0);
    expect(output[6].length).toBe(0);
});

test("mapping multiple genes works with species constraints", async () => {
    var output = await gesel.searchGenes(candidates, "Mus musculus");
    expect(output.length).toBe(candidates.length);

    // Only one match expected.
    expect(output[0].length).toBe(1);
    expect(output[1].length).toBe(1); 

    // Everything else is bad now.
    expect(output[2].length).toBe(0);
    expect(output[3].length).toBe(0);
    expect(output[4].length).toBe(0);
    expect(output[5].length).toBe(0);
    expect(output[6].length).toBe(0);
});

