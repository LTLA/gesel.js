import { fetchSetsForGene, fetchSetsByNameToken, fetchSetsByDescriptionToken, fetchSetDetails, sets_sizes } from "./mappings.js";

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
