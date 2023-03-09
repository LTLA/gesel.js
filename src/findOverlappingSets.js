import { fetchSetSizes } from "./fetchSingleSet.js";
import { fetchSetsForGene } from "./fetchSetsForGene.js";

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {Array} genes - Array of integers containing user-supplied gene IDs, see {@linkcode fetchAllGenes} for details.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.includeSize=false] - Whether to include the size of each set in the output.
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
export async function findOverlappingSets(species, genes, { includeSize = false } = {}) {
    var collected = await Promise.all(genes.map(x => fetchSetsForGene(species, x)));
    var sets_sizes = (includeSize ? await fetchSetSizes(species) : null);

    var set_count = {};
    for (const found of collected) {
        for (const set of found) {
            if (! (set in set_count)) {
                set_count[set] = 1;
            } else {
                ++(set_count[set]);
            }
        }
    }

    let output = [];
    for (const [id, count] of Object.entries(set_count)) {
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
