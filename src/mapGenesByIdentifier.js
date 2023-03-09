import { fetchAllGenes } from "./fetchAllGenes.js";

var by_symbol = new Map;
var by_symbol_lower = new Map;

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {string} type - Type of the identifier to use as the key of the map, e.g., `"ensembl"`.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.lowerCase=false] - Whether to use lower-case keys in the map.
 *
 * @return {Map} Map where each key is a string containing a (possibly lower-cased) identifier of the specified `type` and each value is an array.
 * Each array contains the **gesel** gene IDs associated with the `type` identifier, see {@linkcode fetchAllGenes} for ore details.
 *
 * @async
 */
export async function mapGenesByIdentifier(species, type, { lowerCase = false } = {}) {
    let host = (lowerCase ? by_symbol_lower : by_symbol);

    let sfound = host.get(species);
    if (typeof sfound === "undefined") {
        sfound = new Map;
        host.set(species, sfound);
    }

    let tfound = sfound.get(type);
    if (typeof tfound === "undefined") {
        tfound = new Map;
        sfound.set(type, tfound);

        let _genes = (await fetchAllGenes(species, { types: [ type ] })).get(type);
        for (var i = 0; i < _genes.length; i++) {
            for (let y of _genes[i]) {
                if (lowerCase) {
                    y = y.toLowerCase();
                }

                let current = tfound.get(y);
                if (typeof current !== "undefined") {
                    current.add(i);
                } else {
                    tfound.set(y, new Set([i]));
                }
            }
        }

        for (const [key, val] of tfound) {
            tfound.set(key, Array.from(val));
        }
    }

    return tfound;
}
