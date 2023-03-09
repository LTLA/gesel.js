import * as utils from "./utils.js";

const _ranges = new Map;
const _cache = new Map;

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {?number} set - Set ID, see {@linkcode fetchAllSets} for details.
 *
 * If `null`, no request is performed, but various internal caches are initialized for subsequent calls to this function.
 * This is useful for guaranteeing that caches are available in concurrent calls.
 *
 * @return {Uint32Array} Array of integers containing the IDs for all genes belonging to the set.
 * Gene IDs refer to indices in {@linkcode fetchAllGenes}.
 *
 * If `set = null`, no return value is provided.
 * @async
 */
export async function fetchGenesForSet(species, set) {
    let spfound = _cache.get(species);
    if (typeof spfound == "undefined") {
        spfound = new Map;
        _cache.set(species, spfound);
        _ranges.set(species, await utils.retrieveRanges(species + "_set2gene.tsv"));
    }

    if (set == null) {
        return;
    }

    let sefound = spfound.get(set);
    if (typeof sefound !== "undefined") {
        return sefound;
    }

    let ranges = _ranges.get(species);
    let text = await utils.retrieveBytesByIndex(species + "_set2gene.tsv", ranges, set);
    let output = utils.convertToUint32Array(text);
    spfound.set(set, output);
    return output;
}
