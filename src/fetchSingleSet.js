import * as utils from "./utils.js";
import * as full from "./fetchAllSets.js";
import { fetchCollectionSizes } from "./fetchSingleCollection.js";

var init = false;
const cache = new Map;

var ranges = new Map;
var sizes = new Map;
var starts = new Map;

var parents = new Map;
var internal_number = new Map;

async function initialize(species) {
    const [ sres, csizes ] = await Promise.all([ utils.retrieveRangesWithExtras(species + "_sets.tsv"), fetchCollectionSizes() ]);
    ranges.set(species, sres.ranges);
    sizes.set(species, sres.extra);

    let _parents = [];
    let _internal_number = [];
    var totals = 0;
    for (var i = 0; i < csizes.length; i++) {
        let colsize = csizes[i];
        for (var j = 0; j < colsize; j++) {
            _parents.push(i);
            _internal_number.push(j);
        }
        totals += colsize;
    }

    if (totals != sizes.length) {
        throw new Error("discrepancy between number of sets and sum of collection sizes");
    }

    parents.set(species, _parents);
    internal_number.set(species, _internal_number);
    cache.set(species, new Map);
    return;
}

export async function fetchSetSizes(species) {
    let _sizes = sizes.get(species);
    if (typeof _sizes == "undefined") {
        let found = full.already_initialized(species);

        if (found !== null) {
            // Pulling it from the full info instead, if we already got it.
            let tmp_sizes = [];
            for (const x of found) {
                tmp_sizes.push(x.size);
            }
            sizes.set(species, tmp_sizes);
            return tmp_sizes;
        }

        await initialize(species);
    }

    return _sizes;
}

/**
 * @return {number} Total number of sets.
 */
export async function numberOfSets() {
    if (!init) {
        if (full.init) {
            return (await full.fetchAllSets()).length;
        }
        await initialize();
    }
    return sizes.length;
}

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {number} set - Set ID, see {@linkcode fetchAllSets} for details.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.forceRequest=false] - Whether to force a request to the server.
 * By default, the cached collection information is used if {@linkcode fetchAllSets} has previously been called.
 * Setting this to `true` is only useful for testing.
 *
 * @return {object} Object containing the details of the set.
 * This should be identical to the corresponding entry of the array returned by {@linkcode fetchAllSets}.
 *
 * @async
 */
export async function fetchSingleSet(species, set, { forceRequest = false } = {}) {
    let ffound = full.already_initialized(species);
    if (ffound !== null && !forceRequest) {
        return ffound[set];
    }

    let cached = cache.get(species);
    if (typeof cached === "undefined") {
        await initialize();
        cached = cache.get(species);
    }

    let sfound = cached.get(set);
    if (typeof sfound !== "undefined") {
        return sfound;
    }

    let text = await utils.retrieveBytesByIndex("sets.tsv", ranges.get(species), set);
    let split = text.split("\t");
    let output = {
        name: split[0],
        description: split[1],
        size: sizes[set],
        collection: parents.get(species)[set],
        number: internal_number.get(species)[set]
    };

    cached.set(set, output);
    return output;
}


