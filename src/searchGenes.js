import { fetchAllGenes } from "./fetchAllGenes.js";
import { mapGenesByEnsembl } from "./mapGenesByEnsembl.js";
import { mapGenesBySymbol } from "./mapGenesBySymbol.js";
import { mapGenesByEntrez } from "./mapGenesByEntrez.js";

function define_prefix(species) {
    var prefix = null;
    if (species !== null) {
        switch(species) {
            case "Homo sapiens":
                prefix = "ENSG";
                break;
            case "Mus musculus":
                prefix = "ENSMUSG";
                break;
            case "Macaca fascicularis":
                prefix = "ENSMFAG";
                break;
            case "Rattus norvegicus":
                prefix = "ENSRNOG";
                break;
            case "Caenorhabditis elegans":
                prefix = "WBGene";
                break;
            case "Drosophila melanogaster":
                prefix = "FBgn";
                break;
            case "Pan troglodytes":
                prefix = "ENSPTRG";
                break;
            case "Danio rerio":
                prefix = "ENSDARG";
                break;
        }
    }
    return prefix;
}

/**
 * @param {Array} searches - Array of strings containing gene identifiers of some kind (e.g., Ensembl, symbol, Entrez).
 * @param {?string} species - String specifying the species of interest.
 * This is used to filter the matching genes to the indicated species.
 * We currently support `"Homo sapiens"`, `"Mus musculus"`, `"Macaca fascicularis"`, `"Rattus norvegicus"`, `"Caenorhabditis elegans"`, `"Drosophila melanogaster"`, `"Pan troglodytes"` and `"Danio rerio"`;
 * any other string or `null` is ignored.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.ignoreCase=true] - Whether to ignore case in the search query.
 * @param {boolean} [options.allowSymbol=true] - Whether strings in `searches` might be symbols.
 * @param {boolean} [options.allowEntrez=false] - Whether strings in `searches` might be Entrez IDs.
 *
 * @return {Array} An array of length equal to `searches`.
 * Each element of the array is an array containing the **gesel** gene IDs that match the corresponding search string.
 * Each gene ID is an index into the array returned by {@linkcode fetchAllGenes}.
 *
 * @async
 */
export async function searchGenes(searches, species, { ignoreCase = true, allowSymbol = true, allowEntrez = false } ={}) {
    var by_ens = await mapGenesByEnsembl();
    var by_sym = (allowSymbol ? await mapGenesBySymbol({ lowerCase: ignoreCase }) : new Map);
    var by_ent = (allowEntrez ? await mapGenesByEntrez() : new Map);
    var mapping = [];

    // Adding all the mapped entries first.
    for (var i = 0; i < searches.length; i++) {
        let current = searches[i];
        if (current.length == 0) {
            mapping.push([]);
            continue;
        }

        {
            let proper = (ignoreCase ? current.toUpperCase() : current);
            let in_ens = by_ens.get(proper);
            if (typeof in_ens !== "undefined") {
                mapping.push([in_ens]);
                continue;
            }
        }

        if (allowSymbol) {
            let proper = (ignoreCase ? current.toLowerCase() : current);
            let in_sym = by_sym.get(proper);
            if (typeof in_sym !== "undefined") {
                mapping.push(in_sym);
                continue;
            }
        }

        if (allowEntrez) {
            let in_ent = by_ent.get(current);
            if (typeof in_ent !== "undefined") {
                mapping.push(in_ent);
                continue;
            }
        }

        mapping.push([]);
    }

    // Pruning them to the desired species.
    var prefix = define_prefix(species);
    if (prefix !== null) {
        let ginfo = await fetchAllGenes();
        for (var i = 0; i < mapping.length; i++) {
            let replacement = [];
            for (const y of mapping[i]) {
                if (ginfo[y].ensembl.startsWith(prefix)) {
                    replacement.push(y);
                }
            }
            mapping[i] = replacement
        }
    }

    return mapping;
}

