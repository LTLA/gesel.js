import * as utils from "./utils.js";
import * as gesel from "../src/index.js";

test("reindexGenesForAllSets works as expected", async () => {
    let sets = [ 
        new Uint32Array([1, 6, 8, 12]), // includes 8, which maps to multiple user genes
        new Int32Array([2, 5, 11]), // includes 5, which maps to multiple user genes.
        [1, 3, 6], // includes 1 and 3, which map to the same user gene.
        [9, 11, 12]  // includes 9, which maps to no user gene.
    ];
    let gene_mappings = [[1, 3], [], [5, 8, 10], [11], [12], [2], [4, 8], [], [6], [5]];

    let remapped = gesel.reindexGenesForAllSets(gene_mappings, sets);
    expect(remapped.length).toEqual(sets.length);

    expect(remapped[0]).toEqual(new Uint32Array([0 /* 1 */, 2 /* 8 */, 4 /* 12 */, 6 /* 8 */, 8 /* 6 */]))
    expect(remapped[1]).toEqual(new Uint32Array([2 /* 5 */, 3 /* 11 */, 5 /* 2 */, 9 /* 5 */]));
    expect(remapped[2]).toEqual(new Uint32Array([0 /* 1 and 3 */, 8 /* 6 */]));
    expect(remapped[3]).toEqual(new Uint32Array([3 /* 11 */, 4 /* 12 */]));
})

