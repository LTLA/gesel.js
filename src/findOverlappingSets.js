import { fetchSetSizes } from "./fetchSingleSet.js";
import { fetchSetsForGene } from "./fetchSetsForGene.js";

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {Array} genes - Array of unique integers containing user-supplied gene IDs, see {@linkcode fetchAllGenes} for details.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.includeSize=false] - Whether to include the size of each set in the output.
 * @param {boolean} [options.forceDownload=false] - See {@linkcode fetchSetsForGene}.
 *
 * @return {Array} An array of objects, where each object corresponds to a set that has non-zero overlaps with `genes`.
 * Each object contains:
 *
 * - `id`: the ID of the set in {@linkcode fetchAllSets}.
 * - `count`: the number of genes in the set that overlap with genes in `genes`.
 * - `size`: the size of each set.
 *   Only included if `includeSize = true`.
 *
 * @async
 */
export async function findOverlappingSets(species, genes, { includeSize = false, forceDownload = false } = {}) {
    await fetchSetsForGene(species, null, { forceDownload });

    let promises = [];
    let queried = new Set;
    for (const g of genes) {
        if (!queried.has(g)) {
            promises.push(fetchSetsForGene(species, g));
            queried.add(g);
        }
    }

    let collected = await Promise.all(promises);
    let sets_sizes = (includeSize ? await fetchSetSizes(species) : null);

    var set_count = new Map;
    for (const found of collected) {
        for (const set of found) {
            let current = set_count.get(set);
            if (typeof current == "undefined") {
                set_count.set(set, 1);
            } else {
                set_count.set(set, current + 1);
            }
        }
    }

    let output = [];
    for (const [id, count] of set_count) {
        let id0 = Number(id);
        let details = { 
            "id": id0,
            "count": count
        };
        if (includeSize) {
            details.size = sets_sizes[id0];
        }
        output.push(details);
    }

    return output;
}
