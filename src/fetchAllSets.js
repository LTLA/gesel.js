import { downloader, decompressLines } from "./utils.js";
import { fetchAllCollections } from "./fetchAllCollections.js";

export var init = false;
var _sets = [];

/**
 * @return {Array} Array of objects where each entry corresponds to a set and contains the details about that set.
 * Each object can be expected to contain:
 * 
 * - `name`, the name of the set.
 * - `description`, the description of the set.
 * - `size`, the number of genes in the set.
 * - `collection`, the index of the collection containing the set.
 * - `number`, the number of the set within the collection.
 *
 * In a **gesel** context, the identifier for a set (i.e., the "set ID") is defined as the index of the set in this array.
 * @async
 */
export async function fetchAllSets() {
    if (init) {
        return _sets;
    }

    var [ sres, _collections ] = await Promise.all([downloader("sets.tsv.gz"), fetchAllCollections()]);
    if (!sres.ok) {
        throw "failed to fetch set information";
    }
    var set_data = decompressLines(await sres.arrayBuffer());

    for (var i = 0; i < set_data.length; i++) {
        let x = set_data[i];
        var details = x.split("\t");
        _sets.push({
            "name": details[0],
            "description": details[1],
            "size": Number(details[2])
        });
    }

    let start = 0;
    for (var i = 0; i < _collections.length; i++) {
        let len = _collections[i].size;

        // For easier access going the other way.
        for (var j = 0; j < len; j++) {
            _sets[j + start].collection = i;
            _sets[j + start].number = j;
        }

        start += len;
    }

    init = true;
    return _sets;
}
