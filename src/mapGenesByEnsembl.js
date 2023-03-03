import { fetchAllGenes } from "./fetchAllGenes.js";

var by_ens_init = false;
var by_ens = new Map;

/**
 * @return {Map} Map where each key is a string containing the Ensembl ID for a gene, and each value is an integer containing the **gesel** gene ID, 
 * i.e., an index into the array returned by {@linkcode fetchAllGenes}.
 * @async
 */
export async function mapGenesByEnsembl() {
    if (by_ens_init) {
        return by_ens;
    }

    let _genes = await fetchAllGenes();
    for (var i = 0; i < _genes.length; i++) {
        by_ens.set(_genes[i].ensembl, i);
    }

    by_ens_init = true;
    return by_ens;
}
