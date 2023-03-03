import * as utils from "./utils.js";
import * as gesel from "../src/index.js";

test("fetchGenesByEnsembl works as expected", async () => {
    let info = await gesel.fetchGenesByEnsembl();
    let ref = await gesel.fetchAllGenes();
    expect(info.size).toEqual(ref.length);

    let okay_ens = 0;
    let ids = [];
    for (const [k, v] of info) {
        okay_ens += k.match(/^(ENS|WBGene|FBgn)/) !== null;
        ids.push(v);
    }
    expect(okay_ens).toEqual(info.size);

    ids.sort((a, b) => a - b);
    let okay_ids = 0;
    for (var i = 0; i < ids.length; i++) {
        okay_ids += i == ids[i];
    }
    expect(okay_ids).toEqual(info.size);
})

