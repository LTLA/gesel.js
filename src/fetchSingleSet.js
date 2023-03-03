import * as utils from "./utils.js";
import * as full from "./fetchAllSets.js";
import { fetchCollectionSizes } from "./fetchSingleCollection.js";

var init = false;
const cache = new Map;

var ranges;
var sizes;
var starts;

var parents;
var internal_number;

async function initialize() {
    const [ sres, csizes ] = await Promise.all([ utils.retrieveRangesWithExtras("sets.tsv"), fetchCollectionSizes() ]);
    ranges = sres.ranges;
    sizes = sres.extra;

    parents = [];
    internal_number = [];
    var totals = 0;
    for (var i = 0; i < csizes.length; i++) {
        let colsize = csizes[i];
        for (var j = 0; j < colsize; j++) {
            parents.push(i);
            internal_number.push(j);
        }
        totals += colsize;
    }

    if (totals != sizes.length) {
        throw new Error("discrepancy between number of sets and sum of collection sizes");
    }

    return true;
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
export async function fetchSingleSet(set, { forceRequest = false } = {}) {
    if (full.init && !forceRequest) {
        return (await full.fetchAllSets())[set];
    }

    let cached = cache.get(set);
    if (typeof cached !== "undefined") {
        return cached;
    }

    if (!init) {
        await initialize();
    }

    let text = await utils.retrieveBytesByIndex("sets.tsv", ranges, set);
    let split = text.split("\t");
    let output = {
        name: split[0],
        description: split[1],
        size: sizes[set],
        collection: parents[set],
        number: internal_number[set]
    };

    cache.set(set, output);
    return output;
}


