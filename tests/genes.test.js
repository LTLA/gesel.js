import * as gesel from "../src/index.js";
import "isomorphic-fetch"

beforeAll(async () => { await gesel.initialize(); }, 10000);

test("genes extraction works as expected", () => {
    var g = gesel.genes();
    expect(g.length > 0).toBe(true);
});

test("genes by symbol extraction works as expected", () => {
    var g = gesel.genesBySymbol();
    expect("SNAP25" in g).toBe(true);
    expect("Snap25" in g).toBe(true);

    // Works with lower casing.
    var g2 = gesel.genesBySymbol({ lowerCase: true });
    let found = new Set(g2["snap25"]);
    let union = new Set([...g["SNAP25"], ...g["Snap25"]])

    for (const x of found) {
        expect(union.has(x)).toBe(true);
    }
    for (const x of union) {
        expect(found.has(x)).toBe(true);
    }
});

test("genes by Ensembl extraction works as expected", () => {
    var g = gesel.genesByEnsembl();
    expect("ENSG00000000003" in g).toBe(true);
});

test("Ensembl string detection works", () => {
    expect(gesel.possiblyEnsembl("ENSG00000000003")).toBe(true);
    expect(gesel.possiblyEnsembl("ensg00000000003")).toBe(true); // works with lower case.
    expect(gesel.possiblyEnsembl("ENSMUSG00000000003")).toBe(true); // works with mouse.

    expect(gesel.possiblyEnsembl("ENSG0000000003")).toBe(false);
    expect(gesel.possiblyEnsembl("blah")).toBe(false);
});
