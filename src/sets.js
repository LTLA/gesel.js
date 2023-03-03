import { baseUrl, decompressLines } from "./utils.js";

var init = false;
var _collections = [];
var _sets = [];

/**
 * Initialize all set-related **gesel** assets.
 *
 * @return {boolean} `true` once the set and collection information is initialized.
 * If it was already initialized, `false` is returned instead.
 *
 * @async
 */
export async function initializeSets () {
    if (init) {
        return false;
    }

    var [ sres, cres ] = await Promise.all([fetch(baseUrl + "/sets.tsv.gz"), fetch(baseUrl + "/collections.tsv.gz")]);
    if (!sres.ok) {
        throw "failed to fetch set information";
    }
    var sbuffer = await sres.arrayBuffer();
    var set_data = decompressLines(sbuffer);

    set_data.forEach((x, i) => {
        var details = x.split("\t");
        _sets.push({
            "name": details[0],
            "description": details[1],
            "size": Number(details[2])
        });
    });

    if (!cres.ok) {
        throw "failed to fetch collection information";
    }
    var cbuffer = await cres.arrayBuffer();
    var coll_data = decompressLines(cbuffer);

    var start = 0;
    coll_data.forEach((x, i) => {
        var details = x.split("\t");
        var len = Number(details[5]);
        _collections.push({
            "title": details[0],
            "description": details[1],
            "species": details[2],
            "maintainer": details[3],
            "source": details[4],
            "start": start,
            "size": len
        });

        // For easier access going the other way.
        for (var j = 0; j < len; j++) {
            _sets[j + start].collection = i;
            _sets[j + start].number = j;
        }

        start += len;
    });

    init = true;
    return true;
}

/**
 * Retrieve information about each gene set known to **gesel**.
 * This function assumes that the promise returned by {@linkcode initializeSets} has already been resolved.
 *
 * @return {Array} Array of objects where each entry corresponds to a set and contains the details about that set.
 * Each object can be expected to contain:
 * 
 * - `name`, the name of the set.
 * - `description`, the description of the set.
 * - `size`, the number of genes in the set.
 * - `collection`, the index of the collection containing the set.
 * - `number`, the number of the set within the collection.
 */
export function sets() {
    return _sets;
}

var case_init = false;
var cased = [];

/**
 * Retrieve lower-case information about each gene set known to **gesel**,
 * primarily intended for use with case-insensitive text searches.
 * This function assumes that the promise returned by {@linkcode initializeSets} has already been resolved.
 *
 * @return {Array} Array of objects where each entry corresponds to a set.
 * Each object contains:
 *
 * - `name`, the lower-case name of the set.
 * - `description`, the lower-case description of the set.
 */
export function lowerCaseSetDetails() {
    if (!case_init) {
        _sets.forEach(x => {
            cased.push({ 
                name: x.name.toLowerCase(),
                description: x.description.toLowerCase()
            });
        });
        case_init = true;
    }
    return cased;
}

/**
 * Retrieve information about each gene set collection known to **gesel**.
 * This function assumes that the promise returned by {@linkcode initializeSets} has already been resolved.
 *
 * @return {Array} Array of objects where each entry corresponds to a set collection and contains details about that collection.
 * Each object can be expected to contain:
 * 
 * - `title`, the title for the collection.
 * - `description`, the description for the collection.
 * - `species`, the species for all gene identifiers in the collection.
 *   This should contain the full scientific name, e.g., `"Homo sapiens"`, `"Mus musculus"`.
 * - `maintainer`, the maintainer of this collection.
 * - `source`, the source of this set, usually a link to some external resource.
 * - `start`, the index for the first set in the collection in the output of {@linkcode sets}.
 *   All sets from the same collection are stored contiguously.
 * - `size`, the number of sets in the collection.
 */
export function collections() {
    return _collections;
}
