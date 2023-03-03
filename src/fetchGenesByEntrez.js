import { fetchAllGenes } from "./fetchAllGenes.js";

var by_entrez_init = false;
var by_entrez = new Map;

/**
 * @return {Map} Map where each key is a string containing a Entrez ID and each value is an array.
 * Each array contains the **gesel** gene IDs associated with that Entrez ID, where gene IDs are defined as indices into the array returned by {@linkcode fetchAllGenes}.
 *
 * @async
 */
export async function fetchGenesByEntrez() {
    if (by_entrez_init) {
        return by_entrez;
    }

    let _genes = await fetchAllGenes({ mapping: "entrez" });

    for (var i = 0; i < _genes.length; i++) {
        for (const y of _genes[i].entrez) {
            let current = by_entrez.get(y);
            if (typeof current !== "undefined") {
                current.add(i);
            } else {
                by_entrez.set(y, new Set([i]));
            }
        }
    }

    for (const [key, val] of by_entrez) {
        by_entrez.set(key, Array.from(val));
    }

    by_entrez_init = true;
    return by_entrez;
}
