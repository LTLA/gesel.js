import * as utils from "./utils.js";

var n_init = false;
const n_cache = new Map;
var n_ranges;
var n_ordered;

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

async function fetchSetsByToken(token, file, ranges, ordered, cache) {
    let output;

    if (token.includes("*") || token.includes("?")) {
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
                collected.push(utils.retrieveBytes(file, rr[0], rr[1]).then(utils.convertToUint32Array));
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
        let text = await utils.retrieveBytes(file, rr[0], rr[1]);
        output = utils.convertToUint32Array(text);
    }

    cache.set(token, output);
    return output;
}

async function fetchSetsByNameToken(token) {
    let cached = n_cache.get(token);
    if (typeof cached !== "undefined") {
        return cached;
    }

    if (!n_init) {
        const { ranges, order } = await utils.retrieveNamedRanges("tokens-names.tsv")
        n_ranges = ranges;
        n_ordered = order;
        n_init = true;
    }

    return fetchSetsByToken(token, "tokens-names.tsv", n_ranges, n_ordered, n_cache);
}

var d_init = false;
const d_cache = new Map;
var d_ranges;
var d_ordered;

async function fetchSetsByDescriptionToken(token) {
    let cached = d_cache.get(token);
    if (typeof cached !== "undefined") {
        return cached;
    }

    if (!d_init) {
        const { ranges, order } = await utils.retrieveNamedRanges("tokens-descriptions.tsv")
        d_ranges = ranges;
        d_ordered = order;
        d_init = true;
    }

    return fetchSetsByToken(token, "tokens-descriptions.tsv", d_ranges, d_ordered, d_cache);
}

/**
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
export async function searchSetText(query, { inName = true, inDescription = true } = {}) {
    // Tokenizing the query using the same logic as in the feedstock repository,
    // but preserving our wildcards for special handling later.
    let processed = query.toLowerCase().replace(/[^a-zA-Z0-9-?*]/g, " ");
    let tokens = processed.split(/\s+/);
    tokens = tokens.filter(x => x !== "" || x !== "-");

    let gathered_names = [];
    if (inName) {
        for (const tok of tokens) {
            gathered_names.push(fetchSetsByNameToken(tok));
        }
    }

    let gathered_descriptions = [];
    if (inDescription) {
        for (const tok of tokens) {
            gathered_descriptions.push(fetchSetsByDescriptionToken(tok));
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
