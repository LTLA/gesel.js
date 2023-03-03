import { baseUrl, decompressLines } from "./utils.js";

var init = false;
var _genes = [];

/**
 * Initialize gene-related **gesel** assets.
 *
 * @return {boolean} `true` once the gene information is initialized.
 * If it was already initialized, `false` is returned instead.
 *
 * @async
 */
export async function initializeGenes() {
    if (init) {
        return false;
    }

    var res = await fetch(baseUrl + "/symbol2gene.tsv.gz")
    if (!res.ok) {
        throw "failed to fetch gene information";
    }

    var buffer = await res.arrayBuffer();
    let gene_data = decompressLines(buffer);
    let end = 0;
    gene_data.forEach((x, i) => {
        let details = x.split("\t");
        _genes.push({
            "ensembl": details[0],
            "symbols": details.slice(1)
        });
    });

    init = true;
    return true;
}

/**
 * Retrieve information about each gene known to **gesel**.
 * This function assumes that the promise returned by {@linkcode initializeGenes} has already been resolved.
 *
 * @return {Array} Array of objects containing per-gene information.
 * Each object corresponds to a unique gene and contains:
 *
 * - `ensembl`, the Ensembl ID.
 * - `symbols`, an array of gene symbols.
 *   This may contain zero, one or multiple entries, depending on the number of aliases.
 */
export function genes() {
    return _genes;
}

var by_symbol_init = false;
var by_symbol = {};

var by_symbol_init_lower = false;
var by_symbol_lower = {};

/**
 * Index genes by symbol.
 * This function assumes that the promise returned by {@linkcode initializeGenes} has already been resolved.
 * 
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.lowerCase=false] - Whether to use lower-case gene symbols.
 *
 * @return {object} Object where keys are the gene symbols and values are arrays.
 * Each array contains the indices of genes associated with those symbols in {@linkcode genes}.
 */
export function genesBySymbol({ lowerCase = false } = {}) {
    if (!lowerCase) {
        if (by_symbol_init) {
            return by_symbol;
        }
    } else {
        if (by_symbol_init_lower) {
            return by_symbol_lower;
        }
    }

    var thing = (lowerCase ? by_symbol_lower : by_symbol);
    _genes.forEach((x, i) => { 
        x.symbols.forEach(y => {
            if (lowerCase) {
                y = y.toLowerCase();
            }
            if (y in thing) {
                thing[y].add(i);
            } else {
                thing[y] = new Set([i]);
            }
        });
    });

    for (const [key, val] of Object.entries(thing)) {
        thing[key] = Array.from(val);
    }

    if (!lowerCase) {
        by_symbol_init = true;
    } else {
        by_symbol_init_lower = true;
    }

    return thing;
}

var by_ens_init = false;
var by_ens = {};

/**
 * Index genes by their (unique) Ensembl ID.
 * This function assumes that the promise returned by {@linkcode initializeGenes} has already been resolved.
 *
 * @return {object} Object where keys are the Ensembl IDs and values are the indices of the corresponding genes in {@linkcode genes}.
 */
export function genesByEnsembl() {
    if (by_ens_init) {
        return by_ens;
    }

    _genes.forEach((x, i) => { 
        // These should be unique, so I won't bother checking.
        by_ens[x.ensembl] = i;
    });

    by_ens_init = true;
    return by_ens;
}

/** 
 * Check if a string contains an Ensembl ID.
 *
 * @param {string} x - String containing a potential Ensembl ID.
 *
 * @return {boolean} Boolean indicating whether `x` looks like an Ensembl ID.
 */
export function possiblyEnsembl(x) {
    return x.match(/^ENS[A-Z]*G[0-9]{11}$/i) !== null;
}
