import { downloader, decompressLines } from "./utils.js";

var _collections = new Map;

export function already_initialized(species) {
    let found = _collections.get(species);
    if (typeof found !== "undefined") {
        return found;
    } else {
        return null;
    }
}

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
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
 *
 * In a **gesel** context, the identifier for a collection (i.e., the "collection ID") is defined as the index of the collection in this array.
 * @async
 */
export async function fetchAllCollections(species) {
    let target = already_initialized(species);
    if (target !== null) {
        return target;
    }
    target = [];
    _collections.set(species, target);

    var cres = await downloader(species + "_collections.tsv.gz");
    if (!cres.ok) {
        throw new Error("failed to fetch collection information for species '" + species + "'");
    }
    var coll_data = decompressLines(await cres.arrayBuffer());

    var start = 0;
    for (var i = 0; i < coll_data.length; i++) {
        let x = coll_data[i];
        var details = x.split("\t");
        var len = Number(details[5]);
        target.push({
            "title": details[0],
            "description": details[1],
            "species": details[2],
            "maintainer": details[3],
            "source": details[4],
            "start": start,
            "size": len
        });
        start += len;
    }

    return target;
}
