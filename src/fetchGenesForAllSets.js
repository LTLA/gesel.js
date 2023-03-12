import * as utils from "./utils.js";

const _cache = new Map;

export function already_initialized(species) {
    let found = _cache.get(species);
    if (typeof found !== "undefined") {
        return found;
    } else {
        return null;
    }
}

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 *
 * @return {Array} Array of length equal to the total number of sets for this `species`.
 * Each element corresponds to an entry in {@linkcode fetchAllSets} and is an array of integers containing the IDs for all genes belonging to that set.
 * Gene IDs refer to indices in {@linkcode fetchAllGenes}.
 *
 * @async
 */
export async function fetchGenesForAllSets(species) {
    let found = already_initialized(species);
    if (found !== null) {
        return found;
    }

    let res = await utils.reference_download(species + "_set2gene.tsv.gz");
    if (!res.ok) {
        throw new Error("failed to fetch full set-to-gene information for species '" + species + "'");
    }

    var set_data = utils.decompressLines(await res.arrayBuffer());
    let loaded = set_data.map(utils.convertToUint32Array);
    _cache.set(species, loaded);
    return loaded;
}
