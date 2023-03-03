import { fetchAllGenes } from "./fetchAllGenes.js";

var by_symbol_init = false;
var by_symbol = new Map;

var by_symbol_init_lower = false;
var by_symbol_lower = new Map;

/**
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.lowerCase=false] - Whether to use lower-case gene symbols.
 *
 * @return {Map} Map where each key is a string containing a (possibly lower-cased) gene symbol and each value is an array.
 * Each array contains the **gesel** gene IDs associated with that symbol, where gene IDs are defined as indices into the array returned by {@linkcode fetchAllGenes}.
 *
 * @async
 */
export async function mapGenesBySymbol({ lowerCase = false } = {}) {
    if (!lowerCase) {
        if (by_symbol_init) {
            return by_symbol;
        }
    } else {
        if (by_symbol_init_lower) {
            return by_symbol_lower;
        }
    }

    let _genes = await fetchAllGenes({ mapping: "symbol" });

    var thing = (lowerCase ? by_symbol_lower : by_symbol);
    for (var i = 0; i < _genes.length; i++) {
        for (let y of _genes[i].symbol) {
            if (lowerCase) {
                y = y.toLowerCase();
            }

            let current = thing.get(y);
            if (typeof current !== "undefined") {
                current.add(i);
            } else {
                thing.set(y, new Set([i]));
            }
        }
    }

    for (const [key, val] of thing) {
        thing.set(key, Array.from(val));
    }

    if (!lowerCase) {
        by_symbol_init = true;
    } else {
        by_symbol_init_lower = true;
    }
    return thing;
}
