import * as utils from "./utils.js";

export function binarySearch(query, vector) {
    let left = 0;
    let right = vector.length;

    while (left < right) {
        let mid = Math.trunc((left + right) / 2);
        if (vector[mid] < query) {
            left = mid + 1;
        } else if (vector[mid] > query) {
            right = mid;
        } else {
            return mid;
        }
    }

    return left;
}

async function fetchSetsByToken(species, token, file, all_ranges, all_ordered, all_cache) {
    let actual_file = species + "_" + file;

    let cached = all_cache.get(species);
    if (typeof cached === "undefined") {
        const { ranges, order } = await utils.retrieveNamedRanges(actual_file);
        all_ranges.set(species, ranges);
        all_ordered.set(species, order);
        cached = new Map;
        all_cache.set(species, cached);
    }

    if (token == null) {
        return;
    }

    let tfound = cached.get(token);
    if (typeof tfound !== "undefined") {
        return tfound;
    }

    let ranges = all_ranges.get(species);
    let output;
    if (token.includes("*") || token.includes("?")) {
        let ordered = all_ordered.get(species);

        // Wildcard handling.
        let initstub = token.replace(/[*?].*/, "")
        let pos = (initstub == "" ? 0 : binarySearch(initstub, ordered));
        let regex = new RegExp(token.replace(/[*]/g, ".*").replace(/[?]/g, "."));

        let collected = [];

        while (pos < ordered.length) {
            if (initstub != "" && !ordered[pos].startsWith(initstub)) {
                break;
            }
            if (ordered[pos].match(regex)) {
                let rr = ranges.get(ordered[pos]);
                collected.push(utils.retrieveBytes(actual_file, rr[0], rr[1]).then(utils.convertToUint32Array));
            }
            pos++;
        }

        let resolved = await Promise.all(collected);
        let union = new Set;
        for (const x of resolved) {
            for (const y of x) {
                union.add(Number(y));
            }
        }

        output = new Uint32Array(union);

    } else {
        // Direct handling.
        let rr = ranges.get(token);
        if (typeof rr === "undefined") {
            return new Uint8Array;
        }
        let text = await utils.retrieveBytes(actual_file, rr[0], rr[1]);
        output = utils.convertToUint32Array(text);
    }

    cached.set(token, output);
    return output;
}

const n_cache = new Map;
const n_ranges = new Map;
const n_ordered = new Map;

async function fetchSetsByNameToken(species, token) {
    return fetchSetsByToken(species, token, "tokens-names.tsv", n_ranges, n_ordered, n_cache);
}

const d_cache = new Map;
const d_ranges = new Map;
const d_ordered = new Map;

async function fetchSetsByDescriptionToken(species, token) {
    return fetchSetsByToken(species, token, "tokens-descriptions.tsv", d_ranges, d_ordered, d_cache);
}

export async function preloadTokens(species, resp, ordered, cache, msg) {
    if (!resp.ok) {
        throw new Error("failed to fetch full set of " + msg + " tokens for species '" + species + "'");
    }

    let lines = utils.decompressLines(await resp.arrayBuffer());
    if (lines.length !== ordered.length) {
        throw new Error("mismatch in lengths between token names and set indices for species '" + species + "'");
    }

    for (var i = 0; i < lines.length; i++) {
        cache.set(ordered[i], utils.convertToUint32Array(lines[i]));
    }
}

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 *
 * @return Preloads the search indices for use in {@linkcode searchSetText}.
 * This performs a one-off download of the indices such that further calls to {@linkcode searchSetText} do not need to perform HTTP range requests.
 */
export async function preloadSearchSetText(species) {
    let full = await Promise.all([ 
        utils.reference_download(species + "_tokens-names.tsv.gz"),
        utils.reference_download(species + "_tokens-descriptions.tsv.gz"),
        fetchSetsByNameToken(species, null),
        fetchSetsByDescriptionToken(species, null)
    ]);
    await preloadTokens(species, full[0], n_ordered.get(species), n_cache.get(species), "name");
    await preloadTokens(species, full[1], d_ordered.get(species), d_cache.get(species), "description");
    return;
}

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {string} query - Query string containing multiple words to search in the names and/or descriptions of each set.
 *
 * Each stretch of alphanumeric characters and dashes is treated as a single word.
 * All other characters are treated as punctuation between words, except for the following wildcards:
 *
 * - `*`: match zero or more alphanumeric or dash characters.
 * - `?`: match exactly one alphanumeric or dash character.
 *
 * A set's name and/or description must contain all words in `query` to be considered a match.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.inName=true] - Whether to search the name of the set for matching words.
 * @param {boolean} [options.inDescription=true] - Whether to search the description of the set for matching words.
 *
 * @return {Array} Array of indices of the sets with names and/or descriptions that match `query`.
 * @async
 */
export async function searchSetText(species, query, { inName = true, inDescription = true } = {}) {
    // Tokenizing the query using the same logic as in the feedstock repository,
    // but preserving our wildcards for special handling later.
    let processed = query.toLowerCase().replace(/[^a-zA-Z0-9-?*]/g, " ");
    let tokens = processed.split(/\s+/);
    tokens = tokens.filter(x => x !== "" || x !== "-");

    let init = [];
    if (inName) {
        init.push(fetchSetsByNameToken(species, null));
    }
    if (inDescription) {
        init.push(fetchSetsByDescriptionToken(species, null));
    }
    await Promise.all(init); // force initialization of all caches.

    let gathered_names = [];
    if (inName) {
        let already_queried = new Set;
        for (const tok of tokens) {
            if (!already_queried.has(tok)) {
                gathered_names.push(fetchSetsByNameToken(species, tok));
                already_queried.add(tok);
            }
        }
    }

    let gathered_descriptions = [];
    if (inDescription) {
        let already_queried = new Set;
        for (const tok of tokens) {
            if (!already_queried.has(tok)) {
                gathered_descriptions.push(fetchSetsByDescriptionToken(species, tok));
                already_queried.add(tok);
            }
        }
    }

    let resolved_names = await Promise.all(gathered_names);
    let resolved_descriptions = await Promise.all(gathered_descriptions);

    let gathered = [];
    for (var i = 0; i < tokens.length; i++) {
        let n = (inName ? resolved_names[i] : []);
        let d = (inDescription ? resolved_descriptions[i] : []);

        let combined = new Uint32Array(n.length + d.length);
        combined.set(n);
        combined.set(d, n.length);
        gathered.push(combined);
    }

    return utils.intersect(gathered);
}
