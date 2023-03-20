/**
 * Reindex the gene-to-set mappings for a user-defined gene universe.
 * This is helpful for applications that know their own gene universe and want to create a mapping of all sets containing each of their own genes.
 *
 * @param {Array} geneMapping - Array of length equal to the number of genes in a user-defined gene universe.
 * Each entry corresponds to one gene in the user's universe and contains the corresponding gesel gene ID(s) (see {@linkcode fetchAllGenes} for details).
 * Each entry can be either a number, for a 1:1 mapping; NaN, for a gene that has no matching gesel gene ID; or an array of gesel gene IDs, like that returned by {@linkcode searchGenes}.
 * @param {Array} setsForGenes - Array of length equal to the number of gesel gene IDs.
 * Each entry corresponds to a gesel gene ID and is an array containing the set IDs for all sets containing that gene.
 * This is typically obtained from {@linkcode fetchSetsForAllGenes}.
 *
 * @return {Array} Array of length equal to `geneMapping`.
 * Each entry corresponds to a gene in the user-supplied universe and is a Uint32Array where the elements are the gesel set IDs containing that gene.
 * If a gene in `geneMapping` maps to multiple gesel IDs, we report all sets containing any of its mapped gesel gene IDs.
 */
export function reindexSetsForAllGenes(geneMapping, setsForGenes) {
    let remapped = new Array(geneMapping.length);
    for (var i = 0; i < geneMapping.length; i++) {
        let collected = new Set;
        for (const gesel_gene of geneMapping[i]) {
            for (const set of setsForGenes[gesel_gene]) {
                collected.add(set);
            }
        }
        remapped[i] = (new Uint32Array(collected)).sort();
    }
    return remapped;
}
