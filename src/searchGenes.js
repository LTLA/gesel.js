import { fetchAllGenes } from "./fetchAllGenes.js";
import { mapGenesByIdentifier } from "./mapGenesByIdentifier.js";

/**
 * @param {string} species - Taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {Array} queries - Array of strings containing gene identifiers of some kind (e.g., Ensembl, symbol, Entrez).
 * @param {object} [options={}] - Optional parameters.
 * @param {?Array} [options.types=null] - Array of strings specifying the identifier types to use for searching.
 * The exact choice of strings depends on how the references were constructed.
 * If `null`, it defaults to an array containing `"entrez"` and `"ensembl"`.
 * @param {boolean} [options.ignoreCaseTypes=true] - Array of strings specifying the identifier types to use for case-insensitive searching.
 * The exact choice of strings depends on how the references were constructed.
 * If `null`, it defaults to an array containing `"symbol"`.
 *
 * @return {Array} An array of length equal to `queries`.
 * Each element of the array is an array containing the **gesel** gene IDs with any identifiers that match the corresponding search string.
 * See {@linkcode fetchAllGenes} for more details on the interpretation of these IDs.
 *
 * @async
 */
export async function searchGenes(species, queries, { types = null, ignoreCaseTypes = null } ={}) {
    if (types === null) {
        types = [ "entrez", "ensembl" ];
    }
    if (ignoreCaseTypes === null) {
        ignoreCaseTypes = [ "symbol" ];
    }

    let promises = [];
    for (const t of types) {
        promises.push(mapGeneByIdentifier(species, t));
    }
    let ipromises = [];
    for (const t of ignoreCaseTypes) {
        ipromises.push(mapGeneByIdentifier(species, t, { lowerCase: true }));
    }
    let [ resolved, iresolved ] = await Promise.all([ Promise.all(promises), Promise.all(ipromises) ]);

    let mapping = [];
    for (var i = 0; i < queries.length; i++) {
        let current = queries[i];
        if (current.length == 0) {
            mapping.push([]);
            continue;
        }

        let findings = [];

        for (var j = 0; j < types.length; j++) {
            let val = resolved[j].get(current);
            if (typeof val !== "undefined") {
                for (const v of val) {
                    findings.push(v);
                }
            }
        }

        current = current.toLowerCase();
        for (var j = 0; j < ignoreCaseTypes.length; j++) {
            let val = resolved[j].get(current);
            if (typeof val !== "undefined") {
                for (const v of val) {
                    findings.push(v);
                }
            }
        }
    }

    return mapping;
}

