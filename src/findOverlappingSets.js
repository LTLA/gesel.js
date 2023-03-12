import { fetchSetSizes } from "./fetchSingleSet.js";
import { fetchSetsForGene, effectiveNumberOfGenes } from "./fetchSetsForGene.js";
import * as enrich from "./testEnrichment.js";

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {Array} genes - Array of unique integers containing user-supplied gene IDs, see {@linkcode fetchAllGenes} for details.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.includeSize=true] - Whether to include the size of each set in the output.
 * @param {boolean} [options.testEnrichment=true] - Whether to compute the enrichment p-value for each set with {@linkcode testEnrichment}.
 * The list and universe sizes will only count genes that are involved in at least one set, by checking {@linkcode fetchSetsForGene} and {@linkcode effectiveNumberOfGenes} respectively.
 * @param {boolean} [options.forceDownload=false] - See {@linkcode fetchSetsForGene}.
 *
 * @return {Array} An array of objects, where each object corresponds to a set that has non-zero overlaps with `genes`.
 * Each object contains:
 *
 * - `id`: the ID of the set in {@linkcode fetchAllSets}.
 * - `count`: the number of genes in the set that overlap with genes in `genes`.
 * - `size`: the size of each set.
 *   Only included if `includeSize = true`.
 * - `pvalue`: the enrichment p-value.
 *   Only included if `testEnrichment = true`.
 *
 * @async
 */
export async function findOverlappingSets(species, genes, { includeSize = true, testEnrichment = true, forceDownload = false } = {}) {
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
        output.push(details);
    }

    let sets_sizes = (includeSize || testEnrichment ? await fetchSetSizes(species) : null);
    if (includeSize) {
        for (const details of output) {
            details.size = sets_sizes[details.id];
        }
    }
    if (testEnrichment) {
        let effective_list = 0; // only considering genes involved in at least one set.
        for (const v of collected) {
            effective_list += (v.length > 0);
        }
        let universe = await effectiveNumberOfGenes(species);
        for (const details of output) {
            details.pvalue = enrich.testEnrichment(details.count, effective_list, sets_sizes[details.id], universe);
        }
    }

    return output;
}
