import * as utils from "./utils.js";
import * as full from "./fetchSetsForAllGenes.js";

const _ranges = new Map;
const _cache = new Map;

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 *
 * @return {number} Number of genes that belong to at least one set for `species`.
 * This can be used as a more appropriate universe size in {@linkcode testEnrichment}.
 */
export async function effectiveNumberOfGenes(species) {
    let ffound = await full.fetchSetsForAllGenes(species, { download: false });
    if (ffound !== null) {
        let okay = 0;
        for (const x of ffound) {
            okay += x.length > 0;
        }
        return okay;
    }

    let ranged = _ranges.get(species);
    if (typeof ranged === "undefined") {
        _cache.set(species, new Map);
        ranged = await utils.retrieveRanges(species + "_gene2set.tsv")
        _ranges.set(species, ranged);
    }

    let okay = 0;
    for (var i = 1; i < ranged.length; i++) {
        if (ranged[i] > ranged[i-1] + 1) {
            okay++;
        }
    }

    return okay;
}

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {?number} gene - Gene ID, see {@linkcode fetchAllGenes} for details.
 *
 * If `null`, no request is performed, but various internal caches are initialized for subsequent calls to this function.
 * This is useful for guaranteeing that caches are available in concurrent calls.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.forceRequest=false] - Whether to force a range request to the server.
 * By default, the return value is extracted from the full gene-to-set mappings if {@linkcode fetchSetsForAllGenes} was called before this function. 
 * Setting this to `true` is only useful for testing.
 * @param {boolean} [options.forceDownload=false] - Whether to forcibly download all gene-to-set mappings up-front to avoid range requests.
 * This is done by calling {@linkcode fetchSetsForAllGenes}
 * Ignored if `forceRequest = true`.
 *
 * @return {Uint32Array} Array of integers containing the IDs of all sets containing the gene.
 * IDs are treated as indices into the return value of {@linkcode fetchAllSets} or as input to {@linkcode fetchSingleSet}.
 *
 * If `gene = null`, no return value is provided.
 * 
 * @async
 */
export async function fetchSetsForGene(species, gene, { forceRequest = false, forceDownload = false } = {}) {
    if (!forceRequest) {
        let ffound = await full.fetchSetsForAllGenes(species, { download: forceDownload });
        if (ffound !== null) {
            if (gene !== null) {
                return ffound[gene];
            } else {
                return;
            }
        }
    }

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
