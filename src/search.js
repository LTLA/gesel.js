import { fetchSetsForGene, fetchSetsByNameToken, fetchSetsByDescriptionToken, fetchSetDetails, sets_sizes } from "./mappings.js";
import { genes, genesBySymbol, genesByEnsembl, possiblyEnsembl } from "./genes.js";

/**
 * Search for sets with overlaps with the user-supplied set of genes.
 * This function assumes that {@linkcode initialize} (or all components theoref) has already been run. 
 *
 * @param {Array} genes - Array of integers containing indices of genes in the user-supplied set.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.sort=false] - Whether to sort the found sets by overlap percentage.
 *
 * @return {Array} An array of objects, where each object corresponds to a set with non-zero overlaps.
 * Each object contains:
 *
 * - `id`, the index of the set in {@linkcode sets}.
 * - `count`, the number of genes in the set that overlap with genes in `genes`.
 *
 * In the array, objects are sorted by decreasing percentage of overlapping genes in the corresponding set.
 * This favors sets with a stronger relative overlap.
 * However, sets with only one overlapping gene are downweighted as these are not particularly interesting.
 *
 * @async
 */
export async function findOverlappingSets(genes, { sort = false } = {}) {
    var collected = await Promise.all(genes.map(x => fetchSetsForGene(x)));

    var set_count = {};
    for (const found of collected) {
        for (const set of found) {
            if (! (set in set_count)) {
                set_count[set] = 1;
            } else {
                ++(set_count[set]);
            }
        }
    }

    let output = [];
    for (const [id, count] of Object.entries(set_count)) {
        let id0 = Number(id);
        let details = { 
            "id": id0,
            "count": count
        };

        if (sort) {
            let size = sets_sizes[id0];
            // Adding a sorting condition; we give more weight to gene sets
            // with multiple entries.
            let stat = (count == 1 ? 0.000000001 : count) / size;
            details.sort_stat = stat;
        }

        output.push(details);
    }

    if (sort) {
        output.sort((f, s) => s.sort_stat - f.sort_stat);
        output.forEach(x => { delete x.sort_stat; });
    }

    return output;
}

/**
 * Find genes based on their Ensembl IDs or symbols. 
 * This function assumes that {@linkcode initializeGenes} has already been run. 
 *
 * @param [Array] searches - Array of strings, each of which contains the Ensembl ID or symbol for a gene.
 * @param [string] species - String specifying the species of interest.
 * This is used to filter the matching Ensembl IDs to the indicated species.
 * We currently support `"Homo sapiens"`, `"Mus musculus"` and `"Macaca fascicularis"`;
 * any other string is ignored.
 *
 * @return {Array} An array of length equal to `searches`.
 * Each element of the array is an object containing the `status` of the mapping to Ensembl IDs:
 *
 * - If `status = "none"`, there are no matching genes for the search string.
 * - If `status = "ok"`, there is exactly one matching gene, and we report its index (`id`) and Ensembl ID (`ensembl`).
 * - If `status = "filtered"`, there was at least one match but they were all filtered out (e.g., incorrect species, no involvement in any gene sets).
 * - If `status = "multiple"`, there are multiple matches.
 *   We report the indices (`id`) and Ensembl IDs (`ensembl`) for all matching genes.
 */
export function mapMultipleGenes(searches, species) {
    var prefix = null;
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
    }

    var ginfo = genes();
    var by_ens = genesByEnsembl();
    var by_sym = genesBySymbol({ lowerCase: true });

    var mapping = [];

    for (var i = 0; i < searches.length; i++) {
        let current = searches[i];
        if (current.length == 0) {
            mapping.push({ 
                "status": "none" 
            });
            continue;
        }

        if (possiblyEnsembl(current)) {
            let proper = current.toUpperCase();
            if (proper in by_ens && (prefix === null || proper.startsWith(prefix))) { 
                mapping.push({ 
                    "status": "ok", 
                    "id": by_ens[proper],
                    "ensembl": proper
                });
            } else {
                mapping.push({ 
                    "status": "filtered" 
                });
            }
            continue;
        }

        let lowered = current.toLowerCase();
        if (! (lowered in by_sym)) {
            mapping.push({ "status": "none" });
            continue;
        }
        
        let hits = by_sym[lowered];
        let approved = [];
        let ensembls = [];
        for (const hit of hits) {
            let ens0 = ginfo[hit].ensembl;
            if (prefix === null || ens0.startsWith(prefix)) {
                approved.push(hit);
                ensembls.push(ens0);
            }
        }

        if (approved.length > 1) {
            mapping.push({ 
                "status": "multiple", 
                "id": approved, 
                "ensembl": ensembls
            });
        } else if (approved.length == 0) {
            mapping.push({ 
                "status": "filtered" 
            });
        } else {
            mapping.push({ 
                "status": "ok", 
                "id": approved[0], 
                "ensembl": ensembls[0] 
            });
        }
    }

    return mapping;
}

function intersect(arrays) {
    if (arrays.length == 0) {
        return [];
    } else if (arrays.length == 1) {
        return arrays[0];
    }

    let ref = new Set(arrays[0]);
    for (var i = 1; i < arrays.length; i++) {
        let running = new Set;
        for (const x of arrays[i]) {
            if (ref.has(x)) {
                running.add(x);
            }
        }
        ref = running;
    }

    return Array.from(ref);
}

/**
 * Performs a simple search of the name and description text for each set.
 * This function assumes that {@linkcode initialize} (or all components theoref) has already been run. 
 *
 * @param {string} query - Query string.
 * Each stretch of alphanumeric characters and dashes is treated as a single word.
 * A set's name and/or description must contain all words to be considered a match.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.inName=true] - Whether to search the name of the set for matching words.
 * @param {boolean} [options.inDescription=true] - Whether to search the description of the set for matching words.
 *
 * @return {Array} Array of indices of the sets with names and/or descriptions that match `query`.
 * @async
 */
export async function searchSetText(query, { inName = true, inDescription = true } = {}) {
    // Tokenizing the query using the same logic as in build_assets.R.
    let processed = query.toLowerCase().replace(/[^a-zA-Z0-9-]/g, " ");
    let tokens = processed.split(/\s+/);
    tokens = tokens.filter(x => x !== "" || x !== "-");

    let gathered = [];
    let gathered_tokens = [];
    if (inName) {
        for (const tok of tokens) {
            gathered.push(fetchSetsByNameToken(tok));
        }
    }
    if (inDescription) {
        for (const tok of tokens) {
            gathered.push(fetchSetsByDescriptionToken(tok));
        }
    }

    return intersect(await Promise.all(gathered))
}
