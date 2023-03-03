import * as utils from "./utils.js";

var init = false;
var ranges;
const cache = new Map;

/**
 * @param {number} gene - Gene ID, see {@linkcode fetchAllGenes} for details.
 *
 * @return {Uint32Array} Array of integers containing the IDs of all sets containing the gene.
 * IDs are treated as indices into the return value of {@linkcode fetchAllSets} or as input to {@linkcode fetchSingleSet}.
 * 
 * @async
 */
export async function fetchSetsForGene(gene) {
    let cached = cache.get(gene);
    if (typeof cached !== "undefined") {
        return cached;
    }

    if (!init) {
        ranges = await utils.retrieveRanges("gene2set.tsv");
        init = true;
    }

    let text = await utils.retrieveBytesByIndex("gene2set.tsv", ranges, gene);
    let output = utils.convertToUint32Array(text);
    cache.set(gene, output);
    return output;
}
