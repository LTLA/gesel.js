import * as utils from "./utils.js";
import * as gesel from "../src/index.js";

test("fetchAllGenes works as expected", async () => {
    let info = await gesel.fetchAllGenes();
    expect(info.length).toBeGreaterThan(0);

    let okay_ens = 0;
    let okay_sym = 0;
    for (const x of info) {
        okay_ens += x.ensembl.match(/^(ENS|WBGene|FBgn)/) !== null;
        okay_sym += x.symbol instanceof Array;
    }

    expect(okay_ens).toEqual(info.length);
    expect(okay_sym).toEqual(info.length);
})

test("fetchAllGenes works as expected with Entrez mappings", async () => {
    let ref = await gesel.fetchAllGenes({ mapping: "both" });
    let info = await gesel.fetchAllGenes({ mapping: "entrez" });
    expect(info.length).toEqual(ref.length);

    let okay_ent = 0;
    let okay_sym = 0;
    for (const x of info) {
        okay_ent += x.entrez instanceof Array;
        okay_sym += x.symbol instanceof Array; // symbols are still around from previous call.
    }

    expect(okay_ent).toEqual(info.length);
    expect(okay_sym).toEqual(info.length);
})

