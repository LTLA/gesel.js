import * as utils from "./utils.js";

var init = false;
var ranges;
const cache = new Map;

/**
 * @param {number} set - Set ID, see {@linkcode fetchAllSets} for details.
 *
 * @return {Uint32Array} Array of integers containing the IDs for all genes belonging to the set.
 * Gene IDs refer to indices in {@linkcode fetchAllGenes}.
 *
 * @async
 */
export async function fetchGenesForSet(set) {
    let cached = cache.get(set);
    if (typeof cached !== "undefined") {
        return cached;
    }

    if (!init) {
        ranges = await utils.retrieveRanges("set2gene.tsv");
        init = true;
    }

    let text = await utils.retrieveBytesByIndex("set2gene.tsv", ranges, set);
    let output = utils.convertToUint32Array(text);
    cache.set(set, output);
    return output;
}
