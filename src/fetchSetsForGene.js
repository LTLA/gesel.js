import * as utils from "./utils.js";

const _ranges = new Map;
const _cache = new Map;

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {?number} gene - Gene ID, see {@linkcode fetchAllGenes} for details.
 *
 * If `null`, no request is performed, but various internal caches are initialized for subsequent calls to this function.
 * This is useful for guaranteeing that caches are available in concurrent calls.
 *
 * @return {Uint32Array} Array of integers containing the IDs of all sets containing the gene.
 * IDs are treated as indices into the return value of {@linkcode fetchAllSets} or as input to {@linkcode fetchSingleSet}.
 *
 * If `gene = null`, no return value is provided.
 * 
 * @async
 */
export async function fetchSetsForGene(species, gene) {
    let spfound = _cache.get(species);
    if (typeof spfound === "undefined") {
        spfound = new Map;
        _cache.set(species, spfound);
        _ranges.set(species, await utils.retrieveRanges(species + "_gene2set.tsv"));
    }
    if (gene == null) {
        return;
    }

    let gfound = spfound.get(gene);
    if (typeof gfound !== "undefined") {
        return gfound;
    }

    let text = await utils.retrieveBytesByIndex(species + "_gene2set.tsv", _ranges.get(species), gene);
    let output = utils.convertToUint32Array(text);
    spfound.set(gene, output);
    return output;
}
