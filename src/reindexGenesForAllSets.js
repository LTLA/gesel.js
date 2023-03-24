/**
 * Reindex the gene sets for a user-defined gene universe.
 * This is helpful for applications that know their own gene universe and want to convert the **gesel** gene IDs to indices within that universe.
 *
 * @param {Array} geneMapping - Array of length equal to the number of genes in a user-defined gene universe.
 * Each entry corresponds to one gene in the user's universe and should be an array containing the corresponding **gesel** gene ID(s) (see {@linkcode fetchAllGenes} for details).
 * @param {Array} genesForSets - Array of length equal to the number of reference gene sets.
 * Each entry corresponds to a set and is an array containing **gesel** gene IDs for all genes in that set.
 * This is typically obtained from {@linkcode fetchGenesForAllSets}.
 *
 * @return {Array} Array of length equal to `genesForSets`. 
 * Each entry corresponds to a reference gene set and is a Uint32Array where the elements are indices into `geneMapping`, specifying the genes in the user's universe that belong to that set.
 * If a gene in `geneMapping` maps to multiple **gesel** IDs, it is considered to belong to all sets containing any of its mapped **gesel** gene IDs.
 */
export function reindexGenesForAllSets(geneMapping, genesForSets) {
    let reverse_mapping = new Map;
    for (var i = 0; i < geneMapping.length; i++) {
        for (const gesel_gene of geneMapping[i]) {
            let found = reverse_mapping.get(gesel_gene);
            if (typeof found == "undefined") {
                found = new Set;
                reverse_mapping.set(gesel_gene, found);
            }
            found.add(i);
        }
    }

    // Converting everything to an array for easier iteration. 
    for (const [k, v] of reverse_mapping) {
        reverse_mapping[k] = new Uint32Array(v);
    }

    let new_sets = new Array(genesForSets.length);
    for (var i = 0; i < genesForSets.length; i++) {
        let subset = new Set;
        for (const gesel_gene of genesForSets[i]) {
            let found = reverse_mapping.get(gesel_gene);
            if (typeof found !== "undefined") {
                for (const gene of found) {
                    subset.add(gene);
                }
            }
        }
        new_sets[i] = (new Uint32Array(subset)).sort();
    }

    return new_sets;
}

