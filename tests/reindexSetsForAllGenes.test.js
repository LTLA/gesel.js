import * as utils from "./utils.js";
import * as gesel from "../src/index.js";

test("reindexSetsForAllGenes works as expected", async () => {
    let gene_mappings = [[1, 3], [], [2], [4, 5], [0]];
    let set_mappings = [ 
        [100, 300],
        [200, 300, 500],
        [],
        [400],
        [500, 600],
        [100, 600, 700]
    ];

    let remapped = gesel.reindexSetsForAllGenes(gene_mappings, set_mappings);
    expect(remapped.length).toEqual(gene_mappings.length);

    expect(remapped[0]).toEqual(new Uint32Array([200, 300, 400, 500]));
    expect(remapped[1]).toEqual(new Uint32Array([]));
    expect(remapped[2]).toEqual(new Uint32Array([]));
    expect(remapped[3]).toEqual(new Uint32Array([100, 500, 600, 700]));
    expect(remapped[4]).toEqual(new Uint32Array([100, 300]));
})

